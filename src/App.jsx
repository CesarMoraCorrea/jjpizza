import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ClientMenu from './pages/ClientMenu';
import MenuPOS from './pages/MenuPOS';
import KitchenKDS from './pages/KitchenKDS';
import InventoryDashboard from './pages/InventoryDashboard';
import authService from './services/authService';
import AuthModal from './components/AuthModal';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Pop-up automático del modal de inicio de sesión al ingresar a rutas restringidas sin permisos
  useEffect(() => {
    const isStaffUser = authService.isStaff();
    const isAdminUser = authService.isAdmin();
    const isRestrictedRoute = ['/pos', '/kds', '/kitchen', '/admin', '/dashboard'].includes(path);

    if (isRestrictedRoute) {
      if ((['/pos', '/kds', '/kitchen'].includes(path) && !isStaffUser) ||
          (['/admin', '/dashboard'].includes(path) && !isAdminUser)) {
        setIsAuthModalOpen(true);
      }
    }
  }, [path, user]);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    setUser(authService.getCurrentUser());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
  };

  const renderAccessDenied = (requiredRoleName) => {
    return (
      <div className="min-h-[70vh] bg-[#141414] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1A1A1A] border-2 border-red-800/80 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center mx-auto text-red-500 shadow-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase text-white tracking-wide">
              Acceso Restringido
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Esta sección requiere permisos especiales de <strong className="text-[#F4C430] uppercase">{requiredRoleName}</strong>. Su sesión actual no posee la autorización necesaria.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border border-[#F4C430]/40"
            >
              <KeyRound className="w-4 h-4 text-[#F4C430]" />
              Iniciar Sesión con credenciales autorizadas
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-[#1E1E1E] hover:bg-[#252525] text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all border border-white/10"
            >
              Regresar al Menú Web
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const isStaffUser = authService.isStaff();
    const isAdminUser = authService.isAdmin();

    // RUTA: Caja / POS (/pos)
    if (path === '/pos') {
      if (!isStaffUser) {
        return renderAccessDenied('Staff o Administrador');
      }
      return (
        <MenuPOS 
          onNavigateToDashboard={() => navigate('/admin')} 
          onNavigateToClientMenu={() => navigate('/')} 
        />
      );
    }

    // RUTA: Cocina KDS (/kds o /kitchen)
    if (path === '/kds' || path === '/kitchen') {
      if (!isStaffUser) {
        return renderAccessDenied('Staff o Administrador');
      }
      return <KitchenKDS />;
    }

    // RUTA: Inventario / ERP (/admin o /dashboard)
    if (path === '/admin' || path === '/dashboard') {
      if (!isAdminUser) {
        return renderAccessDenied('Administrador');
      }
      return (
        <InventoryDashboard 
          onNavigateToPOS={() => navigate('/pos')} 
          onNavigateToClientMenu={() => navigate('/')} 
        />
      );
    }

    // RUTA PÚBLICA DEFAULT: Menú Web Cliente (/)
    return (
      <ClientMenu 
        onNavigateToPOS={() => navigate('/pos')} 
        onNavigateToDashboard={() => navigate('/admin')} 
      />
    );
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#141414] text-slate-100 flex flex-col font-sans">
      <Navbar 
        user={user} 
        currentPath={path} 
        onNavigate={navigate} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1">
        {renderContent()}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
