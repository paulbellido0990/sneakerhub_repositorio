import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalEditarStock from '../ModalEditarStock';

// =============================================================================
// ⚛️ PRUEBAS UNITARIAS: MODAL DE CONTROL DE INVENTARIO (CORREGIDO)
// =============================================================================

describe('Pruebas Unitarias - Componente ModalEditarStock', () => {

  const productoMock = {
    id: 15,
    nombre: 'Nike Dunk Low Panda',
    variantes_color: [
      {
        id: 45,
        color: 'Blanco/Negro',
        tallares_stock: [
          { id: 201, talla: '40', stock: 3 },
          { id: 202, talla: '42', stock: 0 }
        ]
      }
    ]
  };

  test('Debe pintar el nombre del calzado y las tallas mapeadas de la base de datos', () => {
    // Arrange & Act
    render(
      <ModalEditarStock 
        producto={productoMock} 
        alCerrar={vi.fn()} 
        onStockActualizado={vi.fn()} 
      />
    );

    // Assert: Buscamos la información del calzado inyectado en la cabecera
    expect(screen.getByText(/Nike Dunk Low Panda/i)).toBeInTheDocument();
    
    // 🌟 CORRECCIÓN: Filtro elástico por RegExp para tolerar el prefijo "US "
    expect(screen.getByText(/40/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  test('Debe gatillar la llamada de cierre al pulsar la equis del panel superior', () => {
    // Arrange
    const alCerrarEspia = vi.fn();
    render(
      <ModalEditarStock 
        producto={productoMock} 
        alCerrar={alCerrarEspia} 
        onStockActualizado={vi.fn()} 
      />
    );

    // 🌟 CORRECCIÓN: Selector directo por el carácter de cierre textualmente
    const botonCerrarX = screen.getByText('✕');

    // Act
    fireEvent.click(botonCerrarX);

    // Assert
    expect(alCerrarEspia).toHaveBeenCalledOnce();
  });
});