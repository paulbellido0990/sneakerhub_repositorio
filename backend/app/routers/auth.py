from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm  # 👈 Importamos el selector nativo
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta
import bcrypt 

from app.database import get_db
from app.models.user import UsuarioAdmin  

router = APIRouter(prefix="/auth", tags=["Autenticación"])

SECRET_KEY = "SNEAKERHUB_SUPER_SECRET_KEY_AYACUCHO"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Configuración de la ruta de la llave para Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

# =============================================================================
# ENDPOINT DE LOGIN OPTIMIZADO PARA FORMULARIOS OAUTH2
# =============================================================================
@router.post("/login", response_model=TokenResponse)
def login(
    payload: OAuth2PasswordRequestForm = Depends(), # 👈 Captura automáticamente username y password desde Swagger o Frontend
    db: Session = Depends(get_db)
):
    try:
        # OAuth2PasswordRequestForm mapea el correo en la propiedad '.username'
        usuario = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == payload.username).first()
        
        password_valida = False
        if usuario and usuario.contrasena_hash:
            password_bytes = payload.password.encode('utf-8')
            hash_en_db_bytes = usuario.contrasena_hash.encode('utf-8')
            password_valida = bcrypt.checkpw(password_bytes, hash_en_db_bytes)

        if not usuario or not password_valida:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Correo o contraseña incorrectos."}
            )
            
        tiempo_expiracion = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_payload = {
            "sub": usuario.correo,
            "role": "ADMIN",  
            "exp": tiempo_expiracion
        }
        
        token_firmado = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "access_token": token_firmado,
            "token_type": "bearer",
            "role": "ADMIN"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error interno: {str(e)}"}
        )

def obtener_admin_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    excepcion_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de acceso inválido o expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("role")
        
        if email is None or rol != "ADMIN":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Acceso denegado. No cuentas con privilegios de Administrador."}
            )
    except JWTError:
        raise excepcion_credenciales
        
    usuario = db.query(UsuarioAdmin).filter(UsuarioAdmin.correo == email).first()
    if usuario is None:
        raise excepcion_credenciales
    return usuario