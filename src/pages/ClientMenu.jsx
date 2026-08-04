import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  ChefHat, 
  ChevronRight,
  AlertTriangle,
  Search,
  Phone,
  Smartphone,
  Info,
  ArrowLeft,
  Grid,
  Sparkles,
  Lock
} from 'lucide-react';
import inventoryService from '../services/inventoryService';
import orderService from '../services/orderService';
import { socket } from '../services/socket';

// Número de WhatsApp de la pizzería
const WHATSAPP_NUMBER = '573128112675';

// Definición de Categorías con imágenes representativas y descripciones de grupo
const CATEGORIES_CONFIG = [
  { key: 'pizzas', name: 'Pizzas', icon: '🍕', subtitle: 'Clásicas, Hawaianas, Especiales', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop' },
  { key: 'lasagnas', name: 'Lasagnas', icon: '🧀', subtitle: 'Junior & Personal con Queso Derretido', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=400&fit=crop' },
  { key: 'hamburguesas', name: 'Hamburguesas', icon: '🍔', subtitle: 'Carne Artesanal & Doble Queso', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop' },
  { key: 'perros', name: 'Perros', icon: '🌭', subtitle: 'Perros Especiales con Ripio & Queso', image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&h=400&fit=crop' },
  { key: 'salchifrancesas', name: 'Salchifrancesas', icon: '🍟', subtitle: 'Salchicha, Papa a la Francesa & Salsas', image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&h=400&fit=crop' },
  { key: 'maicitos', name: 'Maicitos', icon: '🌽', subtitle: 'Maíz, Pollo, Tocineta, Queso & Ripio', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&h=400&fit=crop' },
  { key: 'colitas', name: 'Colitas Cubanas', icon: '🥖', subtitle: 'Especialidades Horneadas de la Casa', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&h=400&fit=crop' },
  { key: 'bebidas', name: 'Bebidas', icon: '🥤', subtitle: 'Gaseosas, Jugos & Refrescos Fríos', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { key: 'adicionales', name: 'Adicionales', icon: '🧀', subtitle: 'Queso Extra, Tocineta & Aderezos', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop' }
];

// Mapeo de imágenes fotorrealistas de alta calidad para coincidir con la imagen de referencia
const getProductImage = (category, productName) => {
  const cat = category?.toLowerCase() || '';
  const name = productName?.toLowerCase() || '';
  
  if (name.includes('hawaiana') || name.includes('hamaiana')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop';
  }
  if (name.includes('mexicana')) {
    return 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=400&fit=crop';
  }
  if (name.includes('vegetariana')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop';
  }
  if (cat.includes('pizza') || name.includes('pizza') || name.includes('clasica')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop';
  }
  if (cat.includes('lasagna') || name.includes('lasagna') || name.includes('junior') || name.includes('personal')) {
    return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=400&fit=crop';
  }
  if (cat.includes('hamburguesa') || name.includes('hamburguesa') || cat.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop';
  }
  if (cat.includes('perro') || name.includes('perro') || name.includes('hot dog')) {
    return 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&h=400&fit=crop';
  }
  if (cat.includes('salchi') || name.includes('salchi')) {
    return 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&h=400&fit=crop';
  }
  if (cat.includes('maicito') || name.includes('maicito')) {
    return 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&h=400&fit=crop';
  }
  if (name.includes('hit')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=400&fit=crop';
  }
  if (cat.includes('bebida') || name.includes('coca') || name.includes('gaseosa') || name.includes('softdrink')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';
};

export default function ClientMenu({ onNavigateToPOS, onNavigateToDashboard, onOpenAuthModal }) {
  // Estado de carga y datos
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navegación por Categorías (null = Vista Inicial Grid de Categorías)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);

  // Buscador de texto
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del Carrito
  const [cart, setCart] = useState([]);
  const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Estado de Checkout Drawer (Bottom Sheet)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [orderType, setOrderType] = useState('dine_in'); // dine_in, delivery o pickup
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Estado de Envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  // Cargar productos y suministros
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getSupplies()
      ]);
      
      const activeProducts = (prodRes.data || []).filter(p => p.isActive);
      setProducts(activeProducts);
      setSupplies(supRes.data || []);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('No se pudo cargar el menú digital.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    socket.on('inventory:updated', loadData);
    return () => {
      socket.off('inventory:updated', loadData);
    };
  }, []);

  // Bloqueo de Scroll en Body mientras cualquier Modal o Carrito Lateral esté abierto
  useEffect(() => {
    if (isModifiersModalOpen || isCartDrawerOpen || submitSuccess) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    };
  }, [isModifiersModalOpen, isCartDrawerOpen, submitSuccess]);

  // Restablecer scroll al principio al cambiar de categoría
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategoryKey]);

  // Adicionales (Extras) disponibles de suministros activos
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

  const handleProductClick = (product) => {
    if (product.stock <= 0) return;
    
    setSelectedProduct(product);
    setSelectedExtras([]);
    
    if (product.type === 'simple' && (!product.recipe || product.recipe.length === 0)) {
      addToCartDirect(product, []);
    } else {
      setIsModifiersModalOpen(true);
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
    setIsModifiersModalOpen(false);
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
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => {
      const extrasPrice = item.extras.reduce((sum, ext) => sum + ext.price, 0);
      return acc + (item.product.price + extrasPrice) * item.quantity;
    }, 0);
    return { totalItems, totalPrice };
  };

  // Mapeo de producto a clave de categoría
  const matchProductCategoryKey = (product) => {
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    if (cat.includes('lasagna') || name.includes('lasagna')) return 'lasagnas';
    if (cat.includes('hamburguesa') || name.includes('hamburguesa') || cat.includes('burger')) return 'hamburguesas';
    if (cat.includes('perro') || name.includes('perro') || name.includes('hot dog')) return 'perros';
    if (cat.includes('salchi') || name.includes('salchi')) return 'salchifrancesas';
    if (cat.includes('maicito') || name.includes('maicito')) return 'maicitos';
    if (cat.includes('colita') || name.includes('colita') || name.includes('cubana')) return 'colitas';
    if (cat.includes('bebida') || cat.includes('gaseosa') || name.includes('coca') || name.includes('hit') || name.includes('jugo')) return 'bebidas';
    if (cat.includes('adicional') || name.includes('extra')) return 'adicionales';
    return 'pizzas';
  };

  // Contar productos disponibles por categoría
  const getCategoryCount = (key) => {
    return products.filter(p => matchProductCategoryKey(p) === key).length;
  };

  // Filtrar productos para la vista de lista
  const getFilteredProducts = () => {
    const search = searchTerm.toLowerCase();

    return products.filter(product => {
      const matchesSearch = !search || 
        product.name.toLowerCase().includes(search) || 
        product.description?.toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (searchTerm) return true; // Si hay búsqueda libre, muestra coincidencias de todas las categorías

      if (!selectedCategoryKey || selectedCategoryKey === 'all') return true;

      return matchProductCategoryKey(product) === selectedCategoryKey;
    });
  };

  // Generar texto para WhatsApp
  const getWhatsAppMessageText = (createdOrder) => {
    const orderIdCode = createdOrder._id.substring(createdOrder._id.length - 6).toUpperCase();
    let msg = `*🍕 ¡NUEVO PEDIDO REGISTRADO EN JJ PIZZA! 🍕*\n`;
    msg += `===============================\n`;
    msg += `*Pedido #:* \`${orderIdCode}\`\n`;
    msg += `*Cliente:* ${clientName.trim()}\n`;
    msg += `*Modalidad:* ${orderType === 'dine_in' ? '🪑 Para la Mesa' : orderType === 'delivery' ? '🛵 Domicilio' : '🛍️ Para Llevar'}\n`;
    
    if (orderType === 'dine_in') {
      msg += `*Mesa:* ${tableNumber.trim()}\n`;
    } else if (orderType === 'delivery') {
      msg += `*Dirección:* ${address.trim()}\n`;
      msg += `*Teléfono:* ${phone.trim()}\n`;
    } else {
      msg += `*Teléfono:* ${phone.trim()}\n`;
    }

    if (notes.trim()) {
      msg += `*Notas:* ${notes.trim()}\n`;
    }
    
    msg += `===============================\n`;
    msg += `*Detalle de Productos:*\n`;
    
    cart.forEach(item => {
      msg += `• *${item.quantity}x* ${item.product.name}`;
      if (item.extras.length > 0) {
        const extrasStr = item.extras.map(e => e.name).join(', ');
        msg += ` _(+ ${extrasStr})_`;
      }
      msg += `\n`;
    });
    
    const { totalPrice } = getCartTotals();
    msg += `===============================\n`;
    msg += `*Total a Pagar:* $${totalPrice.toLocaleString('es-CO')}\n\n`;
    msg += `_¡Por favor confirmen la recepción de mi pedido!_`;
    
    return encodeURIComponent(msg);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (cart.length === 0) {
      setSubmitError('El carrito está vacío');
      return;
    }
    if (!clientName.trim()) {
      setSubmitError('Por favor ingrese su nombre');
      return;
    }
    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setSubmitError('Por favor ingrese el número de mesa');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setSubmitError('Por favor ingrese la dirección de entrega');
      return;
    }
    if (['delivery', 'pickup'].includes(orderType) && !phone.trim()) {
      setSubmitError('Por favor ingrese su número de teléfono');
      return;
    }

    try {
      setIsSubmitting(true);
      const { totalPrice } = getCartTotals();
      
      const orderPayload = {
        clientName: clientName.trim(),
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber.trim() : undefined,
        address: orderType === 'delivery' ? address.trim() : undefined,
        phone: ['delivery', 'pickup'].includes(orderType) ? phone.trim() : undefined,
        notes: notes.trim(),
        paymentMethod: paymentMethod || 'cash',
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          extras: item.extras.map(e => ({
            supplyId: e.supplyId,
            quantity: e.quantity,
            price: e.price,
            name: e.name
          }))
        })),
        totalAmount: totalPrice
      };

      const res = await orderService.createOrder(orderPayload);
      
      if (res.success) {
        const created = res.data;
        const whatsappText = getWhatsAppMessageText(created);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;
        window.open(whatsappUrl, '_blank');

        setLastCreatedOrder(created);
        setSubmitSuccess(true);
        setCart([]);
        setClientName('');
        setTableNumber('');
        setAddress('');
        setPhone('');
        setNotes('');
        setIsCartDrawerOpen(false);
      }
    } catch (err) {
      console.error('Error al enviar el pedido:', err);
      const serverMsg = err.response?.data?.message || 'Error al procesar el pedido. Verifique el stock disponible.';
      setSubmitError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableExtras = getAvailableExtras();
  const { totalItems, totalPrice } = getCartTotals();
  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-[#141414] text-slate-100 font-sans selection:bg-[#F4C430] selection:text-black relative">
      
      {/* Fondo Texturizado Estilo Piedra */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(244, 196, 48, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(139, 30, 30, 0.12) 0%, transparent 50%),
            repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 4px)`,
          backgroundBlendMode: 'overlay'
        }}
      />

      {/* Header Superior con Logo Circular */}
      <header className="relative z-10 pt-8 pb-6 px-4 text-center border-b border-white/5 bg-[#141414]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="w-20 h-20 rounded-full bg-[#8B1E1E] border-[4px] border-[#F4C430] flex items-center justify-center shadow-2xl shadow-[#8B1E1E]/40 mb-3 group hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-[#F4C430]/90" />
            <div className="absolute top-9 left-2 w-2.5 h-2.5 rounded-full bg-[#F4C430]/90" />
            <div className="absolute bottom-3 left-5 w-2 h-2 rounded-full bg-[#F4C430]/90" />
            <div className="absolute top-4 right-3 w-2.5 h-2.5 rounded-full bg-[#F4C430]/90" />
            
            <div className="relative z-10 flex flex-col items-center">
              <ChefHat className="w-9 h-9 text-[#F4C430] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
            JJ PIZZA
          </h1>
          <p className="text-xs text-[#F4C430] font-bold uppercase tracking-widest mt-1">El auténtico sabor artesanal</p>

          {/* Buscador de menú rápido */}
          <div className="mt-6 w-full max-w-md relative">
            <input
              type="text"
              placeholder="Buscar en todo el menú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1F1F1F] border border-white/10 text-white placeholder-white/40 text-sm rounded-full py-3 pl-10 pr-10 focus:outline-none focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] transition-all shadow-inner font-bold min-h-[44px] touch-manipulation"
            />
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Mensaje de Error de Red */}
      {error && (
        <div className="max-w-md mx-auto mt-4 px-4">
          <div className="bg-red-950/40 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUERPO PRINCIPAL DEL MENÚ */}
      {/* ========================================================================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-16">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 border-4 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/60 text-sm font-semibold">Cargando menú interactivo...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* VISTA 1: GRID DE TARJETAS DE CATEGORÍAS (PANTALLA INICIAL DE NAVEGACIÓN) */}
            {/* ========================================================================= */}
            {selectedCategoryKey === null && !searchTerm ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#F4C430] uppercase tracking-wide flex items-center gap-2">
                      <Grid className="w-6 h-6" />
                      Nuestras Categorías
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Selecciona una especialidad para explorar sus opciones
                    </p>
                  </div>
                </div>

                {/* Grid de Tarjetas de Categorías Grandes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CATEGORIES_CONFIG.map(cat => {
                    const count = getCategoryCount(cat.key);

                    return (
                      <div
                        key={cat.key}
                        onClick={() => setSelectedCategoryKey(cat.key)}
                        className="group rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/10 shadow-xl hover:-translate-y-1 active:scale-[0.98] hover:border-[#F4C430]/60 hover:shadow-2xl hover:shadow-[#F4C430]/10 transition-all duration-200 cursor-pointer flex flex-col justify-between touch-manipulation"
                      >
                        <div className="relative h-44 overflow-hidden bg-black">
                          <img 
                            src={cat.image} 
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 text-2xl drop-shadow-md">{cat.icon}</span>
                          <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm border border-[#F4C430] text-[#F4C430] text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                            {count > 0 ? `${count} Opciones` : 'Disponible'}
                          </span>
                        </div>

                        <div className="p-5 bg-[#1E1E1E] flex items-center justify-between border-t border-white/5">
                          <div>
                            <h3 className="font-black text-white text-xl uppercase tracking-tight group-hover:text-[#F4C430] transition-colors">
                              {cat.name}
                            </h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium line-clamp-1">
                              {cat.subtitle}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#8B1E1E] flex items-center justify-center text-[#F4C430] group-hover:scale-110 transition-transform">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (

              /* ========================================================================= */
              /* VISTA 2: DESGLOSE DE PRODUCTOS FILTRADOS (SIN BARRA DE TABS DE CATEGORÍAS) */
              /* ========================================================================= */
              <div className="space-y-6 animate-fadeIn">
                
                {/* Encabezado Limpio de la Categoría Seleccionada con Botón Volver */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedCategoryKey(null); setSearchTerm(''); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white border border-[#F4C430]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shrink-0 min-h-[44px] touch-manipulation"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#F4C430]" />
                      <span>Volver a Categorías</span>
                    </button>

                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-[#F4C430] uppercase tracking-wide flex items-center gap-2">
                        {selectedCategoryKey === 'all' 
                          ? '✨ Todo el Menú' 
                          : `${CATEGORIES_CONFIG.find(c => c.key === selectedCategoryKey)?.icon || ''} ${CATEGORIES_CONFIG.find(c => c.key === selectedCategoryKey)?.name || 'Productos'}`}
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Explora la selección disponible en esta categoría
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto bg-[#1E1E1E] border border-white/10 text-[#F4C430] text-xs font-bold font-mono px-3 py-1.5 rounded-full">
                    {filteredProducts.length} productos
                  </span>
                </div>

                {/* Lista de Productos Filtrados en Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 bg-[#1E1E1E] border border-white/5 rounded-3xl">
                    <p className="font-bold text-sm">No hay productos disponibles en esta sección.</p>
                    <button 
                      onClick={() => { setSelectedCategoryKey(null); setSearchTerm(''); }}
                      className="mt-3 text-xs text-[#F4C430] underline font-bold"
                    >
                      Regresar a las Categorías
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                      const isPizza = matchProductCategoryKey(product) === 'pizzas';
                      const isDrink = matchProductCategoryKey(product) === 'bebidas';
                      const isOverlayItem = ['perros', 'salchifrancesas'].includes(matchProductCategoryKey(product));

                      if (isDrink) {
                        return (
                          <DrinkCard 
                            key={product._id} 
                            product={product} 
                            onClick={() => handleProductClick(product)} 
                          />
                        );
                      }

                      if (isOverlayItem) {
                        return (
                          <CrimsonCardWithOverlay 
                            key={product._id} 
                            product={product} 
                            onClick={() => handleProductClick(product)} 
                          />
                        );
                      }

                      if (isPizza) {
                        return (
                          <PizzaCard 
                            key={product._id} 
                            product={product} 
                            onClick={() => handleProductClick(product)} 
                          />
                        );
                      }

                      return (
                        <CrimsonCard 
                          key={product._id} 
                          product={product} 
                          onClick={() => handleProductClick(product)} 
                        />
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTÓN FLOTANTE (FAB) "My Order" CON INSIGNIA DE CARRITO */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40">
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="group flex items-center bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white pl-5 pr-2 py-2 rounded-full shadow-2xl shadow-black/90 transition-all duration-200 border border-[#F4C430]/40 min-h-[48px] touch-manipulation cursor-pointer"
        >
          <span className="font-extrabold text-sm uppercase tracking-wider mr-3">My Order</span>
          <div className="relative w-10 h-10 rounded-full bg-[#F4C430] flex items-center justify-center shadow-inner text-[#8B1E1E] group-active:scale-95">
            <ShoppingBag className="w-5 h-5 font-bold" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-[#F4C430] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-[#F4C430] shadow-md animate-pulse">
                {totalItems}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PIE DE PÁGINA (FOOTER RESTRUCTURADO Y ELEGANTE) */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-[#F4C430]/20 mt-16 bg-[#0D0D0D] text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          {/* Col 1: Marca & Slogan */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8B1E1E] border-2 border-[#F4C430] flex items-center justify-center shadow-lg">
                <ChefHat className="w-5 h-5 text-[#F4C430]" />
              </div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight">
                JJ <span className="text-[#F4C430]">PIZZA</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              El auténtico sabor artesanal
            </p>
          </div>

          {/* Col 2: Horarios & Atención */}
          <div className="space-y-1 text-xs font-medium text-slate-400">
            <p className="text-[#F4C430] font-black uppercase tracking-wider">Horario de Atención</p>
            <p className="text-white font-bold">Lunes a Domingo: 4:00 PM – 11:30 PM</p>
            <p className="text-slate-400">Servicio a Domicilio, Para Llevar y Mesa</p>
          </div>

          {/* Col 3: Contactos Directos & Redes */}
          <div className="flex flex-col items-center md:items-end gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-2 bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-white/10">
              <Phone className="w-3.5 h-3.5 text-[#F4C430]" />
              <span>TEL: 3729092</span>
            </div>
            
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#1A1A1A] hover:border-[#F4C430] active:scale-95 px-3 py-1.5 rounded-full border border-white/10 transition-all text-white min-h-[44px]"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>CEL / WA: 312 811 2675</span>
            </a>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <svg className="w-3.5 h-3.5 text-[#F4C430] fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>JJ_PIZZA</span>
            </div>
          </div>

        </div>

        {/* Barra Inferior Copyright (Ancho Completo y Centrado) */}
        <div className="border-t border-white/5 bg-[#080808] py-4 w-full text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
          © 2026 JJ PIZZA • Todos los derechos reservados
        </div>
      </footer>

      {/* MODAL DE ADICIONALES */}
      {isModifiersModalOpen && selectedProduct && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModifiersModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 touch-manipulation cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-slideUp cursor-default max-h-[90vh] flex flex-col"
          >
            {/* Indicador de cierre deslizable para móviles */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden shrink-0" />

            <button
              onClick={() => setIsModifiersModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 rounded-full active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-[#F4C430] uppercase mb-1">
              Personalizar {selectedProduct.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Seleccione adicionales opcionales para su pedido.</p>

            {availableExtras.length === 0 ? (
              <p className="text-xs text-slate-500 italic mb-4">No hay adicionales configurados actualmente.</p>
            ) : (
              <div className="space-y-2.5 mb-6 overflow-y-auto pr-1 flex-1">
                {availableExtras.map(extra => {
                  const isChecked = selectedExtras.some(e => e.supplyId === extra.supplyId);
                  const isOutOfStock = extra.availableStock <= 0;

                  return (
                    <div
                      key={extra.supplyId}
                      onClick={() => !isOutOfStock && toggleExtra(extra)}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] min-h-[48px] touch-manipulation ${
                        isChecked 
                          ? 'bg-[#8B1E1E]/20 border-[#8B1E1E] text-white' 
                          : 'bg-[#141414] border-white/10 text-slate-300 hover:border-white/20'
                      } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-white/30'
                        }`}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{extra.name}</p>
                          {isOutOfStock && <span className="text-[10px] text-red-400">Agotado</span>}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#F4C430]">
                        +${extra.price.toLocaleString('es-CO')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleConfirmModifiers}
              className="w-full py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white font-black text-sm uppercase rounded-xl transition-all shadow-lg shadow-[#8B1E1E]/30 min-h-[48px] shrink-0 touch-manipulation"
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      )}

      {/* CARRITO DRAWER */}
      {isCartDrawerOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsCartDrawerOpen(false); }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end touch-manipulation cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1A1A1A] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slideLeft cursor-default"
          >
            {/* Indicador de cierre deslizable en móviles */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 md:hidden" />

            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#F4C430]" />
                <h2 className="text-lg font-black text-white uppercase tracking-wide">Resumen de tu Orden</h2>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#F4C430]" />
                  <p className="font-bold text-sm">Tu orden está vacía</p>
                  <p className="text-xs mt-1">Selecciona productos del menú para comenzar.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="bg-[#141414] border border-white/10 p-3.5 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
                            <p className="text-xs font-mono text-[#F4C430] font-bold">
                              ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-[#1F1F1F] border border-white/10 rounded-lg p-1">
                            <button
                              onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                              className="p-1 text-white/60 hover:text-white active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-bold text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                              className="p-1 text-white/60 hover:text-white active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.extras.length > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                            {item.extras.map((ext, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>+ {ext.name}</span>
                                <span className="font-mono text-white/70">+${ext.price.toLocaleString('es-CO')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitOrder} className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-xs font-black uppercase text-[#F4C430] tracking-wider">Datos de Entrega</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('dine_in')}
                        className={`py-3 text-[11px] font-extrabold uppercase rounded-lg border transition-all active:scale-95 min-h-[44px] ${
                          orderType === 'dine_in' 
                            ? 'bg-[#8B1E1E] border-[#8B1E1E] text-white' 
                            : 'bg-[#141414] border-white/10 text-slate-400'
                        }`}
                      >
                        En Mesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`py-3 text-[11px] font-extrabold uppercase rounded-lg border transition-all active:scale-95 min-h-[44px] ${
                          orderType === 'delivery' 
                            ? 'bg-[#8B1E1E] border-[#8B1E1E] text-white' 
                            : 'bg-[#141414] border-white/10 text-slate-400'
                        }`}
                      >
                        Domicilio
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`py-3 text-[11px] font-extrabold uppercase rounded-lg border transition-all active:scale-95 min-h-[44px] ${
                          orderType === 'pickup' 
                            ? 'bg-[#8B1E1E] border-[#8B1E1E] text-white' 
                            : 'bg-[#141414] border-white/10 text-slate-400'
                        }`}
                      >
                        Llevar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Tu Nombre completo *"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-lg focus:border-[#F4C430] outline-none min-h-[44px]"
                      />

                      {orderType === 'dine_in' && (
                        <input
                          type="text"
                          placeholder="Número de Mesa *"
                          value={tableNumber}
                          onChange={e => setTableNumber(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-lg focus:border-[#F4C430] outline-none min-h-[44px]"
                        />
                      )}

                      {orderType === 'delivery' && (
                        <input
                          type="text"
                          placeholder="Dirección de entrega *"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-lg focus:border-[#F4C430] outline-none min-h-[44px]"
                        />
                      )}

                      {['delivery', 'pickup'].includes(orderType) && (
                        <input
                          type="text"
                          placeholder="Número de Celular *"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-lg focus:border-[#F4C430] outline-none min-h-[44px]"
                        />
                      )}

                      <textarea
                        placeholder="Notas especiales (opcional)"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-[#141414] border border-white/10 text-xs text-white p-3 rounded-lg focus:border-[#F4C430] outline-none resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="bg-red-950/60 border border-red-800 text-red-200 text-xs p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#141414] space-y-4">
                <div className="flex justify-between items-center text-sm font-black uppercase text-white">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-xl text-[#F4C430]">
                    ${totalPrice.toLocaleString('es-CO')}
                  </span>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#8B1E1E]/40 flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Orden y Enviar a WhatsApp 📲'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// Tarjeta de Pizza (Banda inferior AMARILLO MOSTAZA)
function PizzaCard({ product, onClick }) {
  const isOutOfStock = product.stock <= 0;
  const imageSrc = product.imageUrl || getProductImage(product.category, product.name);

  return (
    <div 
      onClick={onClick}
      className={`group rounded-2xl overflow-hidden shadow-xl bg-[#1A1A1A] border border-white/5 hover:-translate-y-1 active:scale-[0.98] hover:shadow-2xl transition-all duration-200 cursor-pointer touch-manipulation ${
        isOutOfStock ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div className="relative h-48 md:h-52 overflow-hidden bg-black">
        <img 
          src={imageSrc} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>

      <div className="bg-[#F4C430] p-4 flex justify-between items-end">
        <div className="space-y-0.5 max-w-[75%]">
          <h3 className="font-extrabold text-black text-lg md:text-xl uppercase tracking-tight leading-tight">
            {product.name}
          </h3>
          <p className="text-black/80 font-medium text-xs line-clamp-2 leading-tight">
            {product.description || 'jamón, cabano y queso'}
          </p>
        </div>

        <div className="text-right">
          <span className={`text-xs font-black px-2 py-1 rounded ${
            isOutOfStock ? 'bg-red-900 text-red-200' : 'text-emerald-950 font-extrabold'
          }`}>
            {isOutOfStock ? 'Agotado' : 'En Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tarjeta Carmesí (Lasagna, Hamburguesas, Maicitos)
function CrimsonCard({ product, onClick }) {
  const isOutOfStock = product.stock <= 0;
  const imageSrc = product.imageUrl || getProductImage(product.category, product.name);

  return (
    <div 
      onClick={onClick}
      className={`group rounded-2xl overflow-hidden shadow-xl bg-[#1A1A1A] border border-white/5 hover:-translate-y-1 active:scale-[0.98] hover:shadow-2xl transition-all duration-200 cursor-pointer touch-manipulation ${
        isOutOfStock ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div className="relative h-48 md:h-52 overflow-hidden bg-black">
        <img 
          src={imageSrc} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>

      <div className="bg-[#8B1E1E] p-4 flex justify-between items-end text-white">
        <div className="space-y-0.5 max-w-[75%]">
          <h3 className="font-bold text-white text-lg md:text-xl capitalize leading-tight">
            {product.name}
          </h3>
          <p className="text-white/80 font-normal text-xs line-clamp-2 leading-tight">
            {product.description || 'Carne bolonesa pollo y queso'}
          </p>
        </div>

        <div className="text-right">
          <span className={`text-xs font-bold ${
            isOutOfStock ? 'text-red-300 font-extrabold' : 'text-[#F4C430]'
          }`}>
            {isOutOfStock ? 'Agotado' : 'En Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tarjeta Carmesí con Botón Superpuesto "Add to Order"
function CrimsonCardWithOverlay({ product, onClick }) {
  const isOutOfStock = product.stock <= 0;
  const imageSrc = product.imageUrl || getProductImage(product.category, product.name);

  return (
    <div 
      onClick={onClick}
      className={`group rounded-2xl overflow-hidden shadow-xl bg-[#1A1A1A] border border-white/5 hover:-translate-y-1 active:scale-[0.98] hover:shadow-2xl transition-all duration-200 cursor-pointer touch-manipulation ${
        isOutOfStock ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div className="relative h-48 md:h-52 overflow-hidden bg-black">
        <img 
          src={imageSrc} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        <div className="absolute bottom-3 right-3">
          <button
            disabled={isOutOfStock}
            className="bg-black/80 backdrop-blur-md border border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430] hover:text-black text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-lg transition-all active:scale-95 min-h-[36px]"
          >
            Add to Order
          </button>
        </div>
      </div>

      <div className="bg-[#8B1E1E] p-4 flex justify-between items-end text-white">
        <div className="space-y-0.5 max-w-[75%]">
          <h3 className="font-bold text-white text-lg capitalize leading-tight">
            {product.name}
          </h3>
          <p className="text-white/80 font-normal text-xs line-clamp-2 leading-tight">
            {product.description || 'Salchicha papa a la francesa, costilla y salsa al gusto'}
          </p>
        </div>

        <div className="text-right">
          <span className={`text-xs font-bold ${
            isOutOfStock ? 'text-red-300 font-extrabold' : 'text-[#F4C430]'
          }`}>
            {isOutOfStock ? 'Agotado' : 'En Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tarjeta Pequeña para Bebidas
function DrinkCard({ product, onClick }) {
  const isOutOfStock = product.stock <= 0;
  const imageSrc = product.imageUrl || getProductImage(product.category, product.name);

  return (
    <div 
      onClick={onClick}
      className={`group rounded-2xl overflow-hidden shadow-lg bg-[#1A1A1A] border border-white/5 hover:-translate-y-1 active:scale-[0.98] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between touch-manipulation ${
        isOutOfStock ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div className="relative h-32 overflow-hidden bg-black/40 p-2 flex items-center justify-center">
        <img 
          src={imageSrc} 
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" 
        />
      </div>

      <div className="bg-[#8B1E1E] p-3 text-white">
        <h4 className="font-bold text-white text-xs leading-tight mb-1 truncate">
          {product.name}
        </h4>
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-mono text-[#F4C430] font-bold">
            ${product.price.toLocaleString('es-CO')}
          </span>
          <span className={isOutOfStock ? 'text-red-300 font-bold' : 'text-[#F4C430] font-semibold'}>
            {isOutOfStock ? 'Agotado' : 'En Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
