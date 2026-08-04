import { useState, useEffect } from 'react';
import { X, Lock, Mail, UserCheck, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import authService from '../services/authService';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bloqueo de scroll del fondo cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Ingrese su correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login(email.trim(), password.trim());
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.response?.data?.message || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    try {
      setLoading(true);
      const res = await authService.login(quickEmail, quickPassword);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión de prueba.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 touch-manipulation cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#1A1A1A] border-2 border-[#F4C430]/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn cursor-default"
      >
        
        {/* Indicador de cierre deslizable para móviles */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2.5 rounded-full bg-white/5 active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-full bg-[#8B1E1E] border border-[#F4C430] flex items-center justify-center text-[#F4C430]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Iniciar <span className="text-[#F4C430]">Sesión</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold">Acceso Controlado por Roles (RBAC)</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/80 border border-red-600 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-[#F4C430] uppercase tracking-wider block mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="ejemplo@jjpizza.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 pl-9 rounded-xl focus:border-[#F4C430] outline-none font-bold min-h-[44px]"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#F4C430] uppercase tracking-wider block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 pl-9 rounded-xl focus:border-[#F4C430] outline-none font-bold min-h-[44px]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border border-[#F4C430]/30 min-h-[44px]"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F4C430]" /> : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Accesos Rápidos de Demostración por Rol */}
        <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">
            Accesos Rápidos Demo Personal:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@jjpizza.com', 'Admin123!')}
              className="py-3 px-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 active:scale-95 border border-purple-600 text-purple-200 text-[10px] font-extrabold flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('caja@jjpizza.com', 'Staff123!')}
              className="py-3 px-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 active:scale-95 border border-blue-600 text-blue-200 text-[10px] font-extrabold flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Staff / Cajero</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
