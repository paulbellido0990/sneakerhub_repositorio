from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models.order import Pedido, DetallePedido
from app.models.product import TallaStock, VarianteColor

router = APIRouter(
    prefix="/api/pedidos",
    tags=["Pedidos"]
)

# Schemas de validación Pydantic
class DetalleCreate(BaseModel):
    producto_id: int
    talla: str
    cantidad: int
    precio_unitario: float

class PedidoCreate(BaseModel):
    nombre_cliente: str = "Cliente SneakerHub"
    detalles: List[DetalleCreate]


# =============================================================================
# 📋 ENDPOINT: LISTAR HISTORIAL DE VENTAS CON DESGLOSE DE PRODUCTOS
# =============================================================================
@router.get("/", summary="Listar todos los pedidos asentados")
def listar_pedidos(db: Session = Depends(get_db)):
    """
    Trae el histórico completo desde MySQL realizando una carga profunda relacional 
    para inyectar los datos del Producto en cada renglón del detalle.
    """
    try:
        # 🌟 MEJORADO: Carga en cascada Pedido -> Detalles -> Producto para capturar los nombres reales
        pedidos = db.query(Pedido).options(
            joinedload(Pedido.detalles).joinedload(DetallePedido.producto)
        ).order_by(Pedido.fecha_pedido.desc()).all()
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo extraer el historial auditor: {str(e)}")


# =============================================================================
# 💳 ENDPOINT: REGISTRAR NUEVO PEDIDO
# =============================================================================
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Registrar Pedido y Descontar Stock")
def registrar_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    try:
        total_calculado = sum(item.cantidad * item.precio_unitario for item in payload.detalles)

        nuevo_pedido = Pedido(
            total=total_calculado,
            estado="PENDIENTE",
            nombre_cliente=payload.nombre_cliente
        )
        db.add(nuevo_pedido)
        db.commit()
        db.refresh(nuevo_pedido)

        for item in payload.detalles:
            detalle = DetallePedido(
                pedido_id=nuevo_pedido.id,
                producto_id=item.producto_id,
                talla=item.talla,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            )
            db.add(detalle)

            variante = db.query(VarianteColor).filter(VarianteColor.producto_id == item.producto_id).first()
            if not variante:
                raise HTTPException(status_code=404, detail=f"No se encontró stock inicializado para el producto ID {item.producto_id}")

            registro_stock = db.query(TallaStock).filter(
                TallaStock.variante_color_id == variante.id,
                TallaStock.talla == item.talla
            ).first()

            if not registro_stock or registro_stock.stock < item.cantidad:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para la talla {item.talla}."
                )

            registro_stock.stock -= item.cantidad

        db.commit()
        return {
            "status": "Éxito",
            "pedido_id": nuevo_pedido.id,
            "mensaje": "Venta asentada en MySQL y stock actualizado correctamente."
        }

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno en la transacción: {str(e)}")