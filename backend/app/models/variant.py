from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class VarianteColor(Base):
    __tablename__ = "variantes_color"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    color_id = Column(Integer, ForeignKey("colores.id", ondelete="RESTRICT"), nullable=False)

    # Relaciones
    producto = relationship("Producto", back_populates="variantes_color")
    color = relationship("Color", back_populates="variantes_producto")
    
    # Una variante de color tiene sus propias imágenes y su matriz de tallas
    imagenes = relationship("ProductoImagen", back_populates="variante_color", cascade="all, delete-orphan")
    tallares_stock = relationship("VarianteStock", back_populates="variante_color", cascade="all, delete-orphan")

class ProductoImagen(Base):
    __tablename__ = "producto_imagenes"

    id = Column(Integer, primary_key=True, index=True)
    variante_color_id = Column(Integer, ForeignKey("variantes_color.id", ondelete="CASCADE"), nullable=False)
    url_imagen = Column(String(255), nullable=False)
    es_principal = Column(Boolean, nullable=False, default=False)

    variante_color = relationship("VarianteColor", back_populates="imagenes")

class VarianteStock(Base):
    __tablename__ = "variantes_stock"

    id = Column(Integer, primary_key=True, index=True)
    variante_color_id = Column(Integer, ForeignKey("variantes_color.id", ondelete="CASCADE"), nullable=False)
    talla = Column(String(10), nullable=False, index=True) # Indexado para filtros eficientes (HU-02)
    stock = Column(Integer, nullable=False, default=0) # HU-05: Control físico de stock

    variante_color = relationship("VarianteColor", back_populates="tallares_stock")