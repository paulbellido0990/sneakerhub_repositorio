from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

# =============================================================================
# 🔐 1. MODELO DE AUTENTICACIÓN: usuarios_admin (BLINDADO)
# =============================================================================
class UsuarioAdmin(Base):
    """
    Mapeo relacional de la tabla 'usuarios_admin'.
    Usa 'extend_existing' para evitar colisiones si ya fue declarada en otro modelo.
    """
    __tablename__ = 'usuarios_admin'
    __table_args__ = {'extend_existing': True} # 🌟 SOLUCIÓN: Reutiliza la definición si ya existe

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=False, unique=True)
    contrasena_hash = Column(String(255), nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    rol = Column(String(20), nullable=False, default='cliente')


# =============================================================================
# 📦 2. MODELO DE TRANSACCIÓN PRINCIPAL: pedidos
# =============================================================================
class Pedido(Base):
    __tablename__ = 'pedidos'
    __table_args__ = {'extend_existing': True} # 🌟 Protegido contra re-importaciones

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha_pedido = Column(DateTime, default=datetime.utcnow)
    total = Column(Float, nullable=False)
    estado = Column(String(50), default="PENDIENTE")
    nombre_cliente = Column(String(255), default="Cliente SneakerHub")

    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


# =============================================================================
# 👟 3. MODELO DE DESGLOSE: detalles_pedido
# =============================================================================
class DetallePedido(Base):
    __tablename__ = 'detalles_pedido'
    __table_args__ = {'extend_existing': True} # 🌟 Protegido contra re-importaciones

    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey('pedidos.id', ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey('productos.id'), nullable=False)
    talla = Column(String(10), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")