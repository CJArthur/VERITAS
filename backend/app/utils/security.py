from passlib.context import CryptContext
import secrets


# Use bcrypt algorithm for hashing passwords
pwd_context = CryptContext(schemes = ["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

# Generate 32-symbol's token
def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

