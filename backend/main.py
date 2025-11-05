from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import uvicorn

from database import SessionLocal, engine, Base
from models import User, VNCMachine
from schemas import (
    UserCreate, UserResponse, UserUpdate,
    VNCMachineCreate, VNCMachineUpdate, VNCMachineResponse,
    Token, TokenData
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VNC Manager API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Auth endpoints
@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_admin=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# User management (admin only)
@app.get("/api/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        db_user.email = user_update.email
    if user_update.full_name:
        db_user.full_name = user_update.full_name
    if user_update.is_admin is not None:
        db_user.is_admin = user_update.is_admin
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


# VNC Machine endpoints
@app.get("/api/machines", response_model=List[VNCMachineResponse])
def get_machines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get admin machines (shared) and user's own machines
    machines = db.query(VNCMachine).filter(
        (VNCMachine.is_shared == True) | (VNCMachine.owner_id == current_user.id)
    ).all()
    return machines


@app.get("/api/machines/admin", response_model=List[VNCMachineResponse])
def get_admin_machines(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    machines = db.query(VNCMachine).filter(VNCMachine.is_shared == True).all()
    return machines


@app.post("/api/machines", response_model=VNCMachineResponse, status_code=status.HTTP_201_CREATED)
def create_machine(
    machine: VNCMachineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_machine = VNCMachine(
        name=machine.name,
        url=machine.url,
        description=machine.description,
        owner_id=current_user.id,
        is_shared=machine.is_shared if current_user.is_admin else False
    )
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine


@app.put("/api/machines/{machine_id}", response_model=VNCMachineResponse)
def update_machine(
    machine_id: int,
    machine_update: VNCMachineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_machine = db.query(VNCMachine).filter(VNCMachine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Check permissions
    if not current_user.is_admin and db_machine.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if machine_update.name:
        db_machine.name = machine_update.name
    if machine_update.url:
        db_machine.url = machine_update.url
    if machine_update.description is not None:
        db_machine.description = machine_update.description
    if machine_update.is_shared is not None and current_user.is_admin:
        db_machine.is_shared = machine_update.is_shared
    
    db.commit()
    db.refresh(db_machine)
    return db_machine


@app.delete("/api/machines/{machine_id}")
def delete_machine(
    machine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_machine = db.query(VNCMachine).filter(VNCMachine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Check permissions
    if not current_user.is_admin and db_machine.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(db_machine)
    db.commit()
    return {"message": "Machine deleted successfully"}


@app.get("/api/machines/{machine_id}", response_model=VNCMachineResponse)
def get_machine(
    machine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_machine = db.query(VNCMachine).filter(VNCMachine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Check permissions
    if not db_machine.is_shared and db_machine.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_machine


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

