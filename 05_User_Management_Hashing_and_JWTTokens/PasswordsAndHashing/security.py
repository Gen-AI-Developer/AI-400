from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

# Initialize the password hasher
hasher = PasswordHash((Argon2Hasher(),))

def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a given hash."""
    return hasher.verify(plain_password, hashed_password)

# Example usage:
if __name__ == "__main__":
    password = "my_secure_password"
    hashed = hash_password(password)
    print(f"Hashed password: {hashed}")

    # Verify the password
    is_valid = verify_password(password, hashed)
    print(f"Password valid: {is_valid}")

    # Verify with an incorrect password
    is_valid = verify_password("wrong_password", hashed)
    print(f"Password valid with wrong password: {is_valid}")