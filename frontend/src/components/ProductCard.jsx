import React from 'react';

export default function ProductCard({ producto, alSeleccionar }) {
  const variantePrincipal = producto.variantes_color?.[0];
  const imagenPrincipal = variantePrincipal?.imagenes?.find(img => img.es_principal)?.url_imagen 
    || variantePrincipal?.imagenes?.[0]?.url_imagen 
    || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600";

  return (
    <div 
      onClick={() => alSeleccionar(producto)}
      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all duration-300 flex flex-col h-full cursor-pointer group"
    >
      {/* Contenedor de Imagen */}
      <div className="relative aspect-square bg-neutral-50 flex items-center justify-center p-6">
        <img 
          src={imagenPrincipal} 
          alt={producto.nombre} 
          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
        />
        {producto.porcentaje_descuento > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            -{producto.porcentaje_descuento}%
          </span>
        )}
      </div>

      {/* Información Técnica */}
      <div className="p-4 flex flex-col grow">
        <span className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">
          {producto.marca?.nombre} • {producto.categoria?.nombre}
        </span>
        <h3 className="text-base font-bold text-neutral-900 mt-1 line-clamp-1 group-hover:text-neutral-700">
          {producto.nombre}
        </h3>
        
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-black text-neutral-900">
            S/. {producto.precio_final}
          </span>
          {producto.porcentaje_descuento > 0 && (
            <span className="text-sm text-neutral-400 line-through">
              S/. {producto.precio_base}
            </span>
          )}
        </div>

        <div className="border-t border-neutral-100 my-3"></div>

        {/* Tallas */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {variantePrincipal?.tallares_stock?.map((item) => (
            <span 
              key={item.id} 
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                item.stock > 0 
                  ? 'border-neutral-200 text-neutral-700 bg-neutral-50' 
                  : 'border-neutral-100 text-neutral-300 bg-neutral-100/50 line-through'
              }`}
            >
              {item.talla}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}