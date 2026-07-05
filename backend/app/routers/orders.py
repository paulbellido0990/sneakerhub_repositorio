from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models.order import Pedido, DetallePedido
from app.models.product import TallaStock, VarianteColor
from app.routers.auth import verificar_usuario, verificar_admin 

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
    codigo_pago: str # 🌟 MIGRACIÓN V9.1: Campo mandatorio para auditoría antifraude
    detalles: List[DetalleCreate]

class EstadoUpdate(BaseModel):
    estado: str


# =============================================================================
# 🔐 ENDPOINT PROTEGIDO ADMINISTRATIVO (HU-12): ACTUALIZAR ESTADO DE PEDIDO
# =============================================================================
@router.put("/{pedido_id}/estado", summary="Actualizar el estado transaccional de un pedido")
def actualizar_estado_pedido(
    pedido_id: int,
    payload: EstadoUpdate,
    db: Session = Depends(get_db),
    admin_actual = Depends(verificar_admin)
):
    try:
        estados_permitidos = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO"]
        nuevo_estado = payload.estado.upper()

        if nuevo_estado not in estados_permitidos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido. Valores aceptados por el motor: {estados_permitidos}"
            )

        pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró el registro del pedido con ID #{pedido_id}."
            )

        pedido.estado = nuevo_estado
        db.commit()

        return {
            "status": "Éxito",
            "pedido_id": pedido_id,
            "nuevo_estado": nuevo_estado,
            "mensaje": "Estado de la orden sincronizado correctamente en MySQL."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el motor transaccional al mutar el estado: {str(e)}"
        )


# =============================================================================
# 🛡️ ENDPOINT PROTEGIDO (HU-11): HISTORIAL PROPIO DEL CLIENTE AUTENTICADO
# =============================================================================
@router.get("/mis-pedidos", summary="Listar pedidos del cliente autenticado")
def listar_mis_pedidos(
    db: Session = Depends(get_db),
    usuario_actual = Depends(verificar_usuario)
):
    try:
        pedidos_cliente = db.query(Pedido).options(
            joinedload(Pedido.detalles).joinedload(DetallePedido.producto)
        ).filter(
            Pedido.nombre_cliente == usuario_actual.nombre
        ).order_by(
            Pedido.fecha_pedido.desc()
        ).all()
        
        return pedidos_cliente
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo en la extracción del perfil transaccional del cliente: {str(e)}"
        )


# =============================================================================
# 📋 ENDPOINT ADMINISTRATIVO: LISTAR HISTORIAL GLOBAL DE VENTAS
# =============================================================================
@router.get("/", summary="Listar todos los pedidos asentados")
def listar_pedidos(db: Session = Depends(get_db)):
    try:
        pedidos = db.query(Pedido).options(
            joinedload(Pedido.detalles).joinedload(DetallePedido.producto)
        ).order_by(Pedido.fecha_pedido.desc()).all()
        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo extraer el historial auditor: {str(e)}")


# =============================================================================
# 💳 ENDPOINT: REGISTRAR NUEVO PEDIDO (ACTUALIZADO HU-14)
# =============================================================================
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Registrar Pedido y Descontar Stock")
def registrar_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    try:
        # Validación de seguridad perimetral para el código de operación
        if not payload.codigo_pago.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de operación de Yape/Plin es requerido para procesar el despacho."
            )

        total_calculado = sum(item.cantidad * item.precio_unitario for item in payload.detalles)

        # 🌟 Se guarda el atributo 'codigo_pago' de forma nativa en la entidad de MySQL
        nuevo_pedido = Pedido(
            total=total_calculado,
            estado="PENDIENTE",
            nombre_cliente=payload.nombre_cliente,
            codigo_pago=payload.codigo_pago 
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