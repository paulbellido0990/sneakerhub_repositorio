from sqlalchemy import Column, Integer, String, Text, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class UsuarioAdmin(Base):
    __tablename__ = "usuarios_admin"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=False, unique=True)
    contrasena_hash = Column(String(255), nullable=False)

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=False, unique=True, index=True)
    contrasena_hash = Column(String(255), nullable=False) # Almacena Bcrypt (HU-06)
    telefono = Column(String(9), nullable=False)
    estado = Column(String(15), nullable=False, default="ACTIVO")
    fecha_creacion = Column(DateTime, server_default=func.now())

    # Relación inversa: Un cliente puede tener muchos pedidos registrados
    pedidos = relationship("PedidoLog", back_populates="cliente")

class PedidoLog(Base):
    __tablename__ = "pedidos_logs"

    id = Column(Integer, primary_key=True, index=True)
    codigo_orden = Column(String(20), nullable=False, unique=True, index=True) # #ZAP-2026-XXXX
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True)
    detalle_texto = Column(Text, nullable=False) # Texto enviado a WhatsApp (HU-03)
    total_neto = Column(DECIMAL(10, 2), nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())

    cliente = relationship("Cliente", back_populates="pedidos")