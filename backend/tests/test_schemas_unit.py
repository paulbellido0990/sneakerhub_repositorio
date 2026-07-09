import pytest
from pydantic import ValidationError
from app.routers.products import ProductoCreate

# =============================================================================
# 🛍️ TESTS: VALIDACIÓN CONTRACTUAL DE CATALOGO (HU-15)
# =============================================================================

def test_esquema_producto_valores_por_defecto():
    """Garantiza que el descuento se inicialice en 0.0 de forma elástica."""
    payload = ProductoCreate(
        nombre="Zapatilla Retro Dunk",
        precio_base=389.90,
        descripcion="Modelo Premium Ayacucho",
        marca_id=1,
        categoria_id=2
    )
    assert payload.porcentaje_descuento == 0.0

def test_esquema_producto_campos_obligatorios():
    """Valida que Pydantic aborte la ejecución si faltan campos llave."""
    with pytest.raises(ValidationError):
        # Fallará por ausencia de 'nombre' y 'precio_base'
        ProductoCreate(descripcion="Campos ausentes")

def test_esquema_producto_tipos_datos_invalidos():
    """Valida que el sistema rechace tipos de datos incompatibles."""
    with pytest.raises(ValidationError):
        # Fallará porque el precio_base debe ser estrictamente flotante/numérico
        ProductoCreate(
            nombre="Air Max",
            precio_base="Doscientos Soles", 
            porcentaje_descuento=10.0
        )