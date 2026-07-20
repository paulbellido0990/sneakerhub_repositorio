import React, { useState } from 'react';

export default function ProductCard({
  producto,
  alSeleccionar,
  onEditarStock,
  onOcultarProducto,
  onActivarProducto,
  onEditarProducto // 🌟 RECIBIDO PARA LA HU-15
}) {
  const variante = producto.variantes_color?.[0];
  const imagenPrincipal = variante?.imagenes?.find(img => img.es_principal)?.url_imagen || variante?.imagenes?.[0]?.url_imagen;

  // Cálculo preciso de precios comerciales
  const tieneDescuento = producto.porcentaje_descuento > 0;
  const precioFinal = tieneDescuento
    ? (producto.precio_base * (1 - producto.porcentaje_descuento / 100)).toFixed(2)
    : parseFloat(producto.precio_base).toFixed(2);

  // 🎨 HU-16 (CA-03): fade-in de imagen y aviso de últimas unidades
  const [imagenCargada, setImagenCargada] = useState(false);
  const stockTotal = (producto.variantes_color || []).reduce(
    (sum, v) => sum + (v.tallares_stock || []).reduce((s, t) => s + (t.stock || 0), 0),
    0
  );
  const stockBajo = stockTotal > 0 && stockTotal <= 5;

  return (
    <div className="bg-white border border-neutral-200/70 rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative">

      {/* Etiqueta de Descuento Flotante */}
      {tieneDescuento && (
        <span className="absolute top-3 left-3 bg-linear-to-r from-red-500 to-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md z-10 tracking-wider shadow-2xs">
          -{producto.porcentaje_descuento}% OFF
        </span>
      )}

      {/* Aviso de últimas unidades disponibles */}
      {stockBajo && (
        <span className="absolute top-3 right-3 bg-semantic-warning text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md z-10 tracking-wider shadow-2xs">
          🔥 Últimas unidades
        </span>
      )}

      {/* Contenedor de Imagen de Producto */}
      <div
        onClick={() => alSeleccionar(producto)}
        className="aspect-square bg-neutral-50/70 p-6 flex items-center justify-center cursor-pointer overflow-hidden relative"
      >
        {imagenPrincipal ? (
          <img
            src={imagenPrincipal}
            alt={producto.nombre}
            onLoad={() => setImagenCargada(true)}
            className={`max-h-40 object-contain group-hover:scale-105 transition-all duration-300 ${imagenCargada ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="text-neutral-300 font-mono text-[10px] uppercase font-bold">Sin foto de vitrina</div>
        )}
      </div>

      {/* Cuerpo Informativo */}
      <div className="p-4 grow flex flex-col justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">
            {producto.marca?.nombre || "Premium"} • {producto.categoria?.nombre || "Zapatilla"}
          </span>
          <h3 
            onClick={() => alSeleccionar(producto)} 
            className="text-sm font-black text-neutral-900 mt-0.5 line-clamp-1 uppercase tracking-tight cursor-pointer hover:text-indigo-600 transition-colors"
          >
            {producto.nombre}
          </h3>
          
          {/* Bloque de Precios */}
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-black text-neutral-900 font-mono">S/. {precioFinal}</span>
            {tieneDescuento && (
              <span className="text-xs text-neutral-400 line-through font-mono">S/. {parseFloat(producto.precio_base).toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* =============================================================================
            🛡️ CAPA DE CONTROLES OPERATIVOS EXCLUSIVOS ADMINISTRATIVOS
           ============================================================================= */}
        {onEditarStock ? (
          <div className="border-t border-neutral-100 pt-3 flex flex-col gap-1.5 bg-neutral-50/50 -mx-4 -mb-4 p-4 mt-1 select-none">
            <div className="flex gap-1.5">
              {/* 🌟 NUEVO BOTÓN (HU-15): Editar ficha técnica completa */}
              {onEditarProducto && (
                <button
                  type="button"
                  onClick={() => onEditarProducto(producto)}
                  className="w-1/2 bg-neutral-900 hover:bg-neutral-950 text-white text-[10px] font-black py-2 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-1 transition-all"
                >
                  ✏️ Editar
                </button>
              )}
              
              <button
                type="button"
                onClick={() => onEditarStock(producto)}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-1 transition-all"
              >
                📏 Stock
              </button>
            </div>

            {producto.estado === "ACTIVO" ? (
              <button
                type="button"
                onClick={() => onOcultarProducto(producto.id)}
                className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[10px] font-black py-1.5 rounded-xl uppercase cursor-pointer transition-colors"
              >
                🗄️ Archivar Modelo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onActivarProducto(producto.id)}
                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black py-1.5 rounded-xl uppercase cursor-pointer transition-colors"
              >
                👀 Desarchivar Vitrina
              </button>
            )}
          </div>
        ) : (
          /* Botón Estándar de Compra para Clientes */
          <button
            type="button"
            onClick={() => alSeleccionar(producto)}
            className="w-full bg-neutral-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-indigo-600 transition-colors duration-300 cursor-pointer uppercase tracking-wider"
          >
            Ver Detalles
          </button>
        )}
      </div>

    </div>
  );
}

// 🎨 HU-16 (CA-03/CA-06): skeleton reutilizable con el mismo layout de ProductCard,
// usado mientras el catálogo está cargando en vez de un texto centrado suelto.
export function ProductCardSkeleton() {
  return (
    <div
      className="bg-white border border-neutral-200/70 rounded-2xl overflow-hidden shadow-soft flex flex-col justify-between animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-square bg-neutral-100" />
      <div className="p-4 grow flex flex-col gap-3">
        <div className="space-y-2">
          <div className="h-2.5 w-1/2 bg-neutral-100 rounded-full" />
          <div className="h-3.5 w-3/4 bg-neutral-100 rounded-full" />
          <div className="h-4 w-1/3 bg-neutral-100 rounded-full" />
        </div>
        <div className="h-9 w-full bg-neutral-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}