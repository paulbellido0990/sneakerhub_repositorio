from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

# 1. Configurar el contexto de encriptación utilizando el algoritmo Bcrypt
# El parámetro deprecated="auto" asegura compatibilidad si el algoritmo se actualiza en el futuro
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =============================================================================
# FUNCIONES DE SEGURIDAD PARA CONTRASEÑAS (BCRYPT) - REQUISITO RNF-01
# =============================================================================

def get_password_hash(password: str) -> str:
    """
    Recibe una contraseña en texto plano y genera un hash irreversible.
    Se utilizará durante el registro de clientes (HU-06) y creación de admins.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara una contraseña en texto plano con el hash almacenado en la base de datos.
    Retorna True si coinciden, False en caso contrario (HU-04 y HU-06).
    """
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# FUNCIONES DE AUTENTICACIÓN POR TOKEN (JWT) - REQUISITO RF-01 / HU-04
# =============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Genera un token JSON Web Token (JWT) firmado criptográficamente.
    El payload ('data') incluirá la identidad del usuario y su rol (admin/cliente).
    """
    to_encode = data.copy()
    
    # Calcular el tiempo exacto de expiración del token (basado en UTC)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Inyectar el parámetro de expiración 'exp' en el cuerpo del token
    to_encode.update({"exp": expire})
    
    # Firmar el token utilizando la llave secreta y el algoritmo configurados en el .env
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida la autenticidad de un token JWT recibido en una petición HTTP.
    Retorna el diccionario con los datos del usuario si el token es válido y no ha expirado.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        # Retorna None si el token fue manipulado, alterado o ya expiró
        return None