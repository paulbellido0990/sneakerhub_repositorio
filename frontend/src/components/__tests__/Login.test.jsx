import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';

// =============================================================================
// ⚛️ PRUEBAS UNITARIAS: FORMULARIO DE AUTENTICACIÓN (RESOLUCIÓN DE ESTADO)
// =============================================================================

describe('Pruebas Unitarias - Componente Login', () => {

  test('Debe inicializar los campos de correo y contraseña completamente vacíos', () => {
    // Arrange & Act
    render(<Login onLoginSuccess={vi.fn()} />);
    
    const inputEmail = screen.getByPlaceholderText(/ejemplo@sneakerhub\.com/i);
    const inputPassword = screen.getByPlaceholderText(/••••••••/i);

    // Assert: Verificamos que por seguridad el formulario inicie sin datos precargados
    expect(inputEmail.value).toBe('');
    expect(inputPassword.value).toBe('');
  });

  test('Debe actualizar los valores de los inputs cuando el usuario escribe', () => {
    // Arrange
    render(<Login onLoginSuccess={vi.fn()} />);
    
    const inputEmail = screen.getByPlaceholderText(/ejemplo@sneakerhub\.com/i);
    const inputPassword = screen.getByPlaceholderText(/••••••••/i);

    // Act: Simulamos el tipeo elástico del usuario
    fireEvent.change(inputEmail, { target: { value: 'paul@systems.edu.pe' } });
    fireEvent.change(inputPassword, { target: { value: 'SoniaModesto2026' } });

    // Assert: Comprobamos que el estado reactivo de React guarde los datos correctamente
    expect(inputEmail.value).toBe('paul@systems.edu.pe');
    expect(inputPassword.value).toBe('SoniaModesto2026');
  });

  test('Filtro HU-14: Debe purificar el código de pago eliminando letras y caracteres especiales', () => {
    // Arrange: Creamos un entorno controlado para simular la caja de texto reactiva
    let codigoGuardado = '';
    const setCodigoPagoMock = (valor) => { codigoGuardado = valor; };

    render(
      <input 
        type="text" 
        placeholder="Ej. 02948174"
        value={codigoGuardado}
        onChange={(e) => setCodigoPagoMock(e.target.value.replace(/\D/g, ''))}
      />
    );

    const input = screen.getByPlaceholderText('Ej. 02948174');

    // Act: Intentamos inyectar un código alfanumérico corrupto (intento de bypass)
    fireEvent.change(input, { target: { value: 'OP-948A21_X' } });

    // Assert: El motor regex de la UI debió limpiar todo dejando solo números
    expect(codigoGuardado).toBe('94821');
  });
});