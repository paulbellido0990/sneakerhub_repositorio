from pydantic import BaseModel, Field, computed_field
from decimal import Decimal
from datetime import datetime
from typing import List, Optional

# =============================================================================
# 1. ESQUEMAS DE ENTIDADES MAESTRAS SIMPLE
# =============================================================================
class Marca(BaseModel):
    id: int
    nombre: str
    estado: str
    class Config:
        from_attributes = True

class Categoria(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    estado: str
    class Config:
        from_attributes = True

class Color(BaseModel):
    id: int
    nombre: str
    codigo_hex: str
    class Config:
        from_attributes = True

# =============================================================================
# 2. ESQUEMAS MATRICIALES (VARIACIONES)
# =============================================================================
class VarianteStock(BaseModel):
    id: int
    variante_color_id: int
    talla: str
    stock: int
    class Config:
        from_attributes = True

class ProductoImagen(BaseModel):
    id: int
    variante_color_id: int
    url_imagen: str
    es_principal: bool
    class Config:
        from_attributes = True

class VarianteColor(BaseModel):
    id: int
    producto_id: int
    color: Color  # Relación directa con el objeto color
    imagenes: List[ProductoImagen] = []
    tallares_stock: List[VarianteStock] = []
    class Config:
        from_attributes = True

# =============================================================================
# 3. ESQUEMA DEL PRODUCTO FINAL CON PRECIO CALCULADO (HU-09)
# =============================================================================
class Producto(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio_base: Decimal
    porcentaje_descuento: int
    marca_id: int
    categoria_id: int
    estado: str
    fecha_creacion: datetime
    marca: Marca
    categoria: Categoria
    variantes_color: List[VarianteColor] = []

    @computed_field
    @property
    def precio_final(self) -> Decimal:
        if self.porcentaje_descuento > 0:
            descuento = (self.precio_base * Decimal(self.porcentaje_descuento)) / Decimal(100)
            return round(self.precio_base - descuento, 2)
        return self.precio_base

    class Config:
        from_attributes = True