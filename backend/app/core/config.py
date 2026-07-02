import os
from dotenv import load_dotenv

# 1. Intentar cargar el archivo .env desde el directorio actual (backend/)
load_dotenv()

# 2. Como respaldo, intentar cargarlo si está en la raíz principal (sneakerhub/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env'))
load_dotenv(dotenv_path="../.env")

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SneakerHub API")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CONTRASENA_SUPER_SECRETA_Y_AL_AZAR_PARA_FIRMAR_JWT")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))
    
    # Credenciales mapeadas desde el entorno
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "") # Si no encuentra nada, enviará vacío
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "sneakerhub_db")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()