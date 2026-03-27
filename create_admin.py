from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    admin = User(
        username="admin",
        email="admin@dentistry.com",
        hashed_password=hash_password("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin)
    print("Admin user created")

user = db.query(User).filter(User.username == "user").first()
if not user:
    user = User(
        username="user",
        email="user@dentistry.com",
        hashed_password=hash_password("user123"),
        role="user",
        is_active=True
    )
    db.add(user)
    print("Regular user created")

db.commit()
db.close()
print("\nUsers created successfully!")
print("Admin login: admin / admin123")
print("User login: user / user123")