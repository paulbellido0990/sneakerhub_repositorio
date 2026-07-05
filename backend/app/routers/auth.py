from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import bcrypt  # 🌟 SOLUCIÓN: Usamos el motor nativo directamente sin pasar por passlib
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import UsuarioAdmin 

# =============================================================================
# 🔐 CONFIGURACIÓN DE SEGURIDAD GLOBAL (JWT)
# =============================================================================
SECRET_KEY = "SNEAKERHUB_AYACUCHO_SECRET_KEY_2026_MIGRATION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 días de sesión activa

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

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    rol: str

# =============================================================================
# 🛠️ FUNCIONES UTILITARIAS DE CIFRADO NATIVO (REFACTORIZADO)
# =============================================================================
def verificar_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara la contraseña en texto plano con el hash de la base de datos.
    Bcrypt exige que ambos strings se transformen a bytes (.encode('utf-8')).
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def obtener_password_hash(password: str) -> str:
    """
    Genera un salt seguro y encripta la contraseña regresando un string limpio.
    """
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
# 🚪 ENDPOINT: INICIO DE SESIÓN
# =============================================================================
@router.post("/login", response_model=TokenResponse, summary="Autenticar usuario y proveer JWT con Rol")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    # Consulta usando la columna real detectada en tu MySQL ('correo')
    user = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == payload.email).first()
    
    if not user or not verificar_password(payload.password, user.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico o la contraseña son incorrectos."
        )
    
    # Payload seguro del JWT
    token_payload = {
        "sub": user.correo,
        "rol": user.rol,
        "id": user.id
    }
    
    access_token = crear_access_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": user.rol
    }

# =============================================================================
# 🛡️ GUARDIÁN DE SEGURIDAD
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
        
        if rol is None:
            raise credentials_exception
            
        if rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado: Se requieren privilegios de Administrador."
            )
            
        return payload
        
    except JWTError:
        raise credentials_exception