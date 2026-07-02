import React, { useState, useEffect } from 'react';
import API from './api';
import ProductCard from './components/ProductCard';
import Login from './components/Login'; // 🔐 Importación de tu nuevo componente de seguridad
import FormularioProducto from './components/FormularioProducto';

export default function App() {
  // =============================================================================
  // 🛡️ ESTADOS DE AUTENTICACIÓN Y CONTROL DE ACCESO (HU-04)
  // =============================================================================
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);

  // Estados base del catálogo
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los filtros concurrentes (HU-02)
  const [busqueda, setBusqueda] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('');

  // Estado para la Ficha Técnica Modal (HU-01)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');

  // Estados del Carrito con Persistencia Local
  const [carrito, setCarrito] = useState(() => {
    const datosLocales = localStorage.getItem('sneakerhub_cart');
    return datosLocales ? JSON.parse(datosLocales) : [];
  });
  const [menuCarritoAbierto, setMenuCarritoAbierto] = useState(false);

  // Guardar automáticamente el carrito en localStorage
  useEffect(() => {
    localStorage.setItem('sneakerhub_cart', JSON.stringify(carrito));
  }, [carrito]);

  // Consumo de API del Catálogo con Filtros
  useEffect(() => {
    setCargando(true);
    const params = {};
    if (busqueda) params.q = busqueda;
    if (tallaFiltro) params.talla = tallaFiltro;

    API.get('/productos/buscar', { params })
      .then((response) => {
        setProductos(response.data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al filtrar catálogo:", err);
        setError("Error de comunicación con el motor relacional.");
        setCargando(false);
      });
  }, [busqueda, tallaFiltro]);

  // Handler para cierre de sesión seguro
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    setToken(null);
  };

  // Funciones del Carrito
  const agregarAlCarrito = () => {
    if (!tallaSeleccionada) {
      alert("Por favor, selecciona una talla antes de añadir el producto.");
      return;
    }

    const variantePrincipal = productoSeleccionado.variantes_color?.[0];
    const imagenUrl = variantePrincipal?.imagenes?.find(img => img.es_principal)?.url_imagen 
      || variantePrincipal?.imagenes?.[0]?.url_imagen;

    const itemExistente = carrito.find(
      item => item.id === productoSeleccionado.id && item.talla === tallaSeleccionada
    );

    if (itemExistente) {
      setCarrito(carrito.map(item => 
        (item.id === productoSeleccionado.id && item.talla === tallaSeleccionada)
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        marca: productoSeleccionado.marca?.nombre,
        precio: parseFloat(productoSeleccionado.precio_final),
        talla: tallaSeleccionada,
        imagen: imagenUrl,
        cantidad: 1
      }]);
    }

    setTallaSeleccionada('');
    setProductoSeleccionado(null);
    setMenuCarritoAbierto(true);
  };

  const modificarCantidad = (id, talla, factor) => {
    setCarrito(carrito.map(item => {
      if (item.id === id && item.talla === talla) {
        const nuevaCantidad = item.cantidad + factor;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const eliminarDelCarrito = (id, talla) => {
    setCarrito(carrito.filter(item => !(item.id === id && item.talla === talla)));
  };

  const totalCompra = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  // =============================================================================
  // 🔌 CONECTOR MOTOR DE WHATSAPP (HU-03 - CIERRE SPRINT 3)
  // =============================================================================
  const enviarPedidoWhatsApp = () => {
    if (carrito.length === 0) return;

    const CELULAR_TIENDA = "51999999999"; 

    let mensaje = `🚨 *¡Hola SneakerHub Ayacucho!* \n`;
    mensaje += `Quiero realizar un pedido con el siguiente detalle:\n\n`;
    mensaje += `-------------------------------------------\n`;

    carrito.forEach((item) => {
      mensaje += `👟 *${item.nombre}* (${item.marca})\n`;
      mensaje += `📏 *Talla:* ${item.talla} | *Cant:* ${item.cantidad}\n`;
      mensaje += `💵 *Subtotal:* S/. ${(item.precio * item.cantidad).toFixed(2)}\n`;
      mensaje += `-------------------------------------------\n`;
    });

    mensaje += `💰 *TOTAL A PAGAR: S/. ${totalCompra.toFixed(2)}*\n\n`;
    mensaje += `¿Tienen disponibilidad de stock para coordinar la entrega de mis zapatillas? 🙌`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${CELULAR_TIENDA}?text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  };

  // =============================================================================
  // INTERRUPTOR VISTA DE LOGIN (VÍA FLUJO CONDICIONAL)
  // =============================================================================
  if (mostrarLogin) {
    return (
      <div className="relative">
        <button 
          onClick={() => setMostrarLogin(false)}
          className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-gray-700 z-50"
        >
          ← Volver al Catálogo
        </button>
        <Login onLoginSuccess={(tokenGenerado) => {
          setToken(tokenGenerado);
          setMostrarLogin(false);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased">
      
      {/* BARRA SUPERIOR DE ADMINISTRADOR GLOBAL */}
      {token && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 flex justify-between items-center animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>🛡️ Sesión de Administrador Activa (Paul)</span>
            </div>
            <button 
              onClick={() => setModalFormularioAbierto(true)}
              className="bg-white text-emerald-800 px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider font-black hover:bg-neutral-100 transition-all cursor-pointer"
            >
              + Añadir Zapatilla
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition-all font-black cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 px-4 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-black tracking-tight uppercase">
            SneakerHub <span className="text-neutral-400 font-normal text-sm">Ayacucho</span>
          </h1>
          
          <div className="flex items-center gap-3">
            {!token ? (
              <button 
                onClick={() => setMostrarLogin(true)}
                className="border border-neutral-200 text-neutral-600 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer flex items-center gap-1.5"
              >
                Anclaje Admin 🔐
              </button>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-emerald-200">
                ⚡ Panel Activo
              </span>
            )}

            <button 
              onClick={() => setMenuCarritoAbierto(true)}
              className="bg-neutral-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer relative"
            >
              🛒 Mi Carrito
              <span className="bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-black">
                {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* PANEL DE FILTROS */}
      <section className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">¿Qué zapatillas buscas?</label>
            <input 
              type="text"
              placeholder="Ej. Jordan, Nike, Ultraboost..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filtrar por tu Talla</label>
            <select 
              value={tallaFiltro}
              onChange={(e) => setTallaFiltro(e.target.value)}
              className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Todas las tallas disponibles</option>
              <option value="38">Talla 38</option>
              <option value="39">Talla 39</option>
              <option value="40">Talla 40</option>
              <option value="41">Talla 41</option>
              <option value="42">Talla 42</option>
              <option value="43">Talla 43</option>
            </select>
          </div>

          <div className="flex items-end">
            {(busqueda || tallaFiltro) && (
              <button 
                onClick={() => { setBusqueda(''); setTallaFiltro(''); }}
                className="w-full md:w-auto text-xs font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FEED DE PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center text-red-600 mb-6">{error}</div>}

        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-neutral-400 font-medium animate-pulse">Sincronizando con el servidor...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 p-8">
            <p className="text-neutral-500 font-bold text-lg">No encontramos zapatillas con esos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductCard 
                key={producto.id} 
                producto={producto} 
                alSeleccionar={(p) => { setProductoSeleccionado(p); setTallaSeleccionada(''); }} 
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL FICHA TÉCNICA */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-neutral-900 border border-neutral-200 h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="md:w-1/2 bg-neutral-50 p-8 flex items-center justify-center aspect-square md:aspect-auto">
              <img 
                src={
                  productoSeleccionado.variantes_color?.[0]?.imagenes?.find(img => img.es_principal)?.url_imagen 
                  || productoSeleccionado.variantes_color?.[0]?.imagenes?.[0]?.url_imagen
                } 
                alt={productoSeleccionado.nombre} 
                className="max-h-64 md:max-h-full max-w-full object-contain"
              />
            </div>

            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-neutral-400 tracking-widest">
                  {productoSeleccionado.marca?.nombre} • {productoSeleccionado.categoria?.nombre}
                </span>
                <h2 className="text-xl font-black text-neutral-900 mt-1">
                  {productoSeleccionado.nombre}
                </h2>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-900">S/. {productoSeleccionado.precio_final}</span>
                  {productoSeleccionado.porcentaje_descuento > 0 && (
                    <span className="text-sm text-neutral-400 line-through">S/. {productoSeleccionado.precio_base}</span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
                  {productoSeleccionado.descripcion || "Sin descripción técnica disponible por el momento."}
                </p>

                <div className="border-t border-neutral-100 my-4"></div>

                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-3">
                  Selecciona tu talla:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {productoSeleccionado.variantes_color?.[0]?.tallares_stock?.map((item) => (
                    <button
                      key={item.id}
                      disabled={item.stock === 0}
                      onClick={() => setTallaSeleccionada(item.talla)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        item.stock === 0
                          ? 'border-neutral-100 text-neutral-300 bg-neutral-100 line-through cursor-not-allowed'
                          : tallaSeleccionada === item.talla
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-800 cursor-pointer'
                      }`}
                    >
                      {item.talla}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={agregarAlCarrito}
                  className="w-full bg-neutral-900 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL: CARRITO */}
      {menuCarritoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="absolute inset-0" onClick={() => setMenuCarritoAbierto(false)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                <h2 className="text-lg font-black uppercase tracking-tight">Mi Pedido</h2>
                <button 
                  onClick={() => setMenuCarritoAbierto(false)}
                  className="text-neutral-400 hover:text-neutral-900 font-bold p-1 cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>

              <div className="overflow-y-auto max-h-[65vh] space-y-4 pr-1">
                {carrito.length === 0 ? (
                  <p className="text-center text-neutral-400 text-sm py-12 font-medium">Tu carrito está vacío. ¡Empieza a añadir tus zapatillas favoritas!</p>
                ) : (
                  carrito.map((item) => (
                    <div key={`${item.id}-${item.talla}`} className="flex items-center gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-100 relative group">
                      <img src={item.imagen} alt={item.nombre} className="h-16 w-16 object-contain bg-white rounded-xl p-1 border border-neutral-100" />
                      <div className="grow">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{item.marca} • Talla {item.talla}</span>
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{item.nombre}</h4>
                        <p className="text-sm font-black text-neutral-900 mt-1">S/. {(item.precio * item.cantidad).toFixed(2)}</p>
                        
                        <div className="flex items-center gap-2.5 mt-2">
                          <button onClick={() => modificarCantidad(item.id, item.talla, -1)} className="h-6 w-6 border border-neutral-200 rounded-md bg-white text-xs font-bold flex items-center justify-center hover:border-neutral-900 cursor-pointer">-</button>
                          <span className="text-xs font-bold text-neutral-800 w-4 text-center">{item.cantidad}</span>
                          <button onClick={() => modificarCantidad(item.id, item.talla, 1)} className="h-6 w-6 border border-neutral-200 rounded-md bg-white text-xs font-bold flex items-center justify-center hover:border-neutral-900 cursor-pointer">+</button>
                        </div>
                      </div>
                      <button 
                        onClick={() => eliminarDelCarrito(item.id, item.talla)}
                        className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 text-xs font-bold p-1 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Neto:</span>
                <span className="text-2xl font-black text-neutral-900">S/. {totalCompra.toFixed(2)}</span>
              </div>
              
              <button 
                disabled={carrito.length === 0}
                onClick={enviarPedidoWhatsApp}
                className={`w-full font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider ${
                  carrito.length === 0
                    ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed shadow-none'
                    : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer active:scale-[0.99]'
                }`}
              >
                💬 Confirmar por WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 👟 MODAL DEL FORMULARIO ADMINISTRATIVO (CONEXIÓN ADICIONADA) */}
      {modalFormularioAbierto && (
        <FormularioProducto 
          alCerrar={() => setModalFormularioAbierto(false)}
          onProductoRegistrado={() => {
            // Refrescar catálogo automáticamente de forma limpia
            setBusqueda(prev => prev + ' ');
            setTimeout(() => setBusqueda(prev => prev.trim()), 50);
          }}
        />
      )}

    </div>
  );
}