import React from 'react';

export default function ProductCard({ producto, alSeleccionar, onEditarStock }) {
  const token = localStorage.getItem('token'); // Detectar si hay sesión administrativa activa
  
  const variantePrincipal = producto.variantes_color?.[0];
  const imagenUrl = variantePrincipal?.imagenes?.find(img => img.es_principal)?.url_imagen 
    || variantePrincipal?.imagenes?.[0]?.url_imagen;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group">
      
      {/* Etiqueta de Descuento */}
      {producto.porcentaje_descuento > 0 && (
        <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider z-10 animate-pulse">
          - {producto.porcentaje_descuento} %
        </span>
      )}

      {/* Área Clickable de la Ficha Técnica */}
      <div onClick={() => alSeleccionar(producto)} className="cursor-pointer grow">
        <div className="aspect-square bg-neutral-50 p-6 flex items-center justify-center overflow-hidden">
          <img 
            src={imagenUrl || "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500"} 
            alt={producto.nombre} 
            className="max-h-40 object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            {producto.marca?.nombre || "Calzado"}
          </span>
          <h3 className="text-sm font-black text-neutral-900 tracking-tight uppercase line-clamp-1">
            {producto.nombre}
          </h3>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-base font-black text-neutral-900">S/. {producto.precio_final}</span>
            {producto.porcentaje_descuento > 0 && (
              <span className="text-xs text-neutral-400 line-through">S/. {producto.precio_base}</span>
            )}
          </div>
        </div>
      </div>

      {/* 🛠️ CONTROLES EXCLUSIVOS DE ADMINISTRADOR */}
      {token && onEditarStock && (
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Evita abrir el modal de cliente por accidente
              onEditarStock(producto);
            }}
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            ✏️ Editar Stock
          </button>
        </div>
      )}

    </div>
  );
}