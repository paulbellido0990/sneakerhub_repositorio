from sqlalchemy import Column, Integer, String, Text, DECIMAL, ForeignKey, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base

# =============================================================================
# 1. TABLAS MAESTRAS PRINCIPALES
# =============================================================================

class Marca(Base):
    __tablename__ = "marcas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    estado = Column(String(15), nullable=False, default="ACTIVO")

    productos = relationship("Producto", back_populates="marca")


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    estado = Column(String(15), nullable=False, default="ACTIVO")

    productos = relationship("Producto", back_populates="categoria")


class Color(Base):
    __tablename__ = "colores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(30), nullable=False, unique=True)
    codigo_hex = Column(String(7), nullable=False, unique=True)

    # Vinculación con las variantes físicas
    variantes_producto = relationship("VarianteColor", back_populates="color")


# =============================================================================
# 2. TABLA CENTRAL DE PRODUCTOS (CASCARÓN BASE)
# =============================================================================

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True) 
    descripcion = Column(Text, nullable=True)
    precio_base = Column(DECIMAL(10, 2), nullable=False) 
    porcentaje_descuento = Column(Integer, nullable=False, default=0) 
    marca_id = Column(Integer, ForeignKey("marcas.id", ondelete="RESTRICT"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="RESTRICT"), nullable=False)
    estado = Column(String(15), nullable=False, default="ACTIVO") 
    fecha_creacion = Column(DateTime, server_default=func.now())

    # Relaciones directas
    marca = relationship("Marca", back_populates="productos")
    categoria = relationship("Categoria", back_populates="productos")
    
    # Conexión en cascada hacia las variantes físicas de color
    variantes_color = relationship("VarianteColor", back_populates="producto", cascade="all, delete-orphan")

    @hybrid_property
    def precio_final(self):
        base = float(self.precio_base)
        descuento = self.porcentaje_descuento
        return round(base * (1 - descuento / 100), 2)


# =============================================================================
# 3. TABLAS DE INVENTARIO AVANZADO (CASCADA RELACIONAL)
# =============================================================================

class VarianteColor(Base):
    __tablename__ = "variantes_color"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    color_id = Column(Integer, ForeignKey("colores.id", ondelete="RESTRICT"), nullable=False)

    # Sincronización inversa
    producto = relationship("Producto", back_populates="variantes_color")
    color = relationship("Color", back_populates="variantes_producto")
    
    # Hijos relacionales directos
    imagenes = relationship("ImagenProducto", back_populates="variante_color", cascade="all, delete-orphan")
    tallares_stock = relationship("TallaStock", back_populates="variante_color", cascade="all, delete-orphan")


class ImagenProducto(Base):
    __tablename__ = "imagenes_producto"

    id = Column(Integer, primary_key=True, index=True)
    variante_color_id = Column(Integer, ForeignKey("variantes_color.id", ondelete="CASCADE"), nullable=False)
    url_imagen = Column(Text, nullable=False)
    es_principal = Column(Boolean, nullable=False, default=False)

    variante_color = relationship("VarianteColor", back_populates="imagenes")


class TallaStock(Base):
    __tablename__ = "tallas_stock"

    id = Column(Integer, primary_key=True, index=True)
    variante_color_id = Column(Integer, ForeignKey("variantes_color.id", ondelete="CASCADE"), nullable=False)
    talla = Column(String(10), nullable=False)
    stock = Column(Integer, nullable=False, default=0)

    variante_color = relationship("VarianteColor", back_populates="tallares_stock")