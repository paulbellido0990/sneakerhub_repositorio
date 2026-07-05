import React, { useState, useEffect } from 'react';
import API from './api';
import ProductCard from './components/ProductCard';
import Login from './components/Login'; 
import FormularioProducto from './components/FormularioProducto';
import ModalEditarStock from './components/ModalEditarStock'; 

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [rol, setRol] = useState(() => localStorage.getItem('rol'));
  const [nombreUsuario, setNombreUsuario] = useState(() => localStorage.getItem('nombre_usuario'));
  
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [validandoSesion, setValidandoSesion] = useState(true); 
  const [productoParaStock, setProductoParaStock] = useState(null); 

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('');
  const [verOcultos, setVerOcultos] = useState(false); 

  const [modalPedidosAbierto, setModalPedidosAbierto] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  // 📈 ESTADOS DE TELEMETRÍA DE BAJO STOCK (HU-08)
  const [modalReportesAbierto, setModalReportesAbierto] = useState(false);
  const [reportesBajoStock, setReportesBajoStock] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [marcaFiltroReporte, setMarcaFiltroReporte] = useState('');

  // 🛍️ ESTADOS HISTORIAL DE PEDIDOS CLIENTE (HU-11)
  const [modalMisPedidosAbierto, setModalMisPedidosAbierto] = useState(false);
  const [misPedidos, setMisPedidos] = useState([]);
  const [cargandoMisPedidos, setCargandoMisPedidos] = useState(false);
  const [miPedidoExpandido, setMiPedidoExpandido] = useState(null);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');

  const [carrito, setCarrito] = useState(() => {
    const datosLocales = localStorage.getItem('sneakerhub_cart');
    return datosLocales ? JSON.parse(datosLocales) : [];
  });
  const [menuCarritoAbierto, setMenuCarritoAbierto] = useState(false);

  useEffect(() => {
    localStorage.setItem('sneakerhub_cart', JSON.stringify(carrito));
  }, [carrito]);

  const totalCompra = carrito.reduce((sum, item) => sum + (Number(item.precio) * Number(item.cantidad)), 0);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const rolGuardado = localStorage.getItem('rol');
    const nombreGuardado = localStorage.getItem('nombre_usuario');
    
    if (!tokenGuardado) {
      setToken(null);
      setRol(null);
      setNombreUsuario(null);
      setValidandoSesion(false);
      return;
    }
    
    API.get('/productos/buscar', { params: { estado: 'ACTIVO' } })
      .then(() => {
        setToken(tokenGuardado);
        setRol(rolGuardado);
        setNombreUsuario(nombreGuardado);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('nombre_usuario');
        setToken(null);
        setRol(null);
        setNombreUsuario(null);
      })
      .finally(() => setValidandoSesion(false));
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    
    const modoOcultoActivo = (rol === 'admin') ? verOcultos : false;
    const params = { estado: modoOcultoActivo ? 'INACTIVO' : 'ACTIVO' };
    
    if (busqueda) params.q = busqueda;
    if (tallaFiltro) params.talla = tallaFiltro;

    API.get('/productos/buscar', { params })
      .then((response) => {
        setProductos(response.data);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error de comunicación con el motor relacional.");
        setCargando(false);
      });
  }, [busqueda, tallaFiltro, verOcultos, rol]);

  useEffect(() => {
    if (modalPedidosAbierto && rol === 'admin') {
      setCargandoPedidos(true);
      setPedidoExpandido(null);
      const tokenGuardado = localStorage.getItem('token');
      API.get('/pedidos/', { headers: { Authorization: `Bearer ${tokenGuardado}` } })
        .then((res) => {
          setPedidos(res.data);
          setCargandoPedidos(false);
        })
        .catch((err) => {
          console.error("Fallo al obtener pedidos:", err);
          setCargandoPedidos(false);
        });
    }
  }, [modalPedidosAbierto, rol]);

  useEffect(() => {
    if (modalReportesAbierto && rol === 'admin') {
      setCargandoReportes(true);
      const tokenGuardado = localStorage.getItem('token');
      API.get('/admin/reportes/bajo-stock', { headers: { Authorization: `Bearer ${tokenGuardado}` } })
        .then((res) => {
          setReportesBajoStock(res.data);
          setCargandoReportes(false);
        })
        .catch((err) => {
          console.error("Fallo al sincronizar telemetría:", err);
          setCargandoReportes(false);
        });
    }
  }, [modalReportesAbierto, rol]);

  useEffect(() => {
    if (modalMisPedidosAbierto && token) {
      setCargandoMisPedidos(true);
      setMiPedidoExpandido(null);
      const tokenGuardado = localStorage.getItem('token');
      API.get('/pedidos/mis-pedidos', { headers: { Authorization: `Bearer ${tokenGuardado}` } })
        .then((res) => {
          setMisPedidos(res.data);
          setCargandoMisPedidos(false);
        })
        .catch((err) => {
          console.error("Fallo al sincronizar historial propio:", err);
          setCargandoMisPedidos(false);
        });
    }
  }, [modalMisPedidosAbierto, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre_usuario');
    setToken(null);
    setRol(null);
    setNombreUsuario(null);
    setModalPedidosAbierto(false);
    setModalReportesAbierto(false);
    setModalMisPedidosAbierto(false);
  };

  const handleOcultarProducto = async (id) => {
    const tokenGuardado = localStorage.getItem('token');
    try {
      await API.delete(`/productos/${id}`, { headers: { 'Authorization': `Bearer ${tokenGuardado}` } });
      setProductos((prev) => prev.filter(p => p.id !== id));
      setProductoSeleccionado(null);
    } catch (err) {
      alert(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleActivarProducto = async (id) => {
    const tokenGuardado = localStorage.getItem('token');
    try {
      await API.post(`/productos/${id}/activar`, {}, { headers: { 'Authorization': `Bearer ${tokenGuardado}` } });
      setProductos((prev) => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  const agregarAlCarrito = () => {
    if (!tallaSeleccionada) { alert("Selecciona una talla"); return; }
    const variante = productoSeleccionado.variantes_color?.[0];
    const img = variante?.imagenes?.find(i => i.es_principal)?.url_imagen || variante?.imagenes?.[0]?.url_imagen;

    const precioReal = productoSeleccionado.precio_final 
      || (productoSeleccionado.precio_base * (1 - (productoSeleccionado.porcentaje_descuento || 0) / 100)).toFixed(2);

    setCarrito((prevCarrito) => {
      const existente = prevCarrito.find(i => i.id === productoSeleccionado.id && i.talla === tallaSeleccionada);
      if (existente) {
        return prevCarrito.map(i => (i.id === productoSeleccionado.id && i.talla === tallaSeleccionada) ? { ...i, ...{ cantidad: i.cantidad + 1 } } : i);
      } else {
        return [...prevCarrito, { id: productoSeleccionado.id, nombre: productoSeleccionado.nombre, marca: productoSeleccionado.marca?.nombre, precio: parseFloat(precioReal), talla: tallaSeleccionada, imagen: img, cantidad: 1 }];
      }
    });

    setTallaSeleccionada(''); 
    setProductoSeleccionado(null); 
    setMenuCarritoAbierto(true);
  };

  const modificarCantidad = (id, talla, factor) => {
    setCarrito((prevCarrito) =>
      prevCarrito
        .map(i => (i.id === id && i.talla === talla) ? { ...i, ...{ cantidad: Number(i.cantidad) + factor } } : i)
        .filter(i => i.cantidad > 0)
    );
  };

  const enviarPedidoWhatsApp = async () => {
    if (carrito.length === 0) return;
    try {
      const pedidoPayload = {
        nombre_cliente: nombreUsuario || "Cliente Web SneakerHub",
        detalles: carrito.map(item => ({
          producto_id: item.id,
          talla: item.talla,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        }))
      };

      await API.post('/pedidos/', pedidoPayload);

      const CELULAR_TIENDA = "51999999999"; 
      let mensaje = `🚨 *¡Hola SneakerHub Ayacucho!* \n`;
      mensaje += `Quiero realizar un pedido con el siguiente detalle:\n\n`;
      carrito.forEach((item) => {
        mensaje += `👟 *${item.nombre}* \n📏 *Talla:* ${item.talla} | *Cant:* ${item.cantidad}\n💵 *Subtotal:* S/. ${(item.precio * item.cantidad).toFixed(2)}\n-------------------------------------------\n`;
      });
      mensaje += `💰 *TOTAL A PAGAR: S/. ${totalCompra.toFixed(2)}*\n\nMi pedido ya quedó registrado en el sistema. ¿Coordinamos?`;

      setCarrito([]);
      setMenuCarritoAbierto(false);
      window.open(`https://wa.me/${CELULAR_TIENDA}?text=${encodeURIComponent(mensaje)}`, '_blank');
    } catch (err) {
      alert(`Error en el motor de inventario: ${err.response?.data?.detail || "No se pudo registrar el pedido."}`);
    }
  };

  // 🌟 MUTACIÓN EN CALIENTE DE ESTADOS (HU-12)
  const handleCambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    const tokenGuardado = localStorage.getItem('token');
    try {
      await API.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${tokenGuardado}` }
      });
      // Sincronizamos el estado local instantáneamente sin necesidad de re-consultar la base de datos
      setPedidos((prev) => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    } catch (err) {
      alert(`Error al actualizar estado: ${err.response?.data?.detail || err.message}`);
    }
  };

  const marcasReporte = Array.isArray(reportesBajoStock) 
    ? [...new Set(reportesBajoStock.map(item => item?.marca).filter(Boolean))]
    : [];

  const reportesFiltrados = Array.isArray(reportesBajoStock)
    ? (marcaFiltroReporte ? reportesBajoStock.filter(item => item?.marca === marcaFiltroReporte) : reportesBajoStock)
    : [];

  if (validandoSesion) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans"><p className="text-xs font-black tracking-widest text-neutral-400 animate-pulse">Verificando Credenciales...</p></div>;
  
  if (mostrarLogin) return (
    <div className="relative">
      <button onClick={() => setMostrarLogin(false)} className="absolute top-4 left-4 bg-white/10 text-white font-bold text-xs px-4 py-2 rounded-xl border border-gray-700 z-50 cursor-pointer">← Volver al Catálogo</button>
      <Login onLoginSuccess={(t, r, n) => {
        localStorage.setItem('token', t);
        localStorage.setItem('rol', r);
        localStorage.setItem('nombre_usuario', n);
        setToken(t);
        setRol(r);
        setNombreUsuario(n);
        setMostrarLogin(false);
      }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased">
      
      {token && rol === 'admin' && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 flex justify-between items-center animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>🛡️ Panel Administrativo ({nombreUsuario})</span>
            <button onClick={() => setModalFormularioAbierto(true)} className="bg-white text-emerald-800 px-3 py-1 rounded-lg text-[11px] font-black hover:bg-neutral-100 cursor-pointer uppercase">+ Añadir Zapatilla</button>
            <button onClick={() => setVerOcultos(!verOcultos)} className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${verOcultos ? 'bg-amber-500 text-white' : 'bg-neutral-950 text-white'}`}>{verOcultos ? "👀 Ver Catálogo" : "🗄️ Ver Ocultos"}</button>
            <button onClick={() => setModalPedidosAbierto(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-lg text-[11px] font-black uppercase cursor-pointer">📋 Historial de Pedidos</button>
            <button onClick={() => { setModalReportesAbierto(true); setMarcaFiltroReporte(''); }} className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-lg text-[11px] font-black uppercase cursor-pointer shadow-xs">📈 Alertas de Stock</button>
          </div>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer uppercase">Cerrar Sesión</button>
        </div>
      )}

      {/* HEADER DINÁMICO */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 px-4 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-black tracking-tight uppercase">SneakerHub <span className="text-neutral-400 font-normal text-sm">Ayacucho</span></h1>
          <div className="flex items-center gap-4">
            {token && (
              <span className="text-xs font-bold text-neutral-600">
                👋 Hola, <b className="text-neutral-900 font-black">{nombreUsuario}</b>
              </span>
            )}
            
            {token && rol !== 'admin' && (
              <button onClick={() => setModalMisPedidosAbierto(true)} className="border border-neutral-200 text-neutral-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors">📋 Mis Compras</button>
            )}

            {!token ? (
              <button onClick={() => setMostrarLogin(true)} className="border border-neutral-200 text-neutral-600 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer">Ingresar 🔐</button>
            ) : (
              <div className="flex items-center gap-2">
                {rol !== 'admin' && (
                  <button onClick={handleLogout} className="text-neutral-400 hover:text-red-600 font-bold text-xs px-2 py-1 cursor-pointer transition-colors">Salir</button>
                )}
              </div>
            )}
            <button onClick={() => setMenuCarritoAbierto(true)} className="bg-neutral-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer">🛒 Mi Carrito <span className="bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-black">{carrito.reduce((s, i) => s + i.cantidad, 0)}</span></button>
          </div>
        </div>
      </header>

      {/* FILTROS */}
      <section className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">¿Qué zapatillas buscas?</label>
            <input type="text" placeholder="Ej. Jordan..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filtrar por tu Talla</label>
            <select value={tallaFiltro} onChange={(e) => setTallaFiltro(e.target.value)} className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-neutral-50 focus:outline-none cursor-pointer">
              <option value="">Todas las tallas disponibles</option>
              {["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"].map(t => <option key={t} value={t}>Talla {t}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            {(busqueda || tallaFiltro) && <button onClick={() => { setBusqueda(''); setTallaFiltro(''); }} className="w-full md:w-auto text-xs font-bold uppercase bg-neutral-100 text-neutral-700 px-5 py-3 rounded-xl cursor-pointer">Limpiar Filtros</button>}
          </div>
        </div>
      </section>

      {/* FEED DE PRODUCTOS PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center text-red-600 mb-6">{error}</div>}
        {cargando ? (
          <div className="flex items-center justify-center py-20"><p className="text-neutral-400 font-medium animate-pulse">Sincronizando con el servidor...</p></div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border p-8">
            <p className="text-neutral-500 font-bold text-lg">{verOcultos ? "No hay archivados" : "No encontramos zapatillas con esos filtros"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductCard 
                key={producto.id} 
                producto={producto} 
                alSeleccionar={(p) => { setProductoSeleccionado(p); setTallaSeleccionada(''); }} 
                onEditarStock={rol === 'admin' ? (p) => setProductoParaStock(p) : null} 
                onOcultarProducto={rol === 'admin' ? handleOcultarProducto : null} 
                onActivarProducto={rol === 'admin' ? handleActivarProducto : null} 
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL FICHA TÉCNICA */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            <button onClick={() => setProductoSeleccionado(null)} className="absolute top-4 right-4 z-10 bg-white/80 border h-8 w-8 rounded-full flex items-center justify-center font-bold cursor-pointer">✕</button>
            <div className="md:w-1/2 bg-neutral-50 p-8 flex items-center justify-center"><img src={productoSeleccionado.variantes_color?.[0]?.imagenes?.find(img => img.es_principal)?.url_imagen || productoSeleccionado.variantes_color?.[0]?.imagenes?.[0]?.url_imagen} alt={productoSeleccionado.nombre} className="max-h-64 md:max-h-full max-w-full object-contain" /></div>
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-neutral-400 tracking-widest">{productoSeleccionado.marca?.nombre} • {productoSeleccionado.categoria?.nombre}</span>
                <h2 className="text-xl font-black text-neutral-900 mt-1">{productoSeleccionado.nombre}</h2>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-900">S/. {productoSeleccionado.precio_final || (productoSeleccionado.precio_base * (1 - (productoSeleccionado.porcentaje_descuento || 0) / 100)).toFixed(2)}</span>
                  {productoSeleccionado.porcentaje_descuento > 0 && <span className="text-sm text-neutral-400 line-through">S/. {productoSeleccionado.precio_base}</span>}
                </div>
                <p className="text-xs text-neutral-500 mt-4 leading-relaxed">{productoSeleccionado.descripcion || "Sin descripción técnica disponible por el momento."}</p>
                <div className="border-t border-neutral-100 my-4"></div>
                <h4 className="text-xs font-bold text-neutral-400 mb-3">Selecciona tu talla:</h4>
                <div className="flex flex-wrap gap-2">
                  {productoSeleccionado.variantes_color?.[0]?.tallares_stock?.map((item) => (
                    <button key={item.id} disabled={item.stock === 0} onClick={() => setTallaSeleccionada(item.talla)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${item.stock === 0 ? 'border-neutral-100 text-neutral-300 bg-neutral-100 line-through' : tallaSeleccionada === item.talla ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-800 cursor-pointer'}`}>{item.talla}</button>
                  ))}
                </div>
              </div>
              <div className="mt-8"><button onClick={agregarAlCarrito} className="w-full bg-neutral-900 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-neutral-800 cursor-pointer">Agregar al Carrito</button></div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL: MI PEDIDO */}
      {menuCarritoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="absolute inset-0" onClick={() => setMenuCarritoAbierto(false)}></div>
          <div key={totalCompra} className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-150">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4"><h2 className="text-lg font-black uppercase">Mi Pedido</h2><button type="button" onClick={() => setMenuCarritoAbierto(false)} className="text-neutral-400 font-bold p-1 cursor-pointer">Cerrar ✕</button></div>
              <div className="overflow-y-auto max-h-[65vh] space-y-4 pr-1">
                {carrito.length === 0 ? <p className="text-center text-neutral-400 text-sm py-12">Carrito vacío.</p> : (
                  carrito.map((item) => (
                    <div key={`${item.id}-${item.talla}`} className="flex items-center gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-100 relative">
                      <img src={item.imagen} alt={item.nombre} className="h-16 w-16 object-contain bg-white rounded-xl" />
                      <div className="grow">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{item.marca} • Talla {item.talla}</span>
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{item.nombre}</h4>
                        <p className="text-sm font-black text-neutral-900 mt-1">S/. {(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</p>
                        <div className="flex items-center gap-2.5 mt-2">
                          <button type="button" onClick={() => modificarCantidad(item.id, item.talla, -1)} className="h-6 w-6 border rounded-md bg-white text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-neutral-200 text-neutral-400 transition-all">-</button>
                          <span className="text-xs font-black text-neutral-900 w-5 text-center inline-block">{item.cantidad}</span>
                          <button type="button" onClick={() => modificarCantidad(item.id, item.talla, 1)} className="h-6 w-6 border rounded-md bg-white text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-neutral-200 text-neutral-400 transition-all">+</button>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCarrito(carrito.filter(i => !(i.id === item.id && i.talla === item.talla)))} className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 text-xs font-bold cursor-pointer">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-neutral-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4"><span className="text-sm font-bold text-neutral-500 uppercase">Total Neto:</span><span className="text-2xl font-black text-neutral-900">S/. {totalCompra.toFixed(2)}</span></div>
              <button type="button" disabled={carrito.length === 0} onClick={enviarPedidoWhatsApp} className="w-full font-bold text-sm py-3.5 rounded-xl text-white flex items-center justify-center gap-2 uppercase tracking-wider bg-green-600 hover:bg-green-700 cursor-pointer">💬 Confirmar por WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUDITORÍA DE PEDIDOS (ADMIN - ACTUALIZADO HU-12 CON COMBOBOX CONTROLADO) */}
      {modalPedidosAbierto && rol === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">📈 Auditoría Transaccional de Ventas</h3>
                <p className="text-xs text-neutral-400">Cambia el estado en el selector para actualizar al cliente en tiempo real</p>
              </div>
              <button onClick={() => setModalPedidosAbierto(false)} className="bg-neutral-100 text-neutral-800 font-bold h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-xs">✕</button>
            </div>
            <div className="grow overflow-y-auto">
              {cargandoPedidos ? (
                <p className="text-center py-12 text-sm text-neutral-400 animate-pulse font-medium">Extrayendo datos de base de datos...</p>
              ) : pedidos.length === 0 ? (
                <p className="text-center py-12 text-sm text-neutral-400 font-bold">Aún no se registran transacciones de venta en el sistema.</p>
              ) : (
                <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                        <th className="px-4 py-3">ID Pedido</th>
                        <th className="px-4 py-3">Fecha y Hora</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3 text-center">Volumen</th>
                        {/* 🌟 HU-12: El encabezado ahora indica Gestión de Flujo */}
                        <th className="px-4 py-3">Gestión de Estado</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs text-neutral-700">
                      {pedidos.map((order) => {
                        const estaAbierto = pedidoExpandido === order.id;
                        return (
                          <React.Fragment key={order.id}>
                            <tr onClick={() => setPedidoExpandido(estaAbierto ? null : order.id)} className={`hover:bg-neutral-50/70 transition-colors cursor-pointer ${estaAbierto ? 'bg-blue-50/30' : ''}`}>
                              <td className="px-4 py-3.5 font-mono font-bold text-neutral-400">#00{order.id}</td>
                              <td className="px-4 py-3.5 text-neutral-500">{new Date(order.fecha_pedido).toLocaleString('es-PE')}</td>
                              <td className="px-4 py-3.5 font-bold text-neutral-900">{order.nombre_cliente}</td>
                              <td className="px-4 py-3.5 text-center font-bold text-neutral-500 bg-neutral-50/30">{order.detalles?.reduce((sum, d) => sum + d.cantidad, 0)} u.</td>
                              
                              {/* 🌟 HU-12 INTEGRADO: Dropdown interactivo con stopPropagation perimetral */}
                              <td className="px-4 py-3.5">
                                <select
                                  value={order.estado}
                                  onClick={(e) => e.stopPropagation()} // 🛡️ Evita colapsar la fila al interactuar
                                  onChange={(e) => handleCambiarEstadoPedido(order.id, e.target.value)}
                                  className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                                    order.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    order.estado === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    order.estado === 'ENVIADO' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                    'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  <option value="PENDIENTE">⏳ PENDIENTE</option>
                                  <option value="CONFIRMADO">✅ CONFIRMADO</option>
                                  <option value="ENVIADO">🚚 ENVIADO</option>
                                  <option value="ENTREGADO">📦 ENTREGADO</option>
                                </select>
                              </td>

                              <td className="px-4 py-3.5 text-right font-black text-neutral-900 text-sm">S/. {parseFloat(order.total).toFixed(2)}</td>
                              <td className="px-4 py-3.5 text-center"><button type="button" className="text-blue-600 font-bold text-xs hover:underline">{estaAbierto ? "🙈 Cerrar" : "👁️ Detalles"}</button></td>
                            </tr>
                            {estaAbierto && (
                              <tr className="bg-neutral-50/60 select-none animate-in fade-in duration-200">
                                <td colSpan="7" className="px-6 py-4 border-t border-b border-neutral-200">
                                  <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">📦 Artículos Facturados en la Transacción:</h4>
                                    <div className="bg-white rounded-xl border border-neutral-200/80 overflow-hidden divide-y divide-neutral-100 shadow-3xs">
                                      {order.detalles?.map((det) => (
                                        <div key={det.id} className="p-3.5 flex justify-between items-center text-xs">
                                          <div>
                                            <span className="font-black text-neutral-900 uppercase tracking-tight">{det.producto?.nombre || `Calzado Modelo #${det.producto_id}`}</span>
                                            <span className="bg-neutral-100 text-neutral-600 font-bold ml-3 px-2 py-0.5 rounded-md text-[10px]">📏 Talla {det.talla}</span>
                                          </div>
                                          <div className="flex gap-8 text-neutral-500 font-medium">
                                            <span>Cant: <b className="text-neutral-900 font-bold">{det.cantidad}</b></span>
                                            <span>Precio: <b className="text-neutral-900 font-bold">S/. {parseFloat(det.precio_unitario).toFixed(2)}</b></span>
                                            <span className="font-black text-neutral-900 border-l border-neutral-200 pl-4">Subtotal: S/. {(det.cantidad * det.precio_unitario).toFixed(2)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DASHBOARD DE ALERTAS CRÍTICAS DE STOCK (HU-08) */}
      {modalReportesAbierto && rol === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">🚨 Telemetría de Rotura de Stock</h3>
                <p className="text-xs text-neutral-400">Variantes con inventario crítico menor o igual a 2 unidades para reposición</p>
              </div>
              <button onClick={() => setModalReportesAbierto(false)} className="self-end sm:self-center bg-neutral-100 text-neutral-800 font-bold h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-xs">✕</button>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center gap-3 mb-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Filtrar por Marca Fabricante:</label>
              <select value={marcaFiltroReporte} onChange={(e) => setMarcaFiltroReporte(e.target.value)} className="bg-white border border-neutral-200 rounded-lg text-xs font-bold py-1 px-2.5 focus:outline-none cursor-pointer text-neutral-800">
                <option value="">Todas las marcas globales</option>
                {marcasReporte.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>
            <div className="grow overflow-y-auto">
              {cargandoReportes ? (
                <p className="text-center py-12 text-sm text-neutral-400 animate-pulse font-medium">Ejecutando agregación en MySQL...</p>
              ) : reportesFiltrados.length === 0 ? (
                <p className="text-center py-12 text-sm text-neutral-500 font-bold">🎉 No existen variantes críticamente agotadas en esta selección.</p>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                        <th className="px-4 py-2.5">Marca</th>
                        <th className="px-4 py-2.5">Modelo Zapatilla</th>
                        <th className="px-4 py-2.5">Variante Color</th>
                        <th className="px-4 py-2.5 text-center">Talla</th>
                        <th className="px-4 py-2.5 text-center bg-red-50 text-red-700">Stock Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs text-neutral-700">
                      {reportesFiltrados.map((item) => (
                        <tr key={item.talla_id} className={`transition-colors ${item.stock === 0 ? 'bg-red-50/60 font-black text-red-600' : 'bg-amber-50/30 text-amber-900'}`}>
                          <td className="px-4 py-3 font-black uppercase tracking-tight text-[11px]">{item.marca}</td>
                          <td className="px-4 py-3 font-medium">{item.nombre}</td>
                          <td className="px-4 py-3 text-neutral-500">{typeof item?.color === 'object' ? (item?.color?.nombre || "Estándar") : (item?.color || "Estándar")}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">US {item.talla}</td>
                          <td className="px-4 py-3 text-center font-black bg-red-100/40 text-red-600 border-l border-red-200 text-sm">{item.stock} u. {item.stock === 0 ? '🚫 AGOTADO' : '⚠️'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="border-t border-neutral-100 pt-3 mt-4 text-right"><span className="text-[10px] text-neutral-400 font-bold uppercase font-mono">Telemetría Activa de Almacén</span></div>
          </div>
        </div>
      )}

      {/* VISTA DEL MODAL: HISTORIAL PROPIO DE COMPRAS (CLIENTE) */}
      {modalMisPedidosAbierto && token && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">📦 Mi Historial de Compras</h3>
                <p className="text-xs text-neutral-400">Consulta tus pedidos registrados y su estado actual en tienda</p>
              </div>
              <button onClick={() => setModalMisPedidosAbierto(false)} className="bg-neutral-100 text-neutral-800 font-bold h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-xs">✕</button>
            </div>
            <div className="grow overflow-y-auto">
              {cargandoMisPedidos ? (
                <p className="text-center py-12 text-sm text-neutral-400 animate-pulse font-medium">Sincronizando tus transacciones con MySQL...</p>
              ) : misPedidos.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-sm text-neutral-500 font-bold">Aún no has realizado ninguna compra en SneakerHub.</p>
                  <p className="text-xs text-neutral-400">¡Arma tu pedido y confírmalo para verlo aquí reflejado!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {misPedidos.map((pedido) => {
                    const estaAbierto = miPedidoExpandido === pedido.id;
                    return (
                      <div key={pedido.id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-3xs transition-all">
                        <div 
                          onClick={() => setMiPedidoExpandido(estaAbierto ? null : pedido.id)}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/80 transition-colors ${estaAbierto ? 'bg-neutral-50/50' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-black text-neutral-400 text-xs">#00{pedido.id}</span>
                            <div className="text-xs">
                              <p className="text-neutral-400 font-medium">{new Date(pedido.fecha_pedido).toLocaleString('es-PE')}</p>
                              <p className="text-neutral-500 font-bold mt-0.5">Volumen: {pedido.detalles?.reduce((s, d) => s + d.cantidad, 0)} u.</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                                pedido.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                pedido.estado === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                pedido.estado === 'ENVIADO' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                                {pedido.estado}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-neutral-400 block uppercase">Total Invertido</span>
                              <span className="text-sm font-black text-neutral-900">S/. {parseFloat(pedido.total).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        {estaAbierto && (
                          <div className="bg-neutral-50/50 p-4 border-t border-neutral-200 divide-y divide-neutral-200/60 animate-in fade-in duration-150">
                            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">👟 Calzado Facturado:</p>
                            {pedido.detalles?.map((det) => (
                              <div key={det.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-neutral-900 uppercase tracking-tight">{det.producto?.nombre || "Modelo Premium SneakerHub"}</span>
                                  <span className="bg-white border text-neutral-600 font-bold px-1.5 py-0.5 rounded-md text-[10px]">Talla {det.talla}</span>
                                </div>
                                <div className="flex justify-between sm:justify-end gap-6 text-neutral-500">
                                  <span>Unidades: <b className="text-neutral-800 font-black">{det.cantidad}</b></span>
                                  <span>Unitario: <b className="text-neutral-800 font-bold">S/. {parseFloat(det.precio_unitario).toFixed(2)}</b></span>
                                  <span className="font-black text-neutral-900">S/. {(det.cantidad * det.precio_unitario).toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-neutral-100 pt-3 mt-4 text-center"><p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">¡Gracias por confiar en SneakerHub Ayacucho! S/. Pen</p></div>
          </div>
        </div>
      )}

      {modalFormularioAbierto && rol === 'admin' && <FormularioProducto alCerrar={() => setModalFormularioAbierto(false)} onProductoRegistrado={() => { setBusqueda(prev => prev + ' '); setTimeout(() => setBusqueda(prev => prev.trim()), 50); }} />}
      {productoParaStock && rol === 'admin' && <ModalEditarStock producto={productoParaStock} alCerrar={() => setProductoParaStock(null)} onStockActualizado={() => { setBusqueda(prev => prev + ' '); setTimeout(() => setBusqueda(prev => prev.trim()), 50); }} />}

    </div>
  );
}