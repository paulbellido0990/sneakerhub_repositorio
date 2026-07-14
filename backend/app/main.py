from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import products_router  
from app.routers.auth import router as auth_router 
from app.routers.orders import router as orders_router 
from app.routers.reports import router as reports_router # 🌟 1. IMPORTAR EL ENRUTADOR ANALÍTICO (HU-08)

# Inicializar la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend de alto rendimiento para la plataforma de zapatillas SneakerHub Ayacucho",
    version="1.0.0"
)

# Configurar las reglas de origen cruzado (CORS)
# Agregamos tu dominio de Vercel de manera limpia (sin barra diagonal '/' al final)
origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
    "https://sneakerhub-repositorio.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Incluir los enrutadores modulares del sistema
app.include_router(products_router)
app.include_router(auth_router, prefix="/auth", tags=["Autenticación"]) # 🌟 CORREGIDO: Agrupación perimetral para compatibilidad con la suite de Postman
app.include_router(orders_router) 
app.include_router(reports_router) # 🌟 2. ACOPLAR EL CANAL DE TELEMETRÍA DE BAJO STOCK (HU-08)

@app.get("/", tags=["Verificación Base"])
def verificar_servidor():
    return {
        "status": "Online",
        "proyecto": settings.PROJECT_NAME,
        "mensaje": "El servidor de SneakerHub está operando correctamente bajo la arquitectura FastAPI."
    }