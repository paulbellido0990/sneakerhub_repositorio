import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';

// =============================================================================
// ⚛️ PRUEBAS UNITARIAS: COMPONENTE PRODUCTCARD (HU-15)
// =============================================================================

describe('Pruebas Unitarias - ProductCard Component', () => {

  test('Debe calcular y renderizar el precio con descuento correctamente', () => {
    // 1. Crear un producto simulado (Mock) con 20% de descuento
    const productoMock = {
      id: 1,
      nombre: 'Nike Air Force 1',
      precio_base: 100.00,
      porcentaje_descuento: 20,
      estado: 'ACTIVO',
      marca: { nombre: 'Nike' },
      categoria: { nombre: 'Urbano' }
    };

    // 2. Renderizar el componente de forma aislada en memoria
    render(
      <ProductCard 
        producto={productoMock} 
        alSeleccionar={vi.fn()} 
      />
    );

    // 3. Afirmaciones (Asserts): Verificar el precio final y la etiqueta de OFF
    expect(screen.getByText('S/. 80.00')).toBeInTheDocument(); // 100 - 20%
    expect(screen.getByText('-20% OFF')).toBeInTheDocument();
  });

  test('No debe mostrar la etiqueta de descuento si el porcentaje es 0', () => {
    const productoMock = {
      id: 2,
      nombre: 'Adidas Superstar',
      precio_base: 350.00,
      porcentaje_descuento: 0,
      estado: 'ACTIVO',
      marca: { nombre: 'Adidas' },
      categoria: { nombre: 'Urbano' }
    };

    render(<ProductCard producto={productoMock} alSeleccionar={vi.fn()} />);

    // El precio debe ser el base
    expect(screen.getByText('S/. 350.00')).toBeInTheDocument();
    
    // La etiqueta "OFF" NO debería existir en el DOM
    const etiquetaDescuento = screen.queryByText(/OFF/i);
    expect(etiquetaDescuento).not.toBeInTheDocument();
  });

  test('Debe mostrar el aviso "Sin foto de vitrina" si el producto no tiene URLs multimedia', () => {
    const productoMock = {
      id: 3,
      nombre: 'Puma Suede',
      precio_base: 280.00,
      porcentaje_descuento: 0,
      estado: 'ACTIVO'
    };

    render(<ProductCard producto={productoMock} alSeleccionar={vi.fn()} />);

    // Verifica que el extractor elástico de imágenes use el fallback de texto
    expect(screen.getByText('Sin foto de vitrina')).toBeInTheDocument();
  });

  test('Debe renderizar los controles de administrador si se pasan las funciones controladoras', () => {
    const productoMock = {
      id: 4,
      nombre: 'Jordan Retro 4',
      precio_base: 750.00,
      estado: 'ACTIVO'
    };

    // Pasamos las funciones mockeadas (simula que el usuario es Admin)
    render(
      <ProductCard 
        producto={productoMock} 
        alSeleccionar={vi.fn()} 
        onEditarStock={vi.fn()} 
        onOcultarProducto={vi.fn()} 
        onActivarProducto={vi.fn()}
        onEditarProducto={vi.fn()} // HU-15
      />
    );

    // El botón de "Editar" y "Stock" deben estar visibles para el Admin
    expect(screen.getByText('✏️ Editar')).toBeInTheDocument();
    expect(screen.getByText('📏 Stock')).toBeInTheDocument();
  });
});