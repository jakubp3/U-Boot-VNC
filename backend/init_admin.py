"""
Skrypt do inicjalizacji konta administratora.
Uruchom: python init_admin.py
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash, verify_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_admin(username: str, email: str, password: str, full_name: str = ""):
    db: Session = SessionLocal()
    try:
        # Ensure password is a string
        password = str(password).strip()[:72]
        
        # Check if user exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"Użytkownik {username} już istnieje. Aktualizowanie uprawnień...")
            existing_user.is_admin = True
            hashed = get_password_hash(password)
            existing_user.hashed_password = hashed
            db.commit()
            
            # Verify password
            if verify_password(password, existing_user.hashed_password):
                print(f"✅ Użytkownik {username} został ustawiony jako administrator.")
            else:
                print(f"⚠️  Błąd weryfikacji hasła!")
            return
        
        # Create new admin user
        hashed = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hashed,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        
        # Verify password
        test_user = db.query(User).filter(User.username == username).first()
        if test_user and verify_password(password, test_user.hashed_password):
            print(f"✅ Konto administratora {username} zostało utworzone.")
        else:
            print(f"⚠️  Konto utworzone, ale weryfikacja hasła nie powiodła się!")
    except Exception as e:
        db.rollback()
        print(f"Błąd: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 4:
        print("Użycie: python init_admin.py <username> <email> <password> [full_name]")
        sys.exit(1)
    
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    full_name = sys.argv[4] if len(sys.argv) > 4 else ""
    
    create_admin(username, email, password, full_name)

