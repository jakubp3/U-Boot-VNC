"""
Skrypt do inicjalizacji konta administratora.
Uruchom: python init_admin.py
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth import get_password_hash

def create_admin(username: str, email: str, password: str, full_name: str = ""):
    db: Session = SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"Użytkownik {username} już istnieje. Aktualizowanie uprawnień...")
            existing_user.is_admin = True
            existing_user.hashed_password = get_password_hash(password)
            db.commit()
            print(f"Użytkownik {username} został ustawiony jako administrator.")
            return
        
        # Create new admin user
        admin_user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Konto administratora {username} zostało utworzone.")
    except Exception as e:
        db.rollback()
        print(f"Błąd: {e}")
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

