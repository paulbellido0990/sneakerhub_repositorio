import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import bcrypt
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import UsuarioAdmin 

SECRET_KEY = "SNEAKERHUB_AYACUCHO_SECRET_KEY_2026_MIGRATION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación"]
)

# =============================================================================
# 📋 ESQUEMAS DE VALIDACIÓN (PYDANTIC)
# =============================================================================
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: str 

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    rol: str
    nombre: str 

# =============================================================================
# 🛠️ UTILS
# =============================================================================
def verificar_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def obtener_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def crear_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# =============================================================================
# ➕ ENDPOINT: REGISTRO PÚBLICO DE CLIENTES (HU-06)
# =============================================================================
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Registro síncrono de clientes con validación Regex")
def registrar_cliente(payload: UserRegister, db: Session = Depends(get_db)):
    correo_existente = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == payload.email).first()
    if correo_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error: El correo electrónico ya se encuentra registrado en la plataforma."
        )

    regex_telefono = r"^\d{9}$"
    if not re.match(regex_telefono, payload.telefono):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error formativo: El campo telefónico debe contener exactamente 9 dígitos numéricos."
        )

    nuevo_cliente = UsuarioAdmin(
        nombre=payload.nombre,
        correo=payload.email,
        contrasena_hash=obtener_password_hash(payload.password),
        telefono=payload.telefono,
        rol="cliente" 
    )
    
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    token_payload = {"sub": nuevo_cliente.correo, "rol": nuevo_cliente.rol, "id": nuevo_cliente.id}
    access_token = crear_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": nuevo_cliente.rol,
        "nombre": nuevo_cliente.nombre
    }

# =============================================================================
# 🚪 ENDPOINT: INICIO DE SESIÓN
# =============================================================================
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == payload.email).first()
    
    if not user or not verificar_password(payload.password, user.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico o la contraseña son incorrectos."
        )
    
    token_payload = {"sub": user.correo, "rol": user.rol, "id": user.id}
    access_token = crear_access_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": user.rol,
        "nombre": user.nombre 
    }

# =============================================================================
# 🛡️ GUARDIANES DE SEGURIDAD INDEPENDIENTES (MIGRACIÓN V6.0)
# =============================================================================
def verificar_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión activa.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        rol: str = payload.get("rol")
        
        if rol is None or rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado: Se requieren privilegios de Administrador."
            )
        return payload
    except JWTError:
        raise credentials_exception

# 🌟 NUEVO: Guardián perimetral elástico para cualquier usuario autenticado (HU-11)
def verificar_usuario(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión inválida o expirada. Por favor, vuelva a iniciar sesión.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub") # El correo almacenado en 'sub'
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Buscamos el registro del cliente en la base de datos
    usuario = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == email).first()
    if usuario is None:
        raise credentials_exception
    return usuario # Retorna el objeto de base de datos completo