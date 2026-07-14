import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Recuperar la URL de la base de datos de las variables de entorno
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:password@localhost:3306/sneakerhub"
)

# 2. Configurar argumentos de conexión SSL elásticos
connect_args = {}

# Si la URL contiene 'aivencloud' (producción), configuramos la encriptación SSL requerida por Aiven
if "aivencloud" in DATABASE_URL:
    connect_args = {
        "ssl": {
            "ssl_mode": "REQUIRED"  # Fuerza la negociación segura SSL con Aiven
        }
    }

# 3. Crear el motor transaccional optimizado con nuestro pool de conexiones
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()