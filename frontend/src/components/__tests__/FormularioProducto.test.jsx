import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormularioProducto from '../FormularioProducto';

// =============================================================================
// ⚛️ PRUEBAS UNITARIAS: FORMULARIO DE REGISTRO DE PRODUCTOS (RESOLUCIÓN DE PASOS)
// =============================================================================

describe('Pruebas Unitarias - Componente FormularioProducto', () => {

  test('Debe renderizar correctamente los elementos de la ficha técnica del calzado', () => {
    // Arrange & Act
    render(<FormularioProducto alCerrar={vi.fn()} onProductoRegistrado={vi.fn()} />);

    // Assert: Comprobamos texto o etiquetas base mediante expresiones regulares
    expect(screen.getByText(/Nombre del Modelo/i)).toBeInTheDocument();
    expect(screen.getByText(/Descripción Técnica/i)).toBeInTheDocument();
  });

  test('Debe permitir la mutación elástica de datos en los inputs del formulario', () => {
    // Arrange
    const { container } = render(<FormularioProducto alCerrar={vi.fn()} onProductoRegistrado={vi.fn()} />);
    
    // Captura directa y segura del primer input de texto a través del árbol DOM
    const inputNombre = container.querySelector('input[type="text"]') || screen.getAllByRole('textbox')[0];

    // Act: Simulamos la inyección de una nueva zapatilla
    if (inputNombre) {
      fireEvent.change(inputNombre, { target: { value: 'Jordan Retro 4 Military Blue' } });
      // Assert
      expect(inputNombre.value).toBe('Jordan Retro 4 Military Blue');
    }
  });

  test('Debe gatillar el cierre del modal al hacer clic en el botón de cerrar (✕)', () => {
    // Arrange
    const alCerrarEspia = vi.fn();
    render(<FormularioProducto alCerrar={alCerrarEspia} onProductoRegistrado={vi.fn()} />);
    
    // 🌟 CORRECCIÓN: Apuntamos a la equis superior real del componente
    const botonCerrarX = screen.getByText('✕');

    // Act
    fireEvent.click(botonCerrarX);

    // Assert: Comprobamos la llamada al callback de salida
    expect(alCerrarEspia).toHaveBeenCalledOnce();
  });
});