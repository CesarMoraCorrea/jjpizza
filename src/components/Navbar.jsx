import { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Monitor, 
  UtensilsCrossed, 
  Package, 
  Clock, 
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { socket } from '../services/socket';

export default function Navbar({ user, currentPath, onNavigate, onLogout }) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Si no hay usuario de personal (Staff/Admin) logueado, no mostrar la barra superior a clientes
  if (!user) {
    return null;
  }

  // Filtrar ítems de navegación según permisos de rol RBAC
  const allNavItems = [
    { path: '/', label: 'Menú Web', icon: UtensilsCrossed, allowedRoles: ['staff', 'admin'] },
    { path: '/pos', label: 'Caja / POS', icon: Monitor, allowedRoles: ['staff', 'admin'] },
    { path: '/kds', label: 'Cocina (KDS)', icon: Clock, allowedRoles: ['staff', 'admin'] },
    { path: '/admin', label: 'Inventario / ERP', icon: Package, allowedRoles: ['admin'] }
  ];

  const visibleNavItems = allNavItems.filter(item => item.allowedRoles.includes(user.role));

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', icon: ShieldCheck, color: 'bg-purple-950/80 text-purple-300 border-purple-600' };
      case 'staff':
      default:
        return { label: 'Staff', icon: UserCheck, color: 'bg-blue-950/80 text-blue-300 border-blue-600' };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const RoleIcon = roleBadge.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo & Marca */}
        <div 
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-[#8B1E1E] border-[3px] border-[#F4C430] flex items-center justify-center shadow-lg shadow-[#8B1E1E]/40 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden shrink-0">
            <ChefHat className="w-5 h-5 text-[#F4C430]" />
          </div>

          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none uppercase">
              JJ <span className="text-[#F4C430]">PIZZA</span>
            </h1>
            <p className="text-[9px] font-bold text-white/50 tracking-widest uppercase mt-0.5">Sistema Integrado ERP & POS</p>
          </div>
        </div>

        {/* Pestañas de Navegación Interna */}
        <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/admin' && (currentPath === '/dashboard' || currentPath === '/admin'));

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all duration-200 shrink-0 border ${
                  isActive
                    ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/40 scale-[1.02]'
                    : 'bg-[#1E1E1E] border-white/5 text-slate-400 hover:text-white hover:border-white/20 hover:bg-[#252525]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F4C430]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Estado Socket e Identificación del Empleado */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1E1E] border border-white/10 text-[10px] font-bold">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isConnected ? 'Sincronizado' : 'Conectando Sockets...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${roleBadge.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{user.name}</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1E1E] hover:bg-red-950 border border-white/10 text-red-400 text-xs font-bold transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
