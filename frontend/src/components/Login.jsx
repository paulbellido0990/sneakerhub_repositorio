import React, { useState } from 'react';
import API from '../api';

export default function Login({ onLoginSuccess }) {
  const [esRegistro, setEsRegistro] = useState(false); // Alternador de pestañas
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (esRegistro && (!nombre || !telefono))) {
      setError("Por favor, completa todos los campos del formulario.");
      return;
    }

    // 🌟 Criterio de Aceptación 2: Validación por Regex en el Cliente (Exactamente 9 dígitos)
    if (esRegistro) {
      const regexTelefono = /^\d{9}$/;
      if (!regexTelefono.test(telefono)) {
        setError("El número telefónico debe contener exactamente 9 dígitos numéricos.");
        return;
      }
    }

    setCargando(true);

    try {
      if (esRegistro) {
        // Petición al endpoint de registro
        const response = await API.post('/auth/register', {
          nombre,
          email,
          password,
          telefono
        });
        const { access_token, rol, nombre: nameRes } = response.data;
        onLoginSuccess(access_token, rol, nameRes);
      } else {
        // Petición al endpoint de login
        const response = await API.post('/auth/login', {
          email,
          password
        });
        const { access_token, rol, nombre: nameRes } = response.data;
        onLoginSuccess(access_token, rol, nameRes);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Sucedió un error crítico en el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans antialiased">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* LOGO / ENCABEZADO */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            SneakerHub
          </h2>
          <p className="text-xs text-neutral-400">
            {esRegistro ? "Crea una cuenta para guardar tu historial" : "Ingresa para interactuar con la plataforma relacional"}
          </p>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="grid grid-cols-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button 
            type="button"
            onClick={() => { setEsRegistro(false); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${!esRegistro ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
          >
            Iniciar Sesión
          </button>
          <button 
            type="button"
            onClick={() => { setEsRegistro(true); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${esRegistro ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
          >
            Registrarse
          </button>
        </div>

        {/* FEEDBACK DE ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3.5 rounded-xl text-center">
            ⚠️ {error}
          </div>
        )}

        {/* FORMULARIO ÚNICO ADAPTATIVO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {esRegistro && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-100">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Paul Llallahui"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-700"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@sneakerhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-700"
            />
          </div>

          {esRegistro && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-100">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Celular (Ayacucho Delivery)</label>
              <input 
                type="text" 
                maxLength="9"
                placeholder="9XXXXXXXX (9 dígitos)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-700 font-mono"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Contraseña de Seguridad</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-700"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full font-bold text-xs py-3.5 rounded-xl text-black bg-white hover:bg-neutral-200 uppercase tracking-widest transition-all cursor-pointer ${cargando ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
          >
            {cargando ? "Procesando..." : esRegistro ? "Crear Cuenta de Cliente" : "Entrar al Sistema →"}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">SneakerHub Ayacucho © 2026</span>
        </div>

      </div>
    </div>
  );
}