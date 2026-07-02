from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import products_router  # Tu importación limpia original intacta
from app.routers.auth import router as auth_router # 👈 Importación directa libre de bugs

# 1. Inicializar la aplicación FastAPI con la configuración del .env
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend de alto rendimiento para la plataforma de zapatillas SneakerHub Ayacucho",
    version="1.0.0"
)

# 2. Configurar las reglas de origen cruzado (CORS) - Requisito RNF-02
origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# 3. Incluir los enrutadores modulares del sistema
app.include_router(products_router)
app.include_router(auth_router) # 👈 Incluimos el nuevo módulo de seguridad

# 4. Endpoint base de verificación de funcionamiento (Fase X4)
@app.get("/", tags=["Verificación Base"])
def verificar_servidor():
    return {
        "status": "Online",
        "proyecto": settings.PROJECT_NAME,
        "mensaje": "El servidor de SneakerHub está operando correctamente bajo la arquitectura FastAPI."
    }