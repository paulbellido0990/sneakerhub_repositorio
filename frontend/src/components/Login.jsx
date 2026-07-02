import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  // Estados para capturar las credenciales de Paul Administrador
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 📝 Convertimos los datos a formato de formulario estándar (URLSearchParams)
      const datosFormulario = new URLSearchParams();
      datosFormulario.append('username', email); // OAuth2 requiere que se llame 'username'
      datosFormulario.append('password', password);

          // ✅ Corrección en frontend/src/components/Login.jsx
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: datosFormulario,
      }); 

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userEmail', email);

      if (onLoginSuccess) {
        onLoginSuccess(data.access_token);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            SneakerHub <span className="text-emerald-500">Ayacucho</span>
          </h2>
          <p className="text-sm text-gray-400 mt-2">Panel de Control y Administración</p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="admin@sneakerhub.pe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-lg shadow-md hover:shadow-emerald-500/20 transition duration-200"
          >
            {loading ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}