# app/models/__init__.py
from app.database import Base
from app.models.product import Marca, Categoria, Color, Producto, VarianteColor, ImagenProducto, TallaStock
from app.models.user import UsuarioAdmin  # Mantiene tu control de acceso perimetral activo