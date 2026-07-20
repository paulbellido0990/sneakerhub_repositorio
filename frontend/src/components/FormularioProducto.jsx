import React, { useState } from 'react';

export default function FormularioProducto({ onProductoRegistrado, alCerrar }) {
  // --- Paso 1: Datos Base del Calzado ---
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [marcaId, setMarcaId] = useState('1'); // 1: Nike
  const [categoriaId, setCategoriaId] = useState('1'); // 1: Urbano

  // --- Paso 2: Variantes, Fotos y Stock Cohesivo ---
  const [colorId, setColorId] = useState('1'); // 1: Negro/Blanco (creado en Workbench)
  const [urlImagen, setUrlImagen] = useState('');
  
  // Matriz de stock por tallas individuales
  const [stock38, setStock38] = useState(0);
  const [stock39, setStock39] = useState(0);
  const [stock40, setStock40] = useState(0);
  const [stock41, setStock41] = useState(0);
  const [stock42, setStock42] = useState(0);
  const [stock43, setStock43] = useState(0);

  // Estados de control de flujo
  const [paso, setPaso] = useState(1); // Control de pestañas (1: Base, 2: Inventario)
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const handleSubmitCompleto = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje({ tipo: '', texto: '' });

    const token = localStorage.getItem('token');

    try {
      // 🚀 TRANSMISIÓN 1: Crear Cascarón del Producto
      const resProducto = await fetch('http://127.0.0.1:8000/api/productos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          descripcion,
          precio_base: parseFloat(precioBase),
          porcentaje_descuento: parseInt(descuento),
          marca_id: parseInt(marcaId),
          categoria_id: parseInt(categoriaId)
        })
      });

      const dataProducto = await resProducto.json();
      if (!resProducto.ok) throw new Error(dataProducto.detail || 'Error en Fase 1: Producto Base');

      const nuevoProductoId = dataProducto.producto_id;

      // 🚀 TRANSMISIÓN 2: Inyectar Inventario y Fotos en Cascada
      const arrayTallas = [
        { talla: "38", stock: parseInt(stock38) },
        { talla: "39", stock: parseInt(stock39) },
        { talla: "40", stock: parseInt(stock40) },
        { talla: "41", stock: parseInt(stock41) },
        { talla: "42", stock: parseInt(stock42) },
        { talla: "43", stock: parseInt(stock43) },
      ].filter(item => item.stock > 0); // Solo envía a MySQL las tallas con stock real

      const resVariante = await fetch(`http://127.0.0.1:8000/api/productos/${nuevoProductoId}/variantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          color_id: parseInt(colorId),
          imagenes: [
            { url_imagen: urlImagen || "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500", es_principal: true }
          ],
          tallas_stock: arrayTallas
        })
      });

      const dataVariante = await resVariante.json();
      if (!resVariante.ok) throw new Error(dataVariante.detail || 'Error en Fase 2: Lote de Variantes');

      // Éxito Absoluto
      setMensaje({ tipo: 'exito', texto: `¡Sincronización Exitosa! Producto ID ${nuevoProductoId} creado con fotos y tallas en MySQL.` });
      
      // Limpieza total de estados
      setTimeout(() => {
        if (onProductoRegistrado) onProductoRegistrado();
        alCerrar();
      }, 2000);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-neutral-100 max-h-[90vh] overflow-y-auto">
        
        <button onClick={alCerrar} aria-label="Cerrar panel de abastecimiento" className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold p-1 cursor-pointer">✕</button>

        <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-neutral-900">
          👟 Panel de Abastecimiento Relacional
        </h3>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="flex gap-2 border-b border-neutral-100 pb-3 mb-4">
          <button type="button" onClick={() => setPaso(1)} className={`text-xs font-black uppercase pb-1 cursor-pointer tracking-wider ${paso === 1 ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400'}`}>
            1. Datos del Calzado
          </button>
          <button type="button" onClick={() => setPaso(2)} className={`text-xs font-black uppercase pb-1 cursor-pointer tracking-wider ${paso === 2 ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400'}`}>
            2. Galería e Inventario
          </button>
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-xl text-xs font-bold text-center mb-4 border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmitCompleto} className="space-y-4">
          
          {/* PESTAÑA 1: DATOS BASE */}
          {paso === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Nombre del Modelo</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900" placeholder="Ej. Nike Air Force 1 Retro" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Descripción Técnica</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900 h-16 resize-none" placeholder="Detalles de materiales..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Precio Base (S/.)</label>
                  <input type="number" step="0.01" required value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900" placeholder="420.00" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Descuento (%)</label>
                  <input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Marca Padre</label>
                  <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 cursor-pointer focus:outline-none">
                    <option value="1">Nike</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Categoría</label>
                  <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 cursor-pointer focus:outline-none">
                    <option value="1">Urbano</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={() => setPaso(2)} className="w-full bg-neutral-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-neutral-800 uppercase tracking-wider mt-4 cursor-pointer">
                Siguiente: Configurar Inventario →
              </button>
            </div>
          )}

          {/* PESTAÑA 2: GALERÍA E INVENTARIO COHESIVO */}
          {paso === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Color Estructural</label>
                  <select value={colorId} onChange={(e) => setColorId(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 cursor-pointer focus:outline-none">
                    <option value="1">Negro/Blanco</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">URL de la Imagen (Unsplash / Web)</label>
                  <input type="url" value={urlImagen} onChange={(e) => setUrlImagen(e.target.value)} className="border border-neutral-200 rounded-xl px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900" placeholder="https://images.unsplash.com/..." />
                </div>
              </div>

              <div className="border-t border-neutral-100 my-2 pt-2">
                <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider mb-2">Matriz de Stock por Talla</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { t: '38', v: stock38, s: setStock38 },
                    { t: '39', v: stock39, s: setStock39 },
                    { t: '40', v: stock40, s: setStock40 },
                    { t: '41', v: stock41, s: setStock41 },
                    { t: '42', v: stock42, s: setStock42 },
                    { t: '43', v: stock43, s: setStock43 },
                  ].map(item => (
                    <div key={item.t} className="flex flex-col gap-1 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                      <label className="text-[10px] font-black text-neutral-600 text-center">Talla {item.t}</label>
                      <input type="number" min="0" value={item.v} onChange={(e) => item.s(e.target.value)} className="border border-neutral-200 rounded-lg bg-white px-2 py-1 text-center text-xs font-bold focus:outline-none focus:border-neutral-900" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPaso(1)} className="w-1/3 border border-neutral-200 text-neutral-700 font-bold text-xs py-3 rounded-xl hover:bg-neutral-50 uppercase tracking-wider cursor-pointer">
                  ← Atrás
                </button>
                <button type="submit" disabled={enviando} className="w-2/3 bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-emerald-700 uppercase tracking-wider disabled:bg-neutral-400 cursor-pointer shadow-xs">
                  {enviando ? 'Escribiendo en MySQL...' : 'Confirmar Lote en Base de Datos'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}