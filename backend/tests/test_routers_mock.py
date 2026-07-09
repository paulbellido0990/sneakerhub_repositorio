import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from app.routers.products import actualizar_producto, ProductoCreate

# =============================================================================
# ✏️ TESTS: CONTROLADORES MOCKEADOS (HU-15)
# =============================================================================

def test_actualizar_producto_no_encontrado_lanza_404():
    """
    Verifica unitariamente que si el ID no existe en el catálogo, 
    el endpoint devuelva un HTTP 404 de forma atómica.
    """
    # 1. Mockear la sesión de la Base de Datos
    mock_db = MagicMock()
    # Simular que el query de búsqueda devuelve None (No existe el producto)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # 2. Mockear el payload simulado de edición
    payload_edicion = ProductoCreate(
        nombre="Jordan Low Editado",
        precio_base=450.0,
        porcentaje_descuento=5.0
    )
    
    # 3. Ejecutar y verificar que lance la excepción esperada
    with pytest.raises(HTTPException) as info_error:
        actualizar_producto(
            producto_id=999, # ID Inexistente
            payload=payload_edicion,
            db=mock_db,
            admin_actual=MagicMock() # Mock de sesión admin aprobada
        )
        
    assert info_error.value.status_code == 404
    assert "no se encuentra registrado" in info_error.value.detail

def test_actualizar_producto_exitoso_ejecuta_commit():
    """
    Garantiza que si el producto existe, el endpoint muta los campos 
    y consolida la persistencia invocando a .commit()
    """
    mock_db = MagicMock()
    mock_producto_existente = MagicMock()
    
    # Simular que el query de búsqueda sí encuentra el calzado
    mock_db.query.return_value.filter.return_value.first.return_value = mock_producto_existente
    
    payload_edicion = ProductoCreate(
        nombre="Nike Air Force New",
        precio_base=320.00,
        porcentaje_descuento=10.0
    )
    
    respuesta = actualizar_producto(
        producto_id=1,
        payload=payload_edicion,
        db=mock_db,
        admin_actual=MagicMock()
    )
    
    # Verificar asentamiento en base de datos mockeada
    assert respuesta["status"] == "Éxito"
    mock_db.commit.assert_called_once() # Garantiza que se guardaron los cambios
    mock_db.refresh.assert_called_once() # Garantiza la telemetría de refresco