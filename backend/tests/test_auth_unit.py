import re
import pytest
from app.routers.auth import obtener_password_hash, verificar_password

# =============================================================================
# 🔐 TESTS: CONTROL CRIPTOGRÁFICO
# =============================================================================

def test_encriptacion_y_hash_seguro():
    """Verifica que el hash genere un string seguro y sea validable."""
    password_plana = "Llallahui2026*"
    hash_generado = obtener_password_hash(password_plana)
    
    assert hash_generado != password_plana
    assert hash_generado.startswith("$2b$")  # Formato estándar de bcrypt
    assert verificar_password(password_plana, hash_generado) is True

def test_verificacion_falla_con_hash_corrupto():
    """Asegura el rechazo de accesos si la contraseña no machea el hash."""
    password_real = "SoniaBellido123"
    password_erronea = "SoniaBellido124"
    hash_real = obtener_password_hash(password_real)
    
    assert verificar_password(password_erronea, hash_real) is False


# =============================================================================
# 📞 TESTS: REGLAS REGEX - TELÉFONO (HU-06)
# =============================================================================

@pytest.mark.parametrize("telefono_valido", [
    "999888777",
    "912345678",
    "900000000"
])
def test_regex_telefono_formato_correcto(telefono_valido):
    """Garantiza la aprobación de cadenas numéricas de 9 dígitos."""
    regex_telefono = r"^\d{9}$"
    assert re.match(regex_telefono, telefono_valido) is not None

@pytest.mark.parametrize("telefono_invalido", [
    "99988877",    # 8 dígitos (Insuficiente)
    "9998887776",  # 10 dígitos (Excedente)
    "999A88777",   # Alfanumérico
    "999-888-77"   # Caracteres especiales
])
def test_regex_telefono_rechazo_formatos(telefono_invalido):
    """Garantiza el bloqueo defensivo de formatos corruptos."""
    regex_telefono = r"^\d{9}$"
    assert re.match(regex_telefono, telefono_invalido) is None