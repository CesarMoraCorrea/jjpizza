import { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  X, 
  AlertTriangle,
  ShoppingBag, 
  RefreshCw, 
  Search,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  DollarSign,
  Printer,
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  Calculator,
  UserCheck,
  CheckCheck
} from 'lucide-react';
import inventoryService from '../services/inventoryService';
import orderService from '../services/orderService';
import shiftService from '../services/shiftService';
import { socket } from '../services/socket';

const getProductImage = (category, productName) => {
  const cat = category?.toLowerCase() || '';
  const name = productName?.toLowerCase() || '';
  
  if (name.includes('hawaiana') || name.includes('hamaiana')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=400&fit=crop';
  }
  if (name.includes('mexicana')) {
    return 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&h=400&fit=crop';
  }
  if (cat.includes('pizza') || name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=400&fit=crop';
  }
  if (cat.includes('lasagna') || name.includes('lasagna')) {
    return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&h=400&fit=crop';
  }
  if (cat.includes('hamburguesa') || name.includes('hamburguesa') || cat.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop';
  }
  if (cat.includes('perro') || name.includes('perro')) {
    return 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&h=400&fit=crop';
  }
  if (cat.includes('salchi') || name.includes('salchi')) {
    return 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500&h=400&fit=crop';
  }
  if (cat.includes('maicito') || name.includes('maicito')) {
    return 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&h=400&fit=crop';
  }
  if (cat.includes('bebida') || name.includes('coca') || name.includes('hit')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=400&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop';
};

export default function MenuPOS({ onNavigateToDashboard, onNavigateToClientMenu }) {
  // Pestañas principales POS: 'direct_sale' | 'pending_accounts' | 'shift_audit'
  const [activePosTab, setActivePosTab] = useState('direct_sale');

  // Estado del Turno de Caja y Arqueo
  const [activeShift, setActiveShift] = useState(null);
  const [openShiftCashInput, setOpenShiftCashInput] = useState('50000'); // Fondo inicial por defecto
  const [openShiftLoading, setOpenShiftLoading] = useState(false);
  const [openShiftError, setOpenShiftError] = useState('');

  // Formulario de Conteo Físico para Cierre
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredCard, setDeclaredCard] = useState('');
  const [declaredTransfer, setDeclaredTransfer] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);
  const [closingError, setClosingError] = useState('');

  // Reporte Imprimible de Cierre Completo
  const [printedClosureReport, setPrintedClosureReport] = useState(null);

  // Datos Generales POS
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart State para Venta Directa
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [clientName, setClientName] = useState('Cliente Mostrador');
  const [tableNumber, setTableNumber] = useState('Mesa 1');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // Category & Search
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modifiers Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Payment Modal State para Cuentas Pendientes
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [payMethodSelect, setPayMethodSelect] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [payingLoading, setPayingLoading] = useState(false);

  const categories = ['todos', 'Pizzas', 'Hamburguesas', 'Lasagna', 'Perros', 'Maicitos', 'Bebidas'];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, supRes, orderRes, shiftRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getSupplies(),
        orderService.getOrders(),
        shiftService.getActiveShift()
      ]);
      setProducts(prodRes.data || []);
      setSupplies(supRes.data || []);
      setOrders(orderRes.data || []);
      setActiveShift(shiftRes.data || null);
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    socket.on('inventory:updated', loadData);
    socket.on('order:created', loadData);
    socket.on('order:status_changed', loadData);
    socket.on('order:updated', loadData);
    socket.on('shift:opened', loadData);
    socket.on('shift:closed', loadData);

    return () => {
      socket.off('inventory:updated', loadData);
      socket.off('order:created', loadData);
      socket.off('order:status_changed', loadData);
      socket.off('order:updated', loadData);
      socket.off('shift:opened', loadData);
      socket.off('shift:closed', loadData);
    };
  }, []);

  // Manejo de Apertura de Caja
  const handleOpenShift = async (e) => {
    e.preventDefault();
    setOpenShiftLoading(true);
    setOpenShiftError('');

    const initialVal = Number(openShiftCashInput);
    if (isNaN(initialVal) || initialVal < 0) {
      setOpenShiftError('Ingrese un fondo inicial válido ($0 o superior).');
      setOpenShiftLoading(false);
      return;
    }

    try {
      const res = await shiftService.openShift(initialVal);
      if (res.success) {
        setActiveShift(res.data);
        setActivePosTab('direct_sale');
        await loadData();
      }
    } catch (err) {
      console.error(err);
      setOpenShiftError(err.response?.data?.message || 'Error al abrir el turno de caja.');
    } finally {
      setOpenShiftLoading(false);
    }
  };

  // Manejo de Cierre y Arqueo Auditado de Caja
  const handleCloseShift = async (e) => {
    e.preventDefault();
    setClosingLoading(true);
    setClosingError('');

    const decCashVal = Number(declaredCash || 0);
    const decCardVal = Number(declaredCard || 0);
    const decTransVal = Number(declaredTransfer || 0);

    const expected = activeShift?.systemTotals?.totalExpected || 0;
    const declaredTotal = decCashVal + decCardVal + decTransVal;
    const diff = declaredTotal - expected;

    if (diff < 0 && (!shiftNotes || !shiftNotes.trim())) {
      setClosingError(`Hay un descuadre faltante de $${Math.abs(diff).toLocaleString('es-CO')}. Es obligatorio especificar la causa en las Notas.`);
      setClosingLoading(false);
      return;
    }

    try {
      const res = await shiftService.closeShift({
        declaredCash: decCashVal,
        declaredCard: decCardVal,
        declaredTransfer: decTransVal,
        notes: shiftNotes.trim()
      });

      if (res.success) {
        setPrintedClosureReport(res.data);
        setActiveShift(null);
        setDeclaredCash('');
        setDeclaredCard('');
        setDeclaredTransfer('');
        setShiftNotes('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
      setClosingError(err.response?.data?.message || 'Error al procesar el cierre de caja.');
    } finally {
      setClosingLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory && p.isActive;
  });

  const getAvailableExtras = () => {
    const extrasConfig = [
      { namePattern: 'Queso Mozzarella', displayName: 'Extra Queso Mozzarella', defaultQty: 30, price: 1500 },
      { namePattern: 'Tocineta Ahumada', displayName: 'Extra Tocineta Ahumada', defaultQty: 30, price: 2500 },
      { namePattern: 'Jamón Tajado', displayName: 'Extra Jamón Tajado', defaultQty: 40, price: 2000 }
    ];

    return extrasConfig.map(cfg => {
      const supply = supplies.find(s => s.name.toLowerCase().includes(cfg.namePattern.toLowerCase()));
      if (supply) {
        return {
          supplyId: supply._id,
          name: cfg.displayName,
          quantity: cfg.defaultQty,
          price: cfg.price,
          unit: supply.unit,
          availableStock: supply.stock
        };
      }
      return null;
    }).filter(Boolean);
  };

  const handleOpenModifiersModal = (product) => {
    if (product.stock <= 0) return;
    setSelectedProduct(product);
    setSelectedExtras([]);

    if (product.type === 'simple' && (!product.recipe || product.recipe.length === 0)) {
      addToCartDirect(product, []);
    } else {
      setIsModalOpen(true);
    }
  };

  const addToCartDirect = (product, extras = []) => {
    const cartItemId = `${product._id}-${extras.map(e => e.supplyId).sort().join(',')}`;
    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { cartItemId, product, quantity: 1, extras }]);
    }
  };

  const handleConfirmModifiers = () => {
    if (!selectedProduct) return;
    addToCartDirect(selectedProduct, selectedExtras);
    setIsModalOpen(false);
    setSelectedProduct(null);
    setSelectedExtras([]);
  };

  const toggleExtra = (extra) => {
    const exists = selectedExtras.some(e => e.supplyId === extra.supplyId);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.supplyId !== extra.supplyId));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const updateCartItemQuantity = (cartItemId, delta) => {
    const updatedCart = cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(updatedCart);
  };

  const getCartTotals = () => {
    let subtotal = 0;
    let extrasTotal = 0;

    cart.forEach(item => {
      subtotal += item.product.price * item.quantity;
      item.extras.forEach(ext => {
        extrasTotal += ext.price * item.quantity;
      });
    });

    const total = subtotal + extrasTotal;
    return { subtotal, extrasTotal, total };
  };

  const totals = getCartTotals();

  // PROCESAR VENTA ATÓMICA DE MOSTRADOR POS
  const handleCheckout = async () => {
    if (!activeShift) {
      alert('Debe realizar la Apertura de Caja antes de cobrar ventas.');
      setActivePosTab('shift_audit');
      return;
    }

    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    const payload = {
      clientName: clientName.trim() || 'Cliente Mostrador',
      orderType,
      tableNumber: orderType === 'dine_in' ? (tableNumber.trim() || 'Mesa 1') : undefined,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'preparing',
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        extras: item.extras.map(e => ({
          supplyId: e.supplyId,
          quantity: e.quantity,
          price: e.price,
          name: e.name
        }))
      }))
    };

    try {
      const response = await orderService.createOrder(payload);
      setCheckoutSuccess(`¡Venta cobrada e enviada a cocina! Total: $${response.data.totalAmount.toLocaleString('es-CO')}`);
      setCart([]);
      
      await loadData();
      
      setTimeout(() => {
        setCheckoutSuccess('');
      }, 4000);
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || 'Error al procesar la venta. Verifique el stock disponible.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // COBRAR CUENTA PENDIENTE
  const handleConfirmPayPendingOrder = async () => {
    if (!activeShift) {
      alert('Debe abrir el turno de caja antes de cobrar cuentas pendientes.');
      setPayModalOrder(null);
      setActivePosTab('shift_audit');
      return;
    }

    if (!payModalOrder) return;
    setPayingLoading(true);
    try {
      await orderService.updateOrderStatus(payModalOrder._id, {
        paymentStatus: 'paid',
        paymentMethod: payMethodSelect
      });

      setCheckoutSuccess(`¡Pago registrado con éxito para el pedido #${payModalOrder._id.slice(-6).toUpperCase()}!`);
      setPayModalOrder(null);
      setCashReceived('');
      await loadData();

      setTimeout(() => {
        setCheckoutSuccess('');
      }, 4000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al registrar el pago de la cuenta.');
    } finally {
      setPayingLoading(false);
    }
  };

  const pendingPaymentOrders = orders.filter(o => o.paymentStatus === 'pending');

  const getElapsedTime = (createdAt) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const minutes = Math.floor((now - start) / (1000 * 60));
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}m`;
  };

  const getKitchenStatusBadge = (status, orderType, tableNumber) => {
    if (orderType === 'dine_in' && (status === 'delivered' || status === 'completed')) {
      return {
        label: `🪑 Mesa ${tableNumber || '1'} - Servido en Mesa / Pendiente de Cobro`,
        style: 'bg-[#8B1E1E] text-[#F4C430] border-[#F4C430] font-black shadow-lg animate-pulse'
      };
    }
    switch (status) {
      case 'preparing':
        return {
          label: '🔥 En Cocina / Preparando',
          style: 'bg-amber-950/90 text-amber-300 border-amber-500 animate-pulse'
        };
      case 'ready':
      case 'delivered':
      case 'completed':
        return {
          label: '✨ ¡Listo para Cobrar / Entregar!',
          style: 'bg-emerald-950/90 text-emerald-300 border-emerald-400 font-black shadow-lg shadow-emerald-950'
        };
      case 'pending':
      default:
        return {
          label: '⏳ En Espera de Cocina',
          style: 'bg-blue-950/90 text-blue-300 border-blue-500'
        };
    }
  };

  // Cálculo en vivo de descuadre para Arqueo
  const currentDeclaredTotal = (Number(declaredCash) || 0) + (Number(declaredCard) || 0) + (Number(declaredTransfer) || 0);
  const currentExpectedTotal = activeShift?.systemTotals?.totalExpected || 0;
  const currentDifference = currentDeclaredTotal - currentExpectedTotal;

  const availableExtras = getAvailableExtras();

  return (
    <div className="min-h-screen bg-[#141414] text-slate-100 flex flex-col font-sans p-4 md:p-6">
      
      {/* Encabezado y Navegador de Pestañas POS */}
      <div className="max-w-7xl w-full mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-[#F4C430]" />
            Módulo de Caja <span className="text-[#F4C430]">& Punto de Venta (POS)</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Gestión Integrada de Cuentas por Cobrar, Venta Directa y Arqueo Auditado
          </p>
        </div>

        {/* Pestañas Principales POS */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] p-1.5 rounded-2xl border border-white/10 shadow-xl w-full sm:w-auto">
          <button
            onClick={() => setActivePosTab('direct_sale')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activePosTab === 'direct_sale'
                ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/40'
                : 'bg-[#141414] border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Venta Directa</span>
          </button>

          <button
            onClick={() => setActivePosTab('pending_accounts')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border relative ${
              activePosTab === 'pending_accounts'
                ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/40'
                : 'bg-[#141414] border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Cuentas por Cobrar</span>
            {pendingPaymentOrders.length > 0 && (
              <span className="bg-[#F4C430] text-black font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md animate-bounce">
                {pendingPaymentOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePosTab('shift_audit')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activePosTab === 'shift_audit'
                ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/40'
                : 'bg-[#141414] border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Arqueo & Cierre</span>
            <span className={`w-2.5 h-2.5 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </button>
        </div>

      </div>

      {checkoutSuccess && (
        <div className="max-w-7xl w-full mx-auto mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs p-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{checkoutSuccess}</span>
        </div>
      )}

      {/* BLOQUEO SI LA CAJA NO HA SIDO ABIERTA */}
      {!activeShift && activePosTab !== 'shift_audit' && (
        <div className="max-w-7xl w-full mx-auto mb-6 bg-red-950/40 border-2 border-red-800 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-900/80 border border-red-500 flex items-center justify-center text-red-300 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase">Turno de Caja Cerrado</h3>
              <p className="text-xs text-slate-300 font-semibold">
                Debe realizar la Apertura de Caja e ingresar la base inicial antes de procesar ventas o cobros.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePosTab('shift_audit')}
            className="px-5 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] text-[#F4C430] border border-[#F4C430]/40 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shrink-0"
          >
            Realizar Apertura de Caja
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: VENTA DIRECTA MOSTRADOR (Catálogo + Ticket) */}
      {/* ========================================================================= */}
      {activePosTab === 'direct_sale' && (
        <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          <section className="flex-1 flex flex-col gap-5 min-h-0">
            {error && (
              <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4 flex items-center gap-3 text-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="bg-[#1E1E1E] border border-white/10 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-md shadow-[#8B1E1E]/40 scale-105'
                        : 'bg-[#141414] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-56">
                <input
                  type="text"
                  placeholder="Buscar ítem..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 text-xs text-white rounded-xl py-2 pl-9 pr-8 focus:border-[#F4C430] outline-none font-bold"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#F4C430]" />
                  <p className="text-xs font-bold">Cargando catálogo en vivo...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-[#1E1E1E] border border-white/5 rounded-2xl mt-4">
                  No hay productos disponibles para mostrar.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => {
                    const isOutOfStock = product.stock <= 0;
                    const isPizza = product.category?.toLowerCase().includes('pizza');
                    const imageSrc = product.imageUrl || getProductImage(product.category, product.name);

                    return (
                      <div
                        key={product._id}
                        onClick={() => handleOpenModifiersModal(product)}
                        className={`group rounded-xl overflow-hidden bg-[#1E1E1E] border border-white/10 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                          isOutOfStock ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <div className="relative h-28 overflow-hidden bg-black">
                          <img 
                            src={imageSrc} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className={`p-2.5 flex flex-col justify-between flex-1 ${
                          isPizza ? 'bg-[#F4C430] text-black' : 'bg-[#8B1E1E] text-white'
                        }`}>
                          <div>
                            <h4 className={`font-extrabold text-xs leading-tight line-clamp-1 ${
                              isPizza ? 'text-black' : 'text-white'
                            }`}>
                              {product.name}
                            </h4>
                            <p className={`text-[10px] line-clamp-1 mt-0.5 ${
                              isPizza ? 'text-black/80' : 'text-white/80'
                            }`}>
                              {product.description || 'Deliciosa receta artesanal'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/10">
                            <span className={`font-mono text-xs font-black ${
                              isPizza ? 'text-black' : 'text-[#F4C430]'
                            }`}>
                              ${product.price?.toLocaleString('es-CO')}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isOutOfStock 
                                ? 'bg-red-900 text-red-100' 
                                : isPizza ? 'bg-black text-[#F4C430]' : 'text-[#F4C430]'
                            }`}>
                              {isOutOfStock ? 'Agotado' : 'En Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

          {/* PANEL DERECHO: TICKET DE VENTA */}
          <section className="w-full lg:w-[420px] bg-[#1A1A1A] border-2 border-[#F4C430]/60 rounded-2xl shadow-2xl flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 bg-[#141414] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F4C430]" />
                <h3 className="font-black text-white text-base uppercase tracking-wide">Ticket de Venta (POS)</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline"
                >
                  Vaciar Ticket
                </button>
              )}
            </div>

            <div className="p-4 bg-[#1E1E1E] border-b border-white/10 space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    orderType === 'dine_in'
                      ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]'
                      : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  🪑 En Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    orderType === 'pickup'
                      ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]'
                      : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  🛍️ Llevar
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    orderType === 'delivery'
                      ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]'
                      : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  🛵 Domicilio
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Cliente *"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="bg-[#141414] border border-white/10 text-xs text-white p-2 rounded-lg focus:border-[#F4C430] outline-none font-bold"
                />
                {orderType === 'dine_in' && (
                  <input
                    type="text"
                    placeholder="Mesa *"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    className="bg-[#141414] border border-white/10 text-xs text-white p-2 rounded-lg focus:border-[#F4C430] outline-none font-bold"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-[#F4C430]/30" />
                  <p className="text-xs font-bold">Ticket vacío</p>
                  <p className="text-[10px]">Haga clic en los productos para agregarlos al cobro.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="bg-[#141414] border border-white/10 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="pr-2">
                        <h4 className="font-extrabold text-xs text-white">{item.product.name}</h4>
                        <p className="text-[11px] font-mono text-[#F4C430] font-bold">
                          ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#252525] p-1 rounded-lg border border-white/10">
                        <button
                          onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                          className="p-0.5 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-black text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                          className="p-0.5 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {item.extras.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 space-y-0.5">
                        {item.extras.map((ext, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>+ {ext.name}</span>
                            <span className="font-mono text-[#F4C430]">+${ext.price.toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#141414] border-t border-white/10 space-y-4">
              {checkoutError && (
                <div className="bg-red-950/80 border border-red-600 text-red-200 text-xs p-2.5 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#F4C430] uppercase tracking-wider block">Método de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/50'
                        : 'bg-[#1E1E1E] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/50'
                        : 'bg-[#1E1E1E] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430] shadow-lg shadow-[#8B1E1E]/50'
                        : 'bg-[#1E1E1E] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Transfer.
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">${totals.subtotal.toLocaleString('es-CO')}</span>
                </div>
                {totals.extrasTotal > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Adicionales:</span>
                    <span className="font-mono text-[#F4C430]">+${totals.extrasTotal.toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="font-black text-white text-sm uppercase">Total Cobro:</span>
                  <span className="font-mono text-2xl font-black text-[#F4C430] drop-shadow-md">
                    ${totals.total.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-98 disabled:opacity-40 disabled:scale-100 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#8B1E1E]/40 flex items-center justify-center gap-2 border border-[#F4C430]/30 hover:border-[#F4C430]"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#F4C430]" />
                    Procesando Transacción...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 text-[#F4C430]" />
                    Procesar Venta & Enviar a Cocina
                  </>
                )}
              </button>

            </div>
          </section>

        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CUENTAS POR COBRAR */}
      {/* ========================================================================= */}
      {activePosTab === 'pending_accounts' && (
        <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-6">
          <div className="bg-[#1E1E1E] border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F4C430]" />
                Panel de Cuentas Pendientes de Cobro
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Sincronización en tiempo real con el estado de preparación de cocina (KDS).
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#141414] hover:bg-[#252525] border border-white/10 text-[#F4C430] rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar Cuentas
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#F4C430]" />
              <p className="text-xs font-bold">Cargando cuentas por cobrar...</p>
            </div>
          ) : pendingPaymentOrders.length === 0 ? (
            <div className="p-16 text-center bg-[#1E1E1E] border border-white/10 rounded-2xl space-y-3">
              <CheckCheck className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-lg font-black uppercase text-white">¡No hay cuentas pendientes por cobrar!</h3>
              <p className="text-xs text-slate-400 font-medium">Todas las ventas y comandas registradas han sido cobradas y cerradas exitosamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingPaymentOrders.map(order => {
                const kBadge = getKitchenStatusBadge(order.status, order.orderType, order.tableNumber);
                const orderCode = order._id.slice(-6).toUpperCase();

                const getTypeStyle = (type) => {
                  switch (type) {
                    case 'dine_in': return { label: `🪑 Mesa ${order.tableNumber || '1'}`, style: 'bg-purple-950/80 text-purple-300 border-purple-800' };
                    case 'delivery': return { label: '🛵 Domicilio', style: 'bg-blue-950/80 text-blue-300 border-blue-800' };
                    default: return { label: '🛍️ Para Llevar', style: 'bg-amber-950/80 text-amber-300 border-amber-800' };
                  }
                };

                const typeInfo = getTypeStyle(order.orderType);

                return (
                  <div 
                    key={order._id} 
                    className="bg-[#1E1E1E] border-2 border-white/10 hover:border-[#F4C430]/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div>
                      <div className="mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-1 rounded-full border ${kBadge.style}`}>
                          {kBadge.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
                        <div>
                          <span className="font-mono text-xs font-black text-[#F4C430] bg-[#141414] px-2 py-0.5 rounded border border-white/10">
                            #{orderCode}
                          </span>
                          <h3 className="font-extrabold text-white text-base mt-1">{order.clientName}</h3>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeInfo.style}`}>
                            {typeInfo.label}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            {getElapsedTime(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => {
                          const product = item.productId || {};
                          return (
                            <div key={idx} className="bg-[#141414] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-white">
                                  <strong className="text-[#F4C430] font-black mr-1">{item.quantity}x</strong>
                                  {product.name || 'Producto'}
                                </span>
                                <span className="font-mono text-slate-400 text-[11px]">
                                  ${((product.price || 0) * item.quantity).toLocaleString('es-CO')}
                                </span>
                              </div>

                              {item.extras && item.extras.length > 0 && (
                                <div className="text-[10px] text-slate-400 pl-3 border-l-2 border-[#8B1E1E]">
                                  {item.extras.map((ext, eIdx) => (
                                    <p key={eIdx}>+ {ext.name}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {(order.address || order.phone || order.notes) && (
                        <div className="bg-[#141414] p-2.5 rounded-xl text-[11px] space-y-1 text-slate-300 border border-white/5 mb-3">
                          {order.address && (
                            <div className="flex items-center gap-1.5 text-blue-300">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                              <span className="truncate">{order.address}</span>
                            </div>
                          )}
                          {order.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-[#F4C430]" />
                              <span>{order.phone}</span>
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-amber-300/90 italic pt-1 border-t border-white/5">
                              "{order.notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total a Cobrar:</span>
                        <span className="font-mono text-xl font-black text-[#F4C430]">
                          ${order.totalAmount?.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setPayModalOrder(order);
                          setPayMethodSelect('cash');
                          setCashReceived('');
                        }}
                        className="px-4 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1.5 border border-[#F4C430]/40 active:scale-95"
                      >
                        <CreditCard className="w-4 h-4 text-[#F4C430]" />
                        <span>Cobrar Cuenta</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: ARQUEO Y CIERRE DIARIO DE CAJA */}
      {/* ========================================================================= */}
      {activePosTab === 'shift_audit' && (
        <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col gap-6">
          
          {/* APERTURA DE CAJA (SI NO HAY TURNO ABIERTO) */}
          {!activeShift ? (
            <div className="bg-[#1A1A1A] border-2 border-[#F4C430]/60 rounded-3xl p-8 shadow-2xl space-y-6 max-w-xl mx-auto text-center animate-fadeIn my-auto">
              
              <div className="w-16 h-16 rounded-full bg-[#8B1E1E] border-2 border-[#F4C430] flex items-center justify-center mx-auto text-[#F4C430] shadow-xl">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase text-white tracking-wide">
                  Apertura de Turno de Caja
                </h2>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Para comenzar a cobrar pedidos y procesar ventas en el POS, especifique la base inicial o fondo de dinero guardado en la caja física.
                </p>
              </div>

              {openShiftError && (
                <div className="bg-red-950/80 border border-red-600 text-red-200 text-xs p-3 rounded-xl font-bold flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{openShiftError}</span>
                </div>
              )}

              <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
                <div className="text-left">
                  <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block mb-1">
                    Fondo Inicial de Caja (Base para Cambio / Vueltas $):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="50000"
                      value={openShiftCashInput}
                      onChange={e => setOpenShiftCashInput(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 text-lg text-white font-mono font-bold p-3 pl-10 rounded-xl focus:border-[#F4C430] outline-none"
                    />
                    <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={openShiftLoading}
                  className="w-full py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 border border-[#F4C430]/40"
                >
                  {openShiftLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#F4C430]" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-[#F4C430]" />
                      <span>Abrir Turno & Habilitar Caja POS</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          ) : (
            /* PASOS DE ARQUEO Y CIERRE SI EL TURNO ESTÁ ABIERTO */
            <div className="space-y-6">
              
              {/* PASO 1: RESUMEN DE VENTAS DEL TURNO (SISTEMA) */}
              <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-600">
                      🟢 Turno de Caja Abierto en Vivo
                    </span>
                    <h2 className="text-xl font-black uppercase text-white tracking-tight mt-2">
                      Paso 1: Resumen de Ventas Registradas (Sistema)
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">
                      Responsable: <strong className="text-white">{activeShift.userName}</strong> • Abierto desde: <span className="font-mono text-white">{new Date(activeShift.openedAt).toLocaleString('es-CO')}</span>
                    </p>
                  </div>

                  <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#252525] border border-white/10 text-[#F4C430] rounded-xl text-xs font-bold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Recargar Totales
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Fondo Inicial (Base):</span>
                    <span className="font-mono text-lg font-black text-white">${activeShift.initialCash?.toLocaleString('es-CO')}</span>
                  </div>

                  <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Ventas Efectivo:</span>
                    <span className="font-mono text-lg font-black text-emerald-400">${(activeShift.systemTotals?.cash || 0).toLocaleString('es-CO')}</span>
                  </div>

                  <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Ventas Tarjeta:</span>
                    <span className="font-mono text-lg font-black text-purple-400">${(activeShift.systemTotals?.card || 0).toLocaleString('es-CO')}</span>
                  </div>

                  <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Ventas Transferencia:</span>
                    <span className="font-mono text-lg font-black text-blue-400">${(activeShift.systemTotals?.transfer || 0).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="bg-[#141414] border-2 border-[#F4C430]/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-white uppercase">Dinero Total Esperado por el Sistema:</span>
                    <p className="text-[11px] text-slate-400">Base Inicial + Ventas Efectivo + Tarjeta + Transferencia ({activeShift.systemTotals?.orderCount || 0} órdenes cobradas)</p>
                  </div>
                  <span className="font-mono text-3xl font-black text-[#F4C430] drop-shadow-md">
                    ${(activeShift.systemTotals?.totalExpected || 0).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* PASO 2 Y PASO 3: FORMULARIO DE CONTEO FÍSICO Y AUDITORÍA DE DESCUADRE */}
              <form onSubmit={handleCloseShift} className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-black uppercase text-white tracking-tight">
                    Paso 2: Formulario de Conteo / Arqueo Físico de Caja
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Ingrese el dinero real contado en billetes/monedas y el saldo validado de comprobantes.
                  </p>
                </div>

                {closingError && (
                  <div className="bg-red-950/80 border border-red-600 text-red-200 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{closingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block mb-1">
                      1. Efectivo Contado (Billetes/Monedas $):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ej: 150000"
                        value={declaredCash}
                        onChange={e => setDeclaredCash(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 text-sm text-white font-mono font-bold p-3 pl-9 rounded-xl focus:border-[#F4C430] outline-none"
                      />
                      <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block mb-1">
                      2. Vouchers de Tarjeta / Datáfono ($):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ej: 45000"
                        value={declaredCard}
                        onChange={e => setDeclaredCard(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 text-sm text-white font-mono font-bold p-3 pl-9 rounded-xl focus:border-[#F4C430] outline-none"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block mb-1">
                      3. Transferencias Bancarias ($):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ej: 20000"
                        value={declaredTransfer}
                        onChange={e => setDeclaredTransfer(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 text-sm text-white font-mono font-bold p-3 pl-9 rounded-xl focus:border-[#F4C430] outline-none"
                      />
                      <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* PASO 3: CÁLCULO DE DESCUADRE EN TIEMPO REAL */}
                <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  currentDifference === 0
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                    : currentDifference > 0
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100'
                    : 'bg-red-950/60 border-red-600 text-red-100 animate-pulse'
                }`}>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      Paso 3: Resultado del Arqueo Auditado
                    </span>
                    <p className="text-xs opacity-90 mt-0.5">
                      {currentDifference === 0 
                        ? '✨ La caja está perfectamente cuadrada (Diferencia $0).'
                        : currentDifference > 0 
                        ? `✨ Sobrante detectado en el arqueo (+ $${currentDifference.toLocaleString('es-CO')}).`
                        : `🚨 FALTANTE DETECTADO EN CAJA (- $${Math.abs(currentDifference).toLocaleString('es-CO')}). Debe ingresar justificación.`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase opacity-75 block">Diferencia:</span>
                    <span className={`font-mono text-2xl font-black ${
                      currentDifference >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {currentDifference > 0 ? '+' : ''}${currentDifference.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* CAMPO DE NOTAS / JUSTIFICACIÓN */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block">
                    Notas y Justificación de Novedades / Descuadres {currentDifference < 0 && <span className="text-red-400">* (Obligatorio)</span>}:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escriba aquí observaciones del turno o causa del descuadre..."
                    value={shiftNotes}
                    onChange={e => setShiftNotes(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-xl focus:border-[#F4C430] outline-none font-bold"
                  />
                </div>

                {/* PASO 4: BOTÓN CONFIRMAR Y CERRAR CAJA */}
                <button
                  type="submit"
                  disabled={closingLoading}
                  className="w-full py-4 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xl flex items-center justify-center gap-2 border border-[#F4C430]/40 active:scale-98"
                >
                  {closingLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#F4C430]" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-[#F4C430]" />
                      <span>Confirmar, Cerrar Caja & Generar Comprobante Auditado</span>
                    </>
                  )}
                </button>

              </form>

            </div>
          )}

        </main>
      )}

      {/* MODAL DE ADICIONALES */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-[#F4C430] uppercase mb-1">Personalizar {selectedProduct.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Seleccione los adicionales que consumirán stock:</p>
            <div className="space-y-2 mb-6">
              {availableExtras.map(extra => {
                const isChecked = selectedExtras.some(e => e.supplyId === extra.supplyId);
                const isOutOfStock = extra.availableStock <= 0;
                return (
                  <div
                    key={extra.supplyId}
                    onClick={() => !isOutOfStock && toggleExtra(extra)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked ? 'bg-[#8B1E1E]/30 border-[#F4C430] text-white' : 'bg-[#141414] border-white/10 text-slate-300'
                    } ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <span className="text-xs font-bold">{extra.name}</span>
                    <span className="font-mono text-xs text-[#F4C430] font-bold">+${extra.price.toLocaleString('es-CO')}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleConfirmModifiers} className="w-full py-3 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg">
              Agregar al Ticket
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO DE CUENTA PENDIENTE */}
      {payModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1A1A1A] border-2 border-[#F4C430]/60 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-fadeIn">
            <button onClick={() => setPayModalOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/5">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-[#8B1E1E] border border-[#F4C430] flex items-center justify-center text-[#F4C430]">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Cobro de Cuenta <span className="text-[#F4C430]">#{payModalOrder._id.slice(-6).toUpperCase()}</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold">Cliente: {payModalOrder.clientName}</p>
              </div>
            </div>

            <div className="bg-[#141414] p-3.5 rounded-xl border border-white/10 space-y-2 max-h-44 overflow-y-auto">
              {payModalOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold">
                  <span className="text-white">
                    <strong className="text-[#F4C430]">{item.quantity}x</strong> {item.productId?.name || 'Producto'}
                  </span>
                  <span className="font-mono text-[#F4C430]">
                    ${((item.productId?.price || 0) * item.quantity).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#F4C430] uppercase tracking-wider block">Seleccione Medio de Pago:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethodSelect('cash')}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    payMethodSelect === 'cash' ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]' : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethodSelect('card')}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    payMethodSelect === 'card' ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]' : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethodSelect('transfer')}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    payMethodSelect === 'transfer' ? 'bg-[#8B1E1E] border-[#F4C430] text-[#F4C430]' : 'bg-[#141414] border-white/10 text-slate-400'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> Transfer.
                </button>
              </div>
            </div>

            {payMethodSelect === 'cash' && (
              <div className="bg-[#141414] p-3.5 rounded-xl border border-white/10 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Paga con (Efectivo $):</label>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-white/10 text-sm text-white p-2.5 rounded-xl focus:border-[#F4C430] outline-none font-mono font-bold"
                />
                {Number(cashReceived) >= payModalOrder.totalAmount && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-bold">
                    <span className="text-emerald-400 uppercase">Cambio / Vueltas:</span>
                    <span className="font-mono text-base font-black text-emerald-400">
                      ${(Number(cashReceived) - payModalOrder.totalAmount).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto Total:</span>
                <span className="font-mono text-2xl font-black text-[#F4C430]">${payModalOrder.totalAmount?.toLocaleString('es-CO')}</span>
              </div>
              <button
                onClick={handleConfirmPayPendingOrder}
                disabled={payingLoading}
                className="px-6 py-3 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2 border border-[#F4C430]/40"
              >
                {payingLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F4C430]" /> : <> <CheckCircle2 className="w-4 h-4 text-[#F4C430]" /> <span>Confirmar Pago</span> </>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA IMPRIMIBLE DE TICKET DE CIERRE DIARIO Y ARQUEO */}
      {printedClosureReport && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white text-black p-6 rounded-2xl shadow-2xl font-mono text-xs space-y-4 max-h-[90vh] overflow-y-auto border-4 border-[#F4C430]">
            
            {/* Header del Ticket Térmico */}
            <div className="text-center border-b-2 border-dashed border-black pb-3">
              <h2 className="text-lg font-black uppercase">JJ PIZZA</h2>
              <p className="text-[10px] font-bold">COMPROBANTE DE CIERRE DE CAJA</p>
              <p className="text-[9px]">El auténtico sabor artesanal</p>
            </div>

            <div className="space-y-1 text-[10px]">
              <p><strong>Cajero:</strong> {printedClosureReport.userName}</p>
              <p><strong>Apertura:</strong> {new Date(printedClosureReport.openedAt).toLocaleString('es-CO')}</p>
              <p><strong>Cierre:</strong> {new Date(printedClosureReport.closedAt).toLocaleString('es-CO')}</p>
            </div>

            {/* Desglose Sistema */}
            <div className="border-t border-b border-dashed border-black py-2 space-y-1 text-[10px]">
              <p className="font-bold text-center uppercase">--- SISTEMA (ESPERADO) ---</p>
              <div className="flex justify-between"><span>Base Inicial:</span><span>${printedClosureReport.initialCash?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span>Ventas Efectivo:</span><span>${printedClosureReport.systemTotals?.cash?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span>Ventas Tarjeta:</span><span>${printedClosureReport.systemTotals?.card?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span>Ventas Transfer.:</span><span>${printedClosureReport.systemTotals?.transfer?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-black"><span>Total Esperado:</span><span>${printedClosureReport.systemTotals?.totalExpected?.toLocaleString('es-CO')}</span></div>
            </div>

            {/* Desglose Declarado */}
            <div className="border-b border-dashed border-black pb-2 space-y-1 text-[10px]">
              <p className="font-bold text-center uppercase">--- DECLARADO (CONTEO) ---</p>
              <div className="flex justify-between"><span>Efectivo Contado:</span><span>${printedClosureReport.declaredTotals?.cash?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span>Vouchers Tarjeta:</span><span>${printedClosureReport.declaredTotals?.card?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span>Transferencias:</span><span>${printedClosureReport.declaredTotals?.transfer?.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-black"><span>Total Declarado:</span><span>${printedClosureReport.declaredTotals?.totalDeclared?.toLocaleString('es-CO')}</span></div>
            </div>

            {/* Auditoría de Descuadre */}
            <div className="text-center font-bold text-sm py-1 border-b-2 border-black">
              <span>DIFERENCIA: </span>
              <span className={printedClosureReport.difference < 0 ? 'text-red-600' : 'text-emerald-700'}>
                {printedClosureReport.difference > 0 ? '+' : ''}${printedClosureReport.difference?.toLocaleString('es-CO')}
              </span>
            </div>

            {printedClosureReport.notes && (
              <div className="text-[9px] italic border-b border-dashed border-black pb-2">
                <strong>Notas / Justificación:</strong> "{printedClosureReport.notes}"
              </div>
            )}

            {/* Firmas */}
            <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[8px] font-bold">
              <div className="border-t border-black pt-1">
                Firma Cajero
              </div>
              <div className="border-t border-black pt-1">
                Firma Administrador
              </div>
            </div>

            {/* Botones de Impresión / Cerrar */}
            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#8B1E1E] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comprobante
              </button>
              <button
                onClick={() => setPrintedClosureReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-black font-bold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
