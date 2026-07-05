from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app.database import get_db
from app.models.order import Pedido, DetallePedido
from app.models.product import Producto, Marca, VarianteColor, TallaStock
from app.routers.auth import verificar_admin

router = APIRouter(
    prefix="/api/admin/reportes",
    tags=["Reportes y Analítica"]
)

# =============================================================================
# 📋 ENDPOINT ANTIGUO: TELEMETRÍA DE BAJO STOCK (MANTENIDO PARA HU-08)
# =============================================================================
@router.get("/bajo-stock", summary="Telemetría de variantes con stock crítico")
def reportar_bajo_stock(db: Session = Depends(get_db), admin_actual = Depends(verificar_admin)):
    try:
        resultados = db.query(
            TallaStock.id.label("talla_id"),
            TallaStock.talla,
            TallaStock.stock,
            VarianteColor.id.label("variante_id"),
            VarianteColor.color,
            Producto.nombre,
            Marca.nombre.label("marca")
        ).join(
            VarianteColor, TallaStock.variante_color_id == VarianteColor.id
        ).join(
            Producto, VarianteColor.producto_id == Producto.id
        ).join(
            Marca, Producto.marca_id == Marca.id
        ).filter(
            TallaStock.stock <= 2,
            Producto.estado == "ACTIVO"
        ).order_by(
            TallaStock.stock.asc()
        ).all()
        
        return [dict(r._mapping) for r in resultados]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en agregación de MySQL: {str(e)}")


# =============================================================================
# 📊 NUEVO ENDPOINT (HU-13): CORE DE INTELIGENCIA DE NEGOCIO (BI)
# =============================================================================
@router.get("/dashboard-bi", summary="Extraer métricas agregadas de rendimiento comercial")
def obtener_dashboard_bi(db: Session = Depends(get_db), admin_actual = Depends(verificar_admin)):
    """
    Calcula de forma síncrona los KPI económicos del mes en curso, el Top 3 de modelos
    con mayor rotación en Ayacucho y el market share interno por marcas fabricantes.
    """
    try:
        ahora = datetime.utcnow()
        mes_actual = ahora.month
        anio_actual = ahora.year

        # 1. KPI: Ingresos totales acumulados en el mes activo (Solo ventas reales)
        ingresos_mes = db.query(func.sum(Pedido.total)).filter(
            extract('month', Pedido.fecha_pedido) == mes_actual,
            extract('year', Pedido.fecha_pedido) == anio_actual,
            Pedido.estado != "PENDIENTE" # Excluimos preventas o pedidos no confirmados
        ).scalar() or 0.0

        # 2. TOP 3: Zapatillas más vendidas por volumen de unidades
        top_zapatillas_query = db.query(
            Producto.nombre,
            func.sum(DetallePedido.cantidad).label("unidades_vendidas")
        ).join(
            DetallePedido, DetallePedido.producto_id == Producto.id
        ).join(
            Pedido, DetallePedido.pedido_id == Pedido.id
        ).filter(
            Pedido.estado != "PENDIENTE"
        ).group_by(
            Producto.id
        ).order_by(
            func.sum(DetallePedido.cantidad).desc()
        ).limit(3).all()

        top_3_zapatillas = [
            {"nombre": r.nombre, "unidades": int(r.unidades_vendidas)} 
            for r in top_zapatillas_query
        ]

        # 3. SHARE: Distribución de mercado interno por marca fabricante
        distribucion_marcas_query = db.query(
            Marca.nombre,
            func.sum(DetallePedido.cantidad).label("unidades_marca")
        ).join(
            Producto, Producto.marca_id == Marca.id
        ).join(
            DetallePedido, DetallePedido.producto_id == Producto.id
        ).join(
            Pedido, DetallePedido.pedido_id == Pedido.id
        ).filter(
            Pedido.estado != "PENDIENTE"
        ).group_by(
            Marca.id
        ).all()

        total_unidades_marcas = sum(int(r.unidades_marca) for r in distribucion_marcas_query) or 1

        share_marcas = [
            {
                "marca": r.nombre,
                "unidades": int(r.unidades_marca),
                "porcentaje": round((int(r.unidades_marca) / total_unidades_marcas) * 100, 1)
            }
            for r in distribucion_marcas_query
        ]

        return {
            "ingresos_mensuales": float(ingresos_mes),
            "top_3": top_3_zapatillas,
            "distribucion_marcas": share_marcas
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo en la consulta analítica multidimensional: {str(e)}"
        )