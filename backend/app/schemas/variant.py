from pydantic import BaseModel, Field
from typing import List

# =============================================================================
# ESQUEMAS PARA CONTROL DE STOCK POR TALLA (HU-01 / HU-05)
# =============================================================================
class VarianteStockBase(BaseModel):
    talla: str = Field(..., max_length=10, description="Talla del calzado (ej: 41, 9.5US)")
    stock: int = Field(..., ge=0, description="Cantidad física en almacén, debe ser >= 0")

class VarianteStockCreate(VarianteStockBase):
    pass

class VarianteStock(VarianteStockBase):
    id: int
    variante_color_id: int

    class Config:
        from_attributes = True  # Pydantic v2 (reemplaza a orm_mode = True)


# =============================================================================
# ESQUEMAS PARA MULTIMEDIA / ÁNGULOS (HU-12)
# =============================================================================
class ProductoImagenBase(BaseModel):
    url_imagen: str = Field(..., max_length=255)
    es_principal: bool = Field(False)

class ProductoImagen(ProductoImagenBase):
    id: int
    variante_color_id: int

    class Config:
        from_attributes = True


# =============================================================================
# ESQUEMA DE LA DIMENSIÓN DE COLOR (UNE MULTIMEDIA Y MATRIZ DE TALLAS)
# =============================================================================
from .product import Color  # Se resolverá en el siguiente paso

class VarianteColorBase(BaseModel):
    color_id: int

class VarianteColorCreate(VarianteColorBase):
    producto_id: int

class VarianteColor(BaseModel):
    id: int
    producto_id: int
    color: Color  # Anidamos el esquema de color mapeado
    imagenes: List[ProductoImagen] = []  # Lista de fotos de este color (HU-12)
    tallares_stock: List[VarianteStock] = []  # Desglose de tallas y stocks (HU-01)

    class Config:
        from_attributes = True