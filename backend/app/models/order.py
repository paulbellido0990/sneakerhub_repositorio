from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# =============================================================================
# 👤 ENTIDAD: USUARIOS (ADMINISTRADORES Y CLIENTES)
# =============================================================================
class UsuarioAdmin(Base):
    __tablename__ = "usuarios_admin"
    # 🌟 PROTECCIÓN RE-ENTRY: Evita errores de duplicación de Metadata en reloads
    __table_args__ = {'extend_existing': True} 

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, index=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=True)
    rol = Column(String(50), default="cliente")  
    fecha_registro = Column(DateTime, default=datetime.utcnow)


# =============================================================================
# 💳 ENTIDAD: MAESTRO DE PEDIDOS (ACTUALIZADO HU-14)
# =============================================================================
class Pedido(Base):
    __tablename__ = "pedidos"
    # 🌟 PROTECCIÓN RE-ENTRY: Evita errores de duplicación de Metadata en reloads
    __table_args__ = {'extend_existing': True} 

    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)
    estado = Column(String(50), default="PENDIENTE")  
    nombre_cliente = Column(String(100), default="Cliente SneakerHub")
    codigo_pago = Column(String(50), nullable=True)
    fecha_pedido = Column(DateTime, default=datetime.utcnow)

    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


# =============================================================================
# 📦 ENTIDAD: DETALLES TRANSACCIONALES DEL PEDIDO
# =============================================================================
class DetallePedido(Base):
    __tablename__ = "detalles_pedido"
    # 🌟 PROTECCIÓN RE-ENTRY: Evita errores de duplicación de Metadata en reloads
    __table_args__ = {'extend_existing': True} 

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    talla = Column(String(10), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")