from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    fecha_pedido = Column(DateTime, server_default=func.now())
    total = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(String(20), default="PENDIENTE")
    nombre_cliente = Column(String(100), default="Cliente SneakerHub")

    # Relación uno a muchos hacia el detalle del pedido
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False)
    talla = Column(String(10), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)

    # Relaciones de navegación inversa
    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")