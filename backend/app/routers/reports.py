import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Producto, VarianteColor, TallaStock, Marca
from app.routers.auth import verificar_admin

router = APIRouter(
    prefix="/api/admin/reportes",
    tags=["Reportes Analíticos"]
)

# =============================================================================
# 📊 RUTA ANALÍTICA CORREGIDA: EXTRACCIÓN DE ENTIEDAD COLOR (HU-08)
# =============================================================================
@router.get("/bajo-stock", summary="Telemetría de inventarios críticos (Stock <= 2)")
def obtener_bajo_stock(
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin) # 🔐 Guardián perimetral JWT activo
):
    """
    Extrae las alertas de stock y parsea de forma inteligente si el atributo color
    es un String plano o una relación de tabla de base de datos (objeto).
    """
    try:
        # 1. Extraer las filas críticas de la tabla de stock (Criterio Stock <= 2)
        alertas_inventario = db.query(TallaStock).filter(TallaStock.stock <= 2).all()

        reporte_mapeado = []

        # 2. Resolver las dependencias de forma secuencial por ID físico
        for item in alertas_inventario:
            
            # Lookup de la variante de color
            variante = db.query(VarianteColor).filter(VarianteColor.id == item.variante_color_id).first()
            if not variante:
                continue
            
            # Lookup del producto base asegurando que esté activo en la vitrina
            producto = db.query(Producto).filter(Producto.id == variante.producto_id).first()
            if not producto or producto.estado != "ACTIVO":
                continue
            
            # Lookup de la marca fabricante
            marca_nombre = "Sin Marca"
            if producto.marca_id:
                marca = db.query(Marca).filter(Marca.id == producto.marca_id).first()
                if marca:
                    marca_nombre = marca.nombre

            # 🌟 EXTRACCIÓN ELÁSTICA: Soporta cadenas y objetos relacionales de Color ({id, nombre, codigo_hex})
            color_text = "Estándar"
            for attr in ["color", "color_nombre", "nombre_color"]:
                if hasattr(variante, attr) and getattr(variante, attr):
                    val = getattr(variante, attr)
                    
                    # SI ES UN OBJETO RELACIONAL: Extraemos su propiedad 'nombre' descubierta en consola
                    if hasattr(val, "nombre") and getattr(val, "nombre"):
                        color_text = getattr(val, "nombre")
                    # Fallback si el objeto tiene formato de diccionario por configuración del ORM
                    elif isinstance(val, dict) and "nombre" in val:
                        color_text = val["nombre"]
                    # SI ES UNA CADENA DE TEXTO DIRECTA:
                    elif isinstance(val, str):
                        color_text = val
                    break

            # Insertar nodo formateado con un String primitivo puro hacia el Frontend
            reporte_mapeado.append({
                "talla_id": item.id,
                "producto_id": producto.id,
                "nombre": producto.nombre,
                "marca": marca_nombre,
                "color": str(color_text), # Garantiza que viaje un texto limpio hacia React
                "talla": item.talla,
                "stock": item.stock
            })
        
        # 3. Ordenación: los quiebres absolutos (Stock = 0) van primero
        reporte_mapeado.sort(key=lambda x: x["stock"])
        
        return reporte_mapeado

    except Exception as e:
        print("\n" + "="*80)
        print("🚨 DETECTOR DE EXCEPCIONES EN TELEMETRÍA (REPORTS.PY):")
        traceback.print_exc()
        print("="*80 + "\n")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la resolución interna de inventarios: {str(e)}"
        )