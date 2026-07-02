import React, { useState } from 'react';

export default function ModalEditarStock({ producto, alCerrar, onStockActualizado }) {
  // Extraer las tallas actuales del producto o inicializar un mapa vacío
  const listaTallasOriginales = producto.variantes_color?.[0]?.tallares_stock || [];
  
  // Mapear el stock inicial indexado por las tallas estándar (38 a 43)
  const obtenerStockInicial = (talla) => {
    const registro = listaTallasOriginales.find(t => t.talla === talla);
    return registro ? registro.stock : 0;
  };

  const [stock38, setStock38] = useState(obtenerStockInicial("38"));
  const [stock39, setStock39] = useState(obtenerStockInicial("39"));
  const [stock40, setStock40] = useState(obtenerStockInicial("40"));
  const [stock41, setStock41] = useState(obtenerStockInicial("41"));
  const [stock42, setStock42] = useState(obtenerStockInicial("42"));
  const [stock43, setStock43] = useState(obtenerStockInicial("43"));

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleGuardarStock = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');

    const token = localStorage.getItem('token');
    const matrizActualizada = [
      { talla: "38", stock: parseInt(stock38) || 0 },
      { talla: "39", stock: parseInt(stock39) || 0 },
      { talla: "40", stock: parseInt(stock40) || 0 },
      { talla: "41", stock: parseInt(stock41) || 0 },
      { talla: "42", stock: parseInt(stock42) || 0 },
      { talla: "43", stock: parseInt(stock43) || 0 },
    ];

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/productos/${producto.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(matrizActualizada)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Fallo al actualizar stock.');

      if (onStockActualizado) onStockActualizado();
      alCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-neutral-100">
        
        <button onClick={alCerrar} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold cursor-pointer">✕</button>

        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
          {producto.marca?.nombre}
        </span>
        <h3 className="text-base font-black text-neutral-900 mt-1 uppercase line-clamp-1">
          🔄 Reabastecer: {producto.nombre}
        </h3>
        <p className="text-xs text-neutral-400 mb-4">Modifica las cantidades físicas de inventario disponible.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-2 rounded-xl text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleGuardarStock} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: '38', v: stock38, s: setStock38 },
              { t: '39', v: stock39, s: setStock39 },
              { t: '40', v: stock40, s: setStock40 },
              { t: '41', v: stock41, s: setStock41 },
              { t: '42', v: stock42, s: setStock42 },
              { t: '43', v: stock43, s: setStock43 },
            ].map(item => (
              <div key={item.t} className="flex items-center justify-between bg-neutral-50 p-2 rounded-xl border border-neutral-100 gap-2">
                <label className="text-xs font-black text-neutral-600 pl-1">Talla {item.t}</label>
                <input 
                  type="number" 
                  min="0" 
                  value={item.v} 
                  onChange={(e) => item.s(e.target.value)} 
                  className="w-16 border border-neutral-200 rounded-lg bg-white px-2 py-1 text-center text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900" 
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={alCerrar} 
              className="w-1/3 border border-neutral-200 text-neutral-700 font-bold text-xs py-3 rounded-xl hover:bg-neutral-50 uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={enviando} 
              className="w-2/3 bg-neutral-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-neutral-800 uppercase tracking-wider disabled:bg-neutral-400 cursor-pointer"
            >
              {enviando ? 'Guardando...' : 'Actualizar MySQL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}