import React, { useState } from 'react';
import API from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // Petición al endpoint de autenticación que actualizamos en FastAPI
      const response = await API.post('/auth/login', {
        email: email,
        password: password
      });

      // 🌟 CLAVE: Extraemos tanto el access_token como el rol del backend
      const { access_token, rol } = response.data;

      // Se los inyectamos al App.jsx para mapear la UI al instante
      onLoginSuccess(access_token, rol);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Error crítico de autenticación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans antialiased">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* LOGO / ENCABEZADO */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            SneakerHub <span className="text-neutral-500 font-medium text-xs block tracking-widest mt-1">Credenciales de Acceso</span>
          </h2>
          <p className="text-xs text-neutral-400">Ingresa para interactuar con la plataforma relacional</p>
        </div>

        {/* FEEDBACK DE ERROR BIEN VISIBLE */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3.5 rounded-xl text-center">
            ⚠️ {error}
          </div>
        )}

        {/* FORMULARIO DE INGRESO */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@sneakerhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Contraseña Segura</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-600"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full font-bold text-xs py-3.5 rounded-xl text-black bg-white hover:bg-neutral-200 uppercase tracking-widest transition-all cursor-pointer ${cargando ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
          >
            {cargando ? "Autenticando..." : "Entrar al Sistema →"}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">SneakerHub Ayacucho © 2026</span>
        </div>

      </div>
    </div>
  );
}