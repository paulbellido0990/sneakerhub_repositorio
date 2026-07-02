from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# CONFIGURACIÓN DE CONEXIÓN DIRECTA (EVITA ERRORES DE LECTURA DEL .env)
# =============================================================================
# Cambia 'TU_CONTRASEÑA_AQUÍ' por la clave real que usas en MySQL Workbench o phpMyAdmin
# Ejemplo si tu clave es 1234: "mysql+pymysql://root:1234@127.0.0.1:3306/sneakerhub_db"

URL_DIRECTA = "mysql+pymysql://root:123456@127.0.0.1:3306/sneakerhub_db"

# 1. Configurar el motor con la ruta explícita
engine = create_engine(
    URL_DIRECTA,
    pool_pre_ping=True,
    pool_recycle=3600
)

# 2. Configurar la fábrica de sesiones locales e independientes
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 3. Clase Base para el mapeo de modelos
Base = declarative_base()

# 4. Proveedor de Contexto (Dependency Injection) para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()