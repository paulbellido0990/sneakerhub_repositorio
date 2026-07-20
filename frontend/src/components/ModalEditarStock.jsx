import React, { useState } from 'react';
import API from '../api';

export default function ModalEditarStock({ producto, alCerrar, onStockActualizado }) {
  // 🌟 MATRIZ EXTENDIDA DE TALLAS HOMOLOGADAS (HU-05)
  const TALLAS_REGIONALES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"];

  // Inicializar el estado indexando el inventario existente o seteando 0 por defecto
  const [inventario, setInventario] = useState(() => {
    const mapaInicial = {};
    TALLAS_REGIONALES.forEach(talla => {
      mapaInicial[talla] = 0;
    });

    const datosExistentes = producto?.variantes_color?.[0]?.tallares_stock || [];
    datosExistentes.forEach(item => {
      if (mapaInicial.hasOwnProperty(item.talla)) {
        mapaInicial[item.talla] = item.stock;
      }
    });
    return mapaInicial;
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleCambioStock = (talla, valor) => {
    const unidades = parseInt(valor) || 0;
    setInventario(prev => ({
      ...prev,
      [talla]: unidades < 0 ? 0 : unidades // Validación perimetral: No negativos
    }));
  };

  const handleFormulario = async (e) => {
    e.preventDefault();
    setGuardando(false);
    setGuardando(true);
    setError(null);

    try {
      const tokenGuardado = localStorage.getItem('token');
      
      // Construimos el array estructurado que nuestro backend procesa secuencialmente
      const payload = Object.keys(inventario).map(talla => ({
        talla: talla,
        stock: inventario[talla]
      }));

      await API.put(`/productos/${producto.id}/stock`, payload, {
        headers: { Authorization: `Bearer ${tokenGuardado}` }
      });

      onStockActualizado();
      alCerrar();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Fallo en la comunicación con el motor transaccional.");
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-black uppercase text-neutral-950">📦 Matriz de Almacén</h3>
            <p className="text-xs text-neutral-400 line-clamp-1">{producto.nombre}</p>
          </div>
          <button type="button" onClick={alCerrar} aria-label="Cerrar matriz de almacén" className="text-neutral-400 hover:text-neutral-900 font-bold p-1 cursor-pointer">✕</button>
        </div>

        {error && <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl text-center text-red-600 text-xs mb-3 font-medium">{error}</div>}

        {/* Formulario con grilla de Tallas de 35 a 44 */}
        <form onSubmit={handleFormulario} className="flex flex-col grow overflow-hidden">
          <div className="grow overflow-y-auto space-y-2.5 pr-1 py-1">
            <div className="grid grid-cols-2 gap-3">
              {TALLAS_REGIONALES.map((size) => (
                <div key={size} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl">
                  <span className="text-xs font-black text-neutral-700 font-mono">US {size}</span>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={inventario[size] === 0 ? "" : inventario[size]} 
                    onChange={(e) => handleCambioStock(size, e.target.value)}
                    className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-center text-xs font-bold font-mono focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="border-t border-neutral-100 pt-4 mt-4 flex gap-3">
            <button type="button" onClick={alCerrar} className="w-1/3 border border-neutral-200 text-neutral-500 font-bold text-xs py-3 rounded-xl hover:bg-neutral-50 cursor-pointer uppercase tracking-wider">Cancelar</button>
            <button type="submit" disabled={guardando} className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50">
              {guardando ? "Sincronizando..." : "Actualizar Stock ✅"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}