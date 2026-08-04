import { useState, useEffect } from 'react';
import { 
  Clock, 
  ChefHat, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Utensils, 
  Truck, 
  Package,
  XCircle,
  ArrowRight
} from 'lucide-react';
import orderService from '../services/orderService';
import { socket } from '../services/socket';

export default function KitchenKDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders();
      setOrders(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error al cargar órdenes KDS:', err);
      setError('Error al obtener los pedidos en tiempo real.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrdersUpdate = () => {
      fetchOrders();
    };

    socket.on('order:created', handleOrdersUpdate);
    socket.on('order:status_changed', handleOrdersUpdate);
    socket.on('inventory:updated', handleOrdersUpdate);

    return () => {
      socket.off('order:created', handleOrdersUpdate);
      socket.off('order:status_changed', handleOrdersUpdate);
      socket.off('inventory:updated', handleOrdersUpdate);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoadingId(orderId);
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar el estado de la orden.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clasificación por columnas Kanban
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Calcular tiempo transcurrido
  const getElapsedTime = (createdAt) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const minutes = Math.floor((now - start) / (1000 * 60));
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 minuto';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="min-h-screen bg-[#141414] text-slate-100 p-4 md:p-8 font-sans">
      
      {/* Encabezado del Módulo KDS */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tight flex items-center gap-3">
            <ChefHat className="w-9 h-9 text-[#F4C430]" />
            Cocina & Pedidos en Vivo <span className="text-[#F4C430] text-lg font-mono font-bold">(KDS)</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
            Tablero Kanban de Control de Comandas y Tiempos de Preparación
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] hover:bg-[#252525] border border-white/10 text-[#F4C430] rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Comandas
        </button>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-950/40 border border-red-800 text-red-200 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tablero Kanban (3 Columnas de Estado) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA 1: PENDIENTES (Borde Rojo #8B1E1E) */}
        <div className="bg-[#1A1A1A] border-2 border-[#8B1E1E] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h2 className="text-lg font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pendientes
            </h2>
            <span className="bg-[#8B1E1E] text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-8">No hay pedidos pendientes.</p>
            ) : (
              pendingOrders.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  elapsedTime={getElapsedTime(order.createdAt)}
                  borderColor="border-[#8B1E1E]"
                  nextStatus="preparing"
                  nextStatusLabel="Iniciar Preparación 👨‍🍳"
                  nextStatusBg="bg-[#F4C430] text-black hover:bg-yellow-400"
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={actionLoadingId === order._id}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: EN PREPARACIÓN (Borde Amarillo #F4C430) */}
        <div className="bg-[#1A1A1A] border-2 border-[#F4C430] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h2 className="text-lg font-black uppercase tracking-wider text-[#F4C430] flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              En Preparación
            </h2>
            <span className="bg-[#F4C430] text-black font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-8">No hay pedidos en cocción.</p>
            ) : (
              preparingOrders.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  elapsedTime={getElapsedTime(order.createdAt)}
                  borderColor="border-[#F4C430]"
                  nextStatus="completed"
                  nextStatusLabel="Marcar como Listo / Entregado 🚀"
                  nextStatusBg="bg-emerald-600 text-white hover:bg-emerald-500"
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={actionLoadingId === order._id}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 3: LISTO / COMPLETADO (Borde Verde #22c55e) */}
        <div className="bg-[#1A1A1A] border-2 border-emerald-500/80 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <h2 className="text-lg font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Listos / Entregados
            </h2>
            <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
            {completedOrders.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-8">No hay pedidos completados recientes.</p>
            ) : (
              completedOrders.slice(0, 10).map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  elapsedTime={getElapsedTime(order.createdAt)}
                  borderColor="border-emerald-500/40"
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={actionLoadingId === order._id}
                  isCompleted
                />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// Componente de Tarjeta de Pedido en KDS
function OrderCard({ order, elapsedTime, borderColor, nextStatus, nextStatusLabel, nextStatusBg, onUpdateStatus, isLoading, isCompleted }) {
  const orderCode = order._id.substring(order._id.length - 6).toUpperCase();

  const getOrderTypeBadge = (type) => {
    switch (type) {
      case 'dine_in':
        return { label: `Mesa ${order.tableNumber || '1'}`, icon: Utensils, style: 'bg-purple-950/80 text-purple-300 border-purple-800' };
      case 'delivery':
        return { label: 'Domicilio 🛵', icon: Truck, style: 'bg-blue-950/80 text-blue-300 border-blue-800' };
      case 'pickup':
      case 'takeaway':
        return { label: 'Para Llevar 🛍️', icon: Package, style: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      default:
        return { label: type, icon: ShoppingBag, style: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getOrderTypeBadge(order.orderType);
  const BadgeIcon = badge.icon;

  return (
    <div className={`bg-[#252525] border-2 ${borderColor} rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
      
      {/* Header Tarjeta */}
      <div className="flex justify-between items-start border-b border-white/10 pb-2.5">
        <div>
          <span className="font-mono text-xs font-black text-[#F4C430] bg-[#141414] px-2 py-0.5 rounded border border-white/10">
            #{orderCode}
          </span>
          <h3 className="font-extrabold text-white text-sm mt-1">{order.clientName}</h3>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.style}`}>
            <BadgeIcon className="w-3 h-3" />
            {badge.label}
          </span>
          <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {elapsedTime}
          </p>
        </div>
      </div>

      {/* Ítems del Pedido */}
      <div className="space-y-2 py-1">
        {order.items.map((item, idx) => {
          const product = item.productId || {};
          return (
            <div key={idx} className="bg-[#1E1E1E] p-2.5 rounded-xl border border-white/5 space-y-1">
              <div className="flex justify-between items-start text-xs font-bold">
                <span className="text-white">
                  <strong className="text-[#F4C430] text-sm mr-1.5">{item.quantity}x</strong> 
                  {product.name || 'Producto'}
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  ${((product.price || 0) * item.quantity).toLocaleString('es-CO')}
                </span>
              </div>

              {item.extras && item.extras.length > 0 && (
                <div className="text-[10px] text-slate-400 pl-4 border-l-2 border-[#8B1E1E]">
                  {item.extras.map((ext, eIdx) => (
                    <p key={eIdx}>+ {ext.name || 'Adicional'}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Datos del Cliente y Notas */}
      {(order.address || order.phone || order.notes) && (
        <div className="bg-[#1A1A1A] p-2.5 rounded-xl text-[11px] space-y-1 text-slate-300 border border-white/5">
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

      {/* Pie de Tarjeta con Método de Pago, Estado Financiero y Total */}
      <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
            order.paymentStatus === 'paid'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
              : 'bg-amber-950/80 text-amber-300 border-amber-600'
          }`}>
            {order.paymentStatus === 'paid' ? '🟢 Pagado' : '⏳ Por Cobrar'}
          </span>
          <span className="font-mono text-slate-400 text-[10px] capitalize">
            {order.paymentMethod || 'Efectivo'}
          </span>
        </div>
        
        <span className="font-mono text-sm font-black text-[#F4C430]">
          ${order.totalAmount?.toLocaleString('es-CO')}
        </span>
      </div>

      {/* Botones de Acción */}
      {!isCompleted && nextStatus && (
        <div className="pt-2 flex gap-2">
          <button
            onClick={() => onUpdateStatus(order._id, nextStatus)}
            disabled={isLoading}
            className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${nextStatusBg} ${isLoading ? 'opacity-50' : 'active:scale-95'}`}
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : nextStatusLabel}
          </button>

          <button
            onClick={() => onUpdateStatus(order._id, 'cancelled')}
            disabled={isLoading}
            className="p-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-xl transition-all"
            title="Cancelar Orden"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
