import { useState, useEffect } from 'react';
import { 
  Layers, 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Search, 
  X, 
  CheckCircle, 
  RefreshCw,
  Info,
  Pencil,
  EyeOff,
  Trash2,
  TrendingUp,
  DollarSign,
  History,
  Activity,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import inventoryService from '../services/inventoryService';
import orderService from '../services/orderService';
import { 
  purchaseUnits, 
  convertToBase, 
  calculateBaseCost, 
  determineBaseUnit, 
  getConversionFactor 
} from '../utils/unitConverter';
import { socket } from '../services/socket';

export default function InventoryDashboard({ onNavigateToPOS, onNavigateToClientMenu }) {
  const [supplies, setSupplies] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [activeTab, setActiveTab] = useState('bodega'); // 'bodega' | 'menu' | 'kardex' | 'pedidos'

  // Pedidos states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Supply Modal Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSupply, setNewSupply] = useState({
    name: '',
    unit: 'g', // Represents the frontend "purchase unit"
    stock: '',
    minStock: '',
    costPrice: '',
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Product Modal Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizzas',
    customCategory: '',
    type: 'simple',
    stock: '',
    minStock: '',
    recipe: [] // Array of { supplyId: ObjectId, name, unit, costPrice, quantity: Number }
  });
  const [productFormError, setProductFormError] = useState('');
  const [productFormSuccess, setProductFormSuccess] = useState('');

  // Movement Modal states
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedSupplyForMovement, setSelectedSupplyForMovement] = useState(null);
  const [newMovement, setNewMovement] = useState({
    type: 'compra', // 'compra' | 'consumo' | 'dano' | 'ajuste'
    quantity: '',
    unit: 'g', // purchase unit
    unitCost: '', // only for compras
    notes: '',
    ajusteDirection: 'sumar' // 'sumar' | 'restar' (only for type='ajuste')
  });
  const [movementFormError, setMovementFormError] = useState('');
  const [movementFormSuccess, setMovementFormSuccess] = useState('');

  // Batch Purchase states
  const [isBatchPurchaseModalOpen, setIsBatchPurchaseModalOpen] = useState(false);
  const [batchPurchaseNotes, setBatchPurchaseNotes] = useState('');
  const [batchPurchaseItems, setBatchPurchaseItems] = useState([]);
  const [batchPurchaseError, setBatchPurchaseError] = useState('');
  const [batchPurchaseSuccess, setBatchPurchaseSuccess] = useState('');

  // Physical Count states
  const [isPhysicalCountModalOpen, setIsPhysicalCountModalOpen] = useState(false);
  const [physicalCountNotes, setPhysicalCountNotes] = useState('');
  const [physicalCounts, setPhysicalCounts] = useState({});
  const [physicalCountError, setPhysicalCountError] = useState('');
  const [physicalCountSuccess, setPhysicalCountSuccess] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Temporary state for selected supply to add to recipe
  const [selectedSupplyId, setSelectedSupplyId] = useState('');

  const categories = ['Pizzas', 'Hamburguesas', 'Bebidas', 'Entradas', 'Otro'];

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const suppliesRes = await inventoryService.getSupplies();
      const productsRes = await inventoryService.getProducts();
      const movementsRes = await inventoryService.getMovements();
      setSupplies(suppliesRes.data || []);
      setProducts(productsRes.data || []);
      setMovements(movementsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos del servidor. Asegúrese de que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await orderService.getOrders();
      setOrders(res.data || []);
      setOrdersError('');
    } catch (err) {
      console.error(err);
      setOrdersError('Error al obtener los pedidos del servidor.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchOrders();

    const handleInventoryUpdate = () => {
      loadData();
    };

    const handleOrdersUpdate = () => {
      fetchOrders();
      loadData();
    };

    socket.on('inventory:updated', handleInventoryUpdate);
    socket.on('order:created', handleOrdersUpdate);
    socket.on('order:status_changed', handleOrdersUpdate);

    return () => {
      socket.off('inventory:updated', handleInventoryUpdate);
      socket.off('order:created', handleOrdersUpdate);
      socket.off('order:status_changed', handleOrdersUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        await fetchOrders();
        await loadData(); // Reload supply levels since stock was deducted!
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado del pedido: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open modal for adding a new supply
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewSupply({
      name: '',
      unit: 'g',
      stock: '',
      minStock: '',
      costPrice: '',
      isActive: true
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  // Open modal for editing a supply (loads in its database base unit first)
  const handleOpenEditModal = (supply) => {
    setIsEditing(true);
    setEditingId(supply._id);
    setNewSupply({
      name: supply.name,
      unit: supply.unit, // default to database base unit ('g', 'ml', or 'und')
      stock: String(supply.stock),
      minStock: String(supply.minStock),
      costPrice: String(supply.costPrice),
      isActive: supply.isActive
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  // Dynamic unit conversion on dropdown change in the form
  const handleUnitChange = (e) => {
    const nextUnit = e.target.value;
    const prevUnit = newSupply.unit;

    // Convert stock value in input
    let updatedStock = newSupply.stock;
    if (newSupply.stock !== '' && !isNaN(Number(newSupply.stock))) {
      const baseStock = convertToBase(Number(newSupply.stock), prevUnit);
      const convertedStock = baseStock / getConversionFactor(nextUnit);
      updatedStock = String(Math.round(convertedStock * 100) / 100);
    }

    // Convert minStock value in input
    let updatedMinStock = newSupply.minStock;
    if (newSupply.minStock !== '' && !isNaN(Number(newSupply.minStock))) {
      const baseMinStock = convertToBase(Number(newSupply.minStock), prevUnit);
      const convertedMinStock = baseMinStock / getConversionFactor(nextUnit);
      updatedMinStock = String(Math.round(convertedMinStock * 100) / 100);
    }

    // Convert costPrice value in input
    let updatedCostPrice = newSupply.costPrice;
    if (newSupply.costPrice !== '' && !isNaN(Number(newSupply.costPrice))) {
      const baseCost = calculateBaseCost(Number(newSupply.costPrice), prevUnit);
      const convertedCost = baseCost * getConversionFactor(nextUnit);
      updatedCostPrice = String(Math.round(convertedCost * 100) / 100);
    }

    setNewSupply({
      ...newSupply,
      unit: nextUnit,
      stock: updatedStock,
      minStock: updatedMinStock,
      costPrice: updatedCostPrice
    });
  };

  // Form submit for new / edited supply
  const handleSubmitSupply = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (!newSupply.name.trim()) {
      setFormError('El nombre del insumo es obligatorio');
      return;
    }
    
    const inputStock = newSupply.stock === '' ? 0 : Number(newSupply.stock);
    const inputMinStock = newSupply.minStock === '' ? 0 : Number(newSupply.minStock);
    const inputCostPrice = newSupply.costPrice === '' ? 0 : Number(newSupply.costPrice);

    if (isNaN(inputStock) || isNaN(inputMinStock) || isNaN(inputCostPrice)) {
      setFormError('Los valores deben ser numéricos');
      return;
    }

    if (inputStock < 0 || inputMinStock < 0 || inputCostPrice < 0) {
      setFormError('Los valores numéricos no pueden ser negativos');
      return;
    }

    // Intercept and convert to Base Units using converter
    const baseUnit = determineBaseUnit(newSupply.unit);
    const baseStock = convertToBase(inputStock, newSupply.unit);
    const baseMinStock = convertToBase(inputMinStock, newSupply.unit);
    const baseCostPrice = calculateBaseCost(inputCostPrice, newSupply.unit);

    const payload = {
      name: newSupply.name.trim(),
      unit: baseUnit, // strictly 'g', 'ml', or 'und'
      stock: baseStock,
      minStock: baseMinStock,
      costPrice: baseCostPrice,
      isActive: newSupply.isActive
    };

    try {
      if (isEditing) {
        await inventoryService.updateSupply(editingId, payload);
        setFormSuccess('Insumo actualizado correctamente');
      } else {
        await inventoryService.addSupply(payload);
        setFormSuccess('Insumo creado correctamente');
      }

      // Reload
      loadData();
      
      // Close modal
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error al guardar el insumo. Intente nuevamente.');
    }
  };

  // --- Product Modal Form Methods ---
  const handleOpenProductModal = () => {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: 'Pizzas',
      customCategory: '',
      type: 'simple',
      stock: '',
      minStock: '',
      recipe: []
    });
    setProductFormError('');
    setProductFormSuccess('');
    setSelectedSupplyId('');
    setIsProductModalOpen(true);
  };

  // Open modal for editing a product
  const handleOpenEditProductModal = (product) => {
    setIsEditingProduct(true);
    setEditingProductId(product._id);

    // Map recipe to the structure required by the modal state
    const mappedRecipe = (product.recipe || []).map(item => {
      const supply = item.supplyId;
      return {
        supplyId: supply._id || supply,
        name: supply.name || 'Insumo',
        unit: supply.unit || 'g',
        costPrice: supply.costPrice || 0,
        quantity: String(item.quantity)
      };
    });

    const isCustomCat = !['Pizzas', 'Hamburguesas', 'Bebidas', 'Entradas'].includes(product.category);

    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: isCustomCat ? 'Otro' : product.category,
      customCategory: isCustomCat ? product.category : '',
      type: product.type,
      stock: product.type === 'simple' ? String(product.stock) : '',
      minStock: product.type === 'simple' ? String(product.minStock) : '',
      recipe: mappedRecipe
    });

    setProductFormError('');
    setProductFormSuccess('');
    setSelectedSupplyId('');
    setIsProductModalOpen(true);
  };

  const handleAddIngredient = () => {
    if (!selectedSupplyId) return;

    // Check if already in recipe
    if (newProduct.recipe.some(item => item.supplyId === selectedSupplyId)) {
      setProductFormError('Este ingrediente ya está agregado en la receta');
      return;
    }

    const supply = supplies.find(s => s._id === selectedSupplyId);
    if (!supply) return;

    setNewProduct({
      ...newProduct,
      recipe: [
        ...newProduct.recipe,
        {
          supplyId: supply._id,
          name: supply.name,
          unit: supply.unit,
          costPrice: supply.costPrice,
          quantity: ''
        }
      ]
    });
    
    // Clear selection
    setSelectedSupplyId('');
    setProductFormError('');
  };

  const handleRemoveIngredient = (index) => {
    const updatedRecipe = [...newProduct.recipe];
    updatedRecipe.splice(index, 1);
    setNewProduct({
      ...newProduct,
      recipe: updatedRecipe
    });
  };

  const handleRecipeQuantityChange = (index, value) => {
    const updatedRecipe = [...newProduct.recipe];
    updatedRecipe[index].quantity = value;
    setNewProduct({
      ...newProduct,
      recipe: updatedRecipe
    });
  };

  // Calculate live recipe cost and profitability
  const calculateRecipeStats = () => {
    const salePrice = newProduct.price === '' ? 0 : Number(newProduct.price);
    
    let totalCost = 0;
    newProduct.recipe.forEach(item => {
      const qty = item.quantity === '' ? 0 : Number(item.quantity);
      if (!isNaN(qty) && qty > 0) {
        totalCost += qty * item.costPrice;
      }
    });

    const profit = Math.max(0, salePrice - totalCost);
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

    return {
      totalCost,
      profit,
      margin
    };
  };

  const recipeStats = calculateRecipeStats();

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');
    setProductFormSuccess('');

    // Validations
    if (!newProduct.name.trim()) {
      setProductFormError('El nombre del producto es obligatorio');
      return;
    }

    const priceVal = newProduct.price === '' ? 0 : Number(newProduct.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      setProductFormError('El precio de venta debe ser un número mayor a cero');
      return;
    }

    const categoryVal = newProduct.category === 'Otro' 
      ? newProduct.customCategory.trim() 
      : newProduct.category;

    if (!categoryVal) {
      setProductFormError('La categoría es obligatoria');
      return;
    }

    const isComposite = newProduct.type === 'composite';
    let payload = {
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: priceVal,
      category: categoryVal,
      type: newProduct.type
    };

    if (isComposite) {
      if (newProduct.recipe.length === 0) {
        setProductFormError('Debe agregar al menos un ingrediente para la receta');
        return;
      }

      // Validate quantities in recipe
      const formattedRecipe = [];
      for (const item of newProduct.recipe) {
        const qty = item.quantity === '' ? 0 : Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          setProductFormError(`La cantidad para ${item.name} debe ser un número mayor a cero`);
          return;
        }
        formattedRecipe.push({
          supplyId: item.supplyId,
          quantity: qty
        });
      }

      payload.recipe = formattedRecipe;
      payload.stock = 0;
      payload.minStock = 0;
    } else {
      const stockVal = newProduct.stock === '' ? 0 : Number(newProduct.stock);
      const minStockVal = newProduct.minStock === '' ? 0 : Number(newProduct.minStock);

      if (isNaN(stockVal) || isNaN(minStockVal) || stockVal < 0 || minStockVal < 0) {
        setProductFormError('Los valores de stock y stock mínimo no pueden ser negativos');
        return;
      }

      payload.stock = stockVal;
      payload.minStock = minStockVal;
      payload.recipe = [];
    }

    try {
      if (isEditingProduct) {
        await inventoryService.updateProduct(editingProductId, payload);
        setProductFormSuccess('Producto actualizado correctamente');
      } else {
        await inventoryService.addProduct(payload);
        setProductFormSuccess('Producto guardado correctamente');
      }
      
      // Reload
      loadData();
      
      // Close modal
      setTimeout(() => {
        setIsProductModalOpen(false);
        setProductFormSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setProductFormError(err.response?.data?.message || 'Error al guardar el producto. Intente nuevamente.');
    }
  };

  // Quick stock adjust helper for simple products
  const handleAdjustStock = async (id, type, currentStock, diff) => {
    try {
      const newStock = Math.max(0, Number(currentStock) + diff);
      await inventoryService.updateStock(id, type, newStock);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el stock del producto.');
    }
  };

  // --- Supply Movement Modal Form Methods ---
  const handleOpenMovementModal = (supply) => {
    setSelectedSupplyForMovement(supply);
    setNewMovement({
      type: 'compra',
      quantity: '',
      unit: supply.unit, // default to database base unit of the supply
      unitCost: '',
      notes: '',
      ajusteDirection: 'sumar'
    });
    setMovementFormError('');
    setMovementFormSuccess('');
    setIsMovementModalOpen(true);
  };

  // Dynamic cost unit label and helper changes for Movement Modal
  const handleMovementUnitChange = (e) => {
    const nextUnit = e.target.value;
    const prevUnit = newMovement.unit;

    // Convert cost input value dynamically
    let updatedCostPrice = newMovement.unitCost;
    if (newMovement.unitCost !== '' && !isNaN(Number(newMovement.unitCost))) {
      const baseCost = calculateBaseCost(Number(newMovement.unitCost), prevUnit);
      const convertedCost = baseCost * getConversionFactor(nextUnit);
      updatedCostPrice = String(Math.round(convertedCost * 100) / 100);
    }

    setNewMovement({
      ...newMovement,
      unit: nextUnit,
      unitCost: updatedCostPrice
    });
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setMovementFormError('');
    setMovementFormSuccess('');

    const inputQty = newMovement.quantity === '' ? 0 : Number(newMovement.quantity);
    if (isNaN(inputQty) || inputQty <= 0) {
      setMovementFormError('La cantidad debe ser un número positivo mayor a cero');
      return;
    }

    let baseQuantity = convertToBase(inputQty, newMovement.unit);
    let baseUnitCost = 0;

    if (newMovement.type === 'compra') {
      const inputCost = newMovement.unitCost === '' ? 0 : Number(newMovement.unitCost);
      if (isNaN(inputCost) || inputCost <= 0) {
        setMovementFormError('El costo de compra debe ser un número positivo mayor a cero');
        return;
      }
      baseUnitCost = calculateBaseCost(inputCost, newMovement.unit);
    }

    // Apply sign for adjustments
    if (newMovement.type === 'ajuste') {
      if (newMovement.ajusteDirection === 'restar') {
        baseQuantity = -baseQuantity;
      }
    }

    const payload = {
      supplyId: selectedSupplyForMovement._id,
      type: newMovement.type,
      quantity: baseQuantity,
      unitCost: baseUnitCost,
      notes: newMovement.notes.trim()
    };

    try {
      await inventoryService.createMovement(payload);
      setMovementFormSuccess('Movimiento registrado correctamente');
      
      // Reload
      loadData();

      setTimeout(() => {
        setIsMovementModalOpen(false);
        setMovementFormSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error al registrar el movimiento.');
    }
  };

  // --- Batch Purchase Modal Methods ---
  const handleOpenBatchPurchaseModal = () => {
    setBatchPurchaseNotes('');
    setBatchPurchaseItems([
      { supplyId: '', quantity: '', purchaseUnit: 'g', totalCost: '' }
    ]);
    setBatchPurchaseError('');
    setBatchPurchaseSuccess('');
    setIsBatchPurchaseModalOpen(true);
  };

  const handleAddBatchPurchaseRow = () => {
    setBatchPurchaseItems([
      ...batchPurchaseItems,
      { supplyId: '', quantity: '', purchaseUnit: 'g', totalCost: '' }
    ]);
  };

  const handleRemoveBatchPurchaseRow = (index) => {
    const updated = [...batchPurchaseItems];
    updated.splice(index, 1);
    setBatchPurchaseItems(updated);
  };

  const handleBatchPurchaseItemChange = (index, field, value) => {
    const updated = [...batchPurchaseItems];
    updated[index][field] = value;

    // If supplyId is changed, set the default purchaseUnit to the supply's base unit
    if (field === 'supplyId' && value) {
      const supply = supplies.find(s => s._id === value);
      if (supply) {
        updated[index].purchaseUnit = supply.unit;
      }
    }

    setBatchPurchaseItems(updated);
  };

  const handleSubmitBatchPurchase = async (e) => {
    e.preventDefault();
    setBatchPurchaseError('');
    setBatchPurchaseSuccess('');

    // Validations
    if (batchPurchaseItems.length === 0) {
      setBatchPurchaseError('Debe ingresar al menos una fila de compra');
      return;
    }

    for (let i = 0; i < batchPurchaseItems.length; i++) {
      const item = batchPurchaseItems[i];
      if (!item.supplyId) {
        setBatchPurchaseError(`Fila ${i + 1}: Debe seleccionar un insumo`);
        return;
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        setBatchPurchaseError(`Fila ${i + 1}: La cantidad debe ser un número positivo`);
        return;
      }
      const cost = Number(item.totalCost);
      if (isNaN(cost) || cost < 0) {
        setBatchPurchaseError(`Fila ${i + 1}: El costo total no puede ser negativo`);
        return;
      }
    }

    const payload = {
      notes: batchPurchaseNotes.trim() || 'Ingreso de compra por lote',
      items: batchPurchaseItems.map(item => ({
        supplyId: item.supplyId,
        quantity: Number(item.quantity),
        purchaseUnit: item.purchaseUnit,
        totalCost: Number(item.totalCost)
      }))
    };

    try {
      await inventoryService.registerBatchPurchase(payload);
      setBatchPurchaseSuccess('Factura de compra registrada y CPP actualizado con éxito');
      loadData();
      setTimeout(() => {
        setIsBatchPurchaseModalOpen(false);
        setBatchPurchaseSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setBatchPurchaseError(err.response?.data?.message || 'Error al guardar la compra en lote.');
    }
  };

  // --- Physical Count Modal Methods ---
  const handleOpenPhysicalCountModal = () => {
    setPhysicalCountNotes('');
    const counts = {};
    supplies.forEach(s => {
      if (s.isActive) {
        counts[s._id] = '';
      }
    });
    setPhysicalCounts(counts);
    setPhysicalCountError('');
    setPhysicalCountSuccess('');
    setIsPhysicalCountModalOpen(true);
  };

  const handlePhysicalCountChange = (supplyId, value) => {
    setPhysicalCounts({
      ...physicalCounts,
      [supplyId]: value
    });
  };

  const handleSubmitPhysicalCount = async (e) => {
    e.preventDefault();
    setPhysicalCountError('');
    setPhysicalCountSuccess('');

    const adjustments = [];
    const keys = Object.keys(physicalCounts);

    for (const supplyId of keys) {
      const valStr = physicalCounts[supplyId];
      if (valStr !== '' && valStr !== undefined && valStr !== null) {
        const physicalStock = Number(valStr);
        if (isNaN(physicalStock) || physicalStock < 0) {
          setPhysicalCountError('Todos los conteos físicos válidos deben ser números mayores o iguales a cero');
          return;
        }

        const supply = supplies.find(s => s._id === supplyId);
        if (supply && physicalStock !== supply.stock) {
          adjustments.push({
            supplyId,
            physicalStock
          });
        }
      }
    }

    if (adjustments.length === 0) {
      setPhysicalCountError('No se ingresaron cambios o diferencias en el stock');
      return;
    }

    const payload = {
      notes: physicalCountNotes.trim() || 'Ajuste de conteo físico de inventario',
      adjustments
    };

    try {
      await inventoryService.registerBatchAdjustment(payload);
      setPhysicalCountSuccess(`Conteo físico aplicado. Se registraron ${adjustments.length} ajustes.`);
      loadData();
      setTimeout(() => {
        setIsPhysicalCountModalOpen(false);
        setPhysicalCountSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setPhysicalCountError(err.response?.data?.message || 'Error al aplicar el conteo físico.');
    }
  };

  // Stats
  const totalSuppliesCount = supplies.length;
  const activeSuppliesCount = supplies.filter(s => s.isActive).length;
  const lowStockSuppliesCount = supplies.filter(s => s.isActive && s.stock <= s.minStock).length;
  const totalProductsCount = products.length;

  // Filter lists based on search
  const filteredSupplies = supplies.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMovements = movements.filter(m => 
    (m.supplyId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.tableNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Unit label translation for dynamic labels
  const getUnitLabel = (unit) => {
    switch (unit) {
      case 'g': return 'Gramo';
      case 'kg': return 'Kilo';
      case 'lb': return 'Libra';
      case 'ml': return 'Mililitro';
      case 'L': return 'Litro';
      case 'und': return 'Unidad';
      default: return 'Unidad';
    }
  };

  // Cost helper text explaining conversions
  const getCostHelperText = (unit) => {
    switch (unit) {
      case 'kg':
        return 'Ingresa el costo por Kilo. El sistema lo convertirá a costo por gramo ($ / 1000) en el inventario y recalculará el CPP.';
      case 'lb':
        return 'Ingresa el costo por Libra. El sistema lo convertirá a costo por gramo ($ / 500) en el inventario y recalculará el CPP.';
      case 'L':
        return 'Ingresa el costo por Litro. El sistema lo convertirá a costo por mililitro ($ / 1000) en el inventario y recalculará el CPP.';
      case 'g':
        return 'Ingresa el costo directo por gramo. Se recalculará el CPP.';
      case 'ml':
        return 'Ingresa el costo directo por mililitro. Se recalculará el CPP.';
      case 'und':
        return 'Ingresa el costo directo por unidad. Se recalculará el CPP.';
      default:
        return 'Ingresa el costo de compra correspondiente.';
    }
  };

  // Format movement badge
  const getMovementTypeBadge = (type) => {
    switch (type) {
      case 'compra':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Compra (Entrada)</span>;
      case 'venta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">Venta (POS)</span>;
      case 'consumo':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">Consumo Interno</span>;
      case 'dano':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">Daño / Merma</span>;
      case 'ajuste':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Ajuste</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">{type}</span>;
    }
  };

  // Supplies available to add to recipe (active and not yet in recipe)
  const availableSuppliesForRecipe = supplies.filter(s => 
    s.isActive && 
    !newProduct.recipe.some(item => item.supplyId === s._id)
  );

  // Purchase units that match the base unit category (e.g. show only kg/lb/g if supply base is g)
  const getFilteredPurchaseUnitsForSupply = (baseUnit) => {
    return purchaseUnits.filter(u => u.baseUnit === baseUnit);
  };

  // Calcular el valor total monetario del inventario
  const totalInventoryValue = supplies.reduce((acc, s) => acc + (s.stock * s.costPrice), 0);

  return (
    <div className="min-h-screen bg-[#141414] text-slate-100 flex flex-col font-sans">
      
      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8 space-y-6 animate-fadeIn">
        
        {error && (
          <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4 flex items-center gap-3 text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-white">Error de Conexión</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Stats KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* KPI 1: Insumos Totales */}
          <div className="bg-[#1E1E1E] border border-white/10 border-l-4 border-l-[#F4C430] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.01] transition-all shadow-xl">
            <div className="bg-[#F4C430]/10 p-3 rounded-xl border border-[#F4C430]/20 text-[#F4C430]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Insumos</p>
              <h3 className="text-2xl font-black text-white mt-0.5">
                {loading ? '...' : activeSuppliesCount}
                <span className="text-slate-500 text-xs font-normal"> / {totalSuppliesCount} act.</span>
              </h3>
            </div>
          </div>

          {/* KPI 2: Alertas de Stock Bajo */}
          <div className={`bg-[#1E1E1E] border border-white/10 border-l-4 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group transition-all shadow-xl ${
            lowStockSuppliesCount > 0 
              ? 'border-l-[#8B1E1E]' 
              : 'border-l-emerald-500'
          }`}>
            <div className={`p-3 rounded-xl border ${
              lowStockSuppliesCount > 0 
                ? 'bg-[#8B1E1E]/20 border-[#8B1E1E] text-red-400 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Alertas Stock Bajo</p>
              <h3 className={`text-2xl font-black mt-0.5 ${lowStockSuppliesCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {loading ? '...' : lowStockSuppliesCount}
              </h3>
            </div>
          </div>

          {/* KPI 3: Productos Activos */}
          <div className="bg-[#1E1E1E] border border-white/10 border-l-4 border-l-[#8B1E1E] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.01] transition-all shadow-xl">
            <div className="bg-[#8B1E1E]/10 p-3 rounded-xl border border-[#8B1E1E]/20 text-[#8B1E1E]">
              <Package className="w-6 h-6 text-[#F4C430]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Productos Activos</p>
              <h3 className="text-2xl font-black text-white mt-0.5">
                {loading ? '...' : totalProductsCount}
              </h3>
            </div>
          </div>

          {/* KPI 4: Valor Total del Inventario */}
          <div className="bg-[#1E1E1E] border border-white/10 border-l-4 border-l-emerald-500 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:scale-[1.01] transition-all shadow-xl">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Valor del Inventario</p>
              <h3 className="text-xl font-black font-mono text-[#F4C430] mt-0.5">
                ${totalInventoryValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </h3>
            </div>
          </div>

        </section>

        {/* Tab Controls & Search/Actions */}
        <section className="glass-panel p-4 rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tabs List */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => { setActiveTab('bodega'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'bodega' 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25 font-extrabold scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Layers className="w-4 h-4 text-jj-yellow" />
                Bodega (Insumos)
              </button>
              <button
                onClick={() => { setActiveTab('menu'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'menu' 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25 font-extrabold scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Package className="w-4 h-4 text-jj-yellow" />
                Menú / Carta
              </button>
              <button
                onClick={() => { setActiveTab('kardex'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'kardex' 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25 font-extrabold scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <History className="w-4 h-4 text-jj-yellow" />
                Historial Kardex
              </button>
              <button
                onClick={() => { setActiveTab('pedidos'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'pedidos' 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25 font-extrabold scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-jj-yellow" />
                Pedidos
              </button>
            </div>

            {/* Search + Action Buttons container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:justify-end flex-1">
              {/* Search Input */}
              <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'bodega' 
                      ? 'Buscar insumo...' 
                      : activeTab === 'menu' 
                        ? 'Buscar producto...' 
                        : activeTab === 'pedidos'
                          ? 'Buscar pedido...'
                          : 'Buscar en historial...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-jj-yellow focus:ring-1 focus:ring-jj-yellow/25 outline-none transition-all placeholder:text-slate-500 font-bold text-white shadow-inner"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              {activeTab === 'bodega' && (
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={handleOpenBatchPurchaseModal}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm"
                    title="Registrar una factura con varios insumos"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Ingresar Compra (Lote)
                  </button>
                  <button
                    onClick={handleOpenPhysicalCountModal}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300 hover:bg-slate-800/40 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm"
                    title="Hacer auditoría y cuadre físico de inventario"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Conteo Físico
                  </button>
                  <button
                    onClick={handleOpenAddModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 shadow-md shadow-brand-red/15"
                  >
                    <Plus className="w-3.5 h-3.5 text-jj-yellow" />
                    Nuevo Insumo
                  </button>
                </div>
              )}
              {activeTab === 'menu' && (
                <button
                  onClick={handleOpenProductModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-md shadow-brand-red/15"
                >
                  <Plus className="w-4 h-4 text-jj-yellow" />
                  Nuevo Producto
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic content rendering */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw className="w-10 h-10 animate-spin text-yellow-500" />
            <p>Cargando información del inventario...</p>
          </div>
        ) : (
          <section className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden animate-fadeIn">
            {activeTab === 'bodega' ? (
              /* Bodega Table View */
              <div className="overflow-x-auto">
                {filteredSupplies.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900/20 border border-slate-800 rounded-2xl m-6">
                    No se encontraron insumos. {searchTerm ? 'Intente con otra búsqueda.' : 'Cree uno nuevo con el botón de arriba.'}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50 font-bold">
                        <th className="py-4 px-6 font-bold">Nombre Insumo</th>
                        <th className="py-4 px-6 font-bold text-center">Stock Base</th>
                        <th className="py-4 px-6 font-bold">U. Base</th>
                        <th className="py-4 px-6 font-bold text-center">Mínimo Alerta</th>
                        <th className="py-4 px-6 font-bold">Costo Base ($)</th>
                        <th className="py-4 px-6 font-bold">Estado</th>
                        <th className="py-4 px-6 font-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {filteredSupplies.map(supply => {
                        const isLow = supply.stock <= supply.minStock;
                        
                        return (
                          <tr 
                            key={supply._id} 
                            className={`hover:bg-slate-800/50 border-l-4 transition-all duration-200 border-b border-slate-900/30 ${
                              !supply.isActive
                                ? 'opacity-40 select-none border-l-transparent'
                                : isLow 
                                  ? 'bg-red-950/10 border-l-brand-red animate-pulseGlowLowStock' 
                                  : 'border-l-transparent hover:border-l-slate-700'
                            }`}
                          >
                            <td className="py-4 px-6 font-medium text-white">
                              <div className="flex flex-col">
                                <span className={!supply.isActive ? 'line-through text-slate-400' : 'text-slate-200'}>
                                  {supply.name}
                                </span>
                                {!supply.isActive && (
                                  <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1 mt-0.5">
                                    <EyeOff className="w-3 h-3" /> Inactivo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`font-mono text-base font-bold ${!supply.isActive ? 'text-slate-400' : isLow ? 'text-brand-red font-extrabold' : 'text-slate-200'}`}>
                                {supply.stock.toLocaleString('es-CO')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-sm font-medium">{supply.unit}</td>
                            <td className="py-4 px-6 text-center font-mono text-slate-400 text-sm">{supply.minStock.toLocaleString('es-CO')}</td>
                            <td className="py-4 px-6 font-mono text-sm text-slate-300">
                              <span className="text-brand-yellow font-bold">${supply.costPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              <span className="text-slate-500 text-xs"> / {supply.unit}</span>
                            </td>
                            <td className="py-4 px-6">
                              {!supply.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-semibold bg-slate-900/60 text-slate-500 border border-slate-800">
                                  Inactivo
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold ${isLow ? 'bg-brand-red/10 text-brand-red border border-brand-red/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-brand-red animate-ping' : 'bg-green-500'}`} />
                                  {isLow ? 'Stock Bajo' : 'Suficiente'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center justify-center gap-2">
                                {/* Register Movement button */}
                                <button
                                  disabled={!supply.isActive}
                                  onClick={() => handleOpenMovementModal(supply)}
                                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-500 hover:text-emerald-400 hover:bg-slate-950 hover:border-brand-yellow/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center shadow-md shadow-black/10 shadow-emerald-500/5 hover:shadow-emerald-500/10"
                                  title="Registrar Compra, Consumo, Daño o Ajuste"
                                >
                                  <Activity className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Edit Supply info button */}
                                <button
                                  onClick={() => handleOpenEditModal(supply)}
                                  className="p-1.5 rounded bg-slate-900/60 border border-slate-800 text-yellow-500/80 hover:text-yellow-500 hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all inline-flex items-center justify-center"
                                  title="Editar Insumo"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ) : activeTab === 'menu' ? (
              /* Menú/Carta view with categories */
              <div className="p-6 space-y-6">
                {/* Category selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
                  {['todos', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-brand-red border-transparent text-white shadow-lg shadow-brand-red/20 font-extrabold scale-[1.02]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {cat === 'todos' ? 'Todos los Productos' : cat}
                    </button>
                  ))}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900/20 border border-slate-800 rounded-2xl">
                    No se encontraron productos terminados. {searchTerm ? 'Intente con otra búsqueda.' : 'Cree uno nuevo con el botón de arriba.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                      const isComposite = product.type === 'composite';
                      const isLow = product.stock <= (product.minStock || 0);
                      const isOutOfStock = product.stock === 0;

                      return (
                        <div 
                          key={product._id} 
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-brand-yellow/30 hover:shadow-brand-yellow/5 transition-all duration-300 shadow-lg group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-white text-base truncate group-hover:text-jj-yellow transition-colors leading-snug">
                                    {product.name}
                                  </h4>
                                  <button
                                    onClick={() => handleOpenEditProductModal(product)}
                                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-jj-yellow/70 hover:text-jj-yellow hover:bg-slate-900 hover:border-jj-yellow/30 active:scale-90 transition-all inline-flex items-center justify-center shrink-0"
                                    title="Editar Producto"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="inline-block px-2 py-0.5 mt-1.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/25 text-[10px] font-bold uppercase tracking-wider">
                                  {product.category}
                                </span>
                              </div>
                              <span className="font-mono text-jj-yellow text-lg font-bold bg-jj-yellow/10 border border-jj-yellow/20 px-2 py-0.5 rounded shadow-sm shadow-jj-yellow/5 shrink-0">
                                ${product.price.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                              </span>
                            </div>

                            {product.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
                                {product.description}
                              </p>
                            )}

                            {/* Stock Indicator */}
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {isComposite ? 'Stock Máximo Disp. (Receta)' : 'Stock En Tienda'}
                                </p>
                                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                                  <span className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-brand-red' : isLow ? 'bg-brand-yellow animate-pulse' : 'bg-green-500'}`} />
                                  {isOutOfStock ? 'Agotado' : isLow ? 'Pocas Unidades' : 'Disponible'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xl font-extrabold font-mono ${isOutOfStock ? 'text-brand-red' : isLow ? 'text-brand-yellow' : 'text-emerald-400'}`}>
                                  {product.stock}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold ml-1">unds</span>
                              </div>
                            </div>

                            {/* Recipe Summary for composite products */}
                            {isComposite && product.recipe && (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5 text-slate-400" />
                                  Ingredientes de receta:
                                </p>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                  {product.recipe.map((item, idx) => {
                                    const supplyIsActive = item.supplyId?.isActive !== false;
                                    return (
                                      <span 
                                        key={idx} 
                                        className={`inline-flex text-[10px] bg-slate-900/60 px-2 py-0.5 rounded-md text-slate-400 border border-slate-800 ${
                                          !supplyIsActive ? 'border-brand-red/30 text-brand-red bg-brand-red/5' : ''
                                        }`}
                                        title={`${item.quantity} ${item.supplyId?.unit || ''} de ${item.supplyId?.name || 'Insumo'} ${!supplyIsActive ? '(INACTIVO)' : ''}`}
                                      >
                                        {item.supplyId?.name || 'Insumo'}: {item.quantity} {item.supplyId?.unit}
                                        {!supplyIsActive && ' (Inactivo)'}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Simple Product Quick stock adjust */}
                          {!isComposite ? (
                            <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between gap-4">
                              <span className="text-xs text-slate-400 font-medium">Ajuste rápido:</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleAdjustStock(product._id, 'product', product.stock, -1)}
                                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:scale-90 transition-all"
                                  title="Restar 1"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(product._id, 'product', product.stock, 1)}
                                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:scale-90 transition-all"
                                  title="Sumar 1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Composite Product: Cost & Margin Details */
                            <div className="mt-4 pt-4 border-t border-slate-900/60 flex flex-col gap-2 text-xs text-slate-400">
                              <div className="flex justify-between items-center">
                                <span>Costo de Producción:</span>
                                <span className="font-mono text-slate-200 font-bold">
                                  ${(product.recipeCost || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Margen Estimado:</span>
                                <span className="font-mono text-emerald-400 font-extrabold text-sm flex items-center gap-0.5">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  {product.price > 0 ? (((product.price - (product.recipeCost || 0)) / product.price) * 100).toFixed(1) : '0.0'}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'kardex' ? (
              /* Kardex Audit Log History view */
              <div className="overflow-x-auto">
                {filteredMovements.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No se han registrado movimientos de inventario. {searchTerm && 'Intente con otra búsqueda.'}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50 font-bold">
                        <th className="py-4 px-6 font-bold">Fecha / Hora</th>
                        <th className="py-4 px-6 font-bold">Insumo</th>
                        <th className="py-4 px-6 font-bold">Tipo Movimiento</th>
                        <th className="py-4 px-6 font-bold text-center">Cantidad</th>
                        <th className="py-4 px-6 font-bold text-center">Flujo de Stock</th>
                        <th className="py-4 px-6 font-bold">Costo Unitario / CPP</th>
                        <th className="py-4 px-6 font-bold">Notas / Justificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {filteredMovements.map(movement => {
                        const s = movement.supplyId || {};
                        const dateStr = movement.createdAt ? new Date(movement.createdAt).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A';

                        // Check sign based on type
                        const isAddition = ['compra'].includes(movement.type) || 
                          (movement.type === 'ajuste' && movement.newStock >= movement.previousStock);
                        
                        const quantityText = `${isAddition ? '+' : '-'}${movement.quantity.toLocaleString('es-CO')} ${s.unit || ''}`;
                        const quantityColor = isAddition ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold';

                        return (
                          <tr key={movement._id} className="hover:bg-slate-800/50 border-b border-slate-900/35 transition-all duration-200">
                            <td className="py-4 px-6 text-xs text-slate-400 font-mono">{dateStr}</td>
                            <td className="py-4 px-6 font-medium text-white">{s.name || <span className="text-slate-650 italic">Insumo Eliminado</span>}</td>
                            <td className="py-4 px-6">{getMovementTypeBadge(movement.type)}</td>
                            <td className={`py-4 px-6 text-center font-mono ${quantityColor}`}>
                              {quantityText}
                            </td>
                            <td className="py-4 px-6 text-center font-mono text-slate-300">
                              <span className="text-slate-500 text-xs">{movement.previousStock.toLocaleString('es-CO')}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600 inline-block mx-2" />
                              <span className="font-bold">{movement.newStock.toLocaleString('es-CO')}</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-300">
                              ${movement.unitCost.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / {s.unit || ''}
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400 max-w-xs truncate" title={movement.notes}>
                              {movement.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* Pedidos view */
              <div className="p-6 space-y-6">
                {ordersLoading ? (
                  <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-8 h-8 text-jj-yellow animate-spin" />
                    <span>Cargando pedidos...</span>
                  </div>
                ) : ordersError ? (
                  <div className="text-center text-red-400 py-12">
                    {ordersError}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900/20 border border-slate-800 rounded-2xl">
                    No hay pedidos activos. {searchTerm ? 'Intente con otra búsqueda.' : 'Los pedidos de clientes aparecerán aquí.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredOrders.map(order => {
                      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'N/A';

                      // Determine status colors
                      let statusBg;
                      let statusText;
                      let statusLabel;

                      switch (order.status) {
                        case 'pending':
                          statusBg = 'bg-yellow-500/10 border-yellow-500/30';
                          statusText = 'text-yellow-500';
                          statusLabel = 'Pendiente';
                          break;
                        case 'preparing':
                          statusBg = 'bg-blue-500/10 border-blue-500/30';
                          statusText = 'text-blue-500';
                          statusLabel = 'En Preparación';
                          break;
                        case 'completed':
                          statusBg = 'bg-emerald-500/10 border-emerald-500/30';
                          statusText = 'text-emerald-500';
                          statusLabel = 'Entregado/Pagado';
                          break;
                        case 'cancelled':
                          statusBg = 'bg-red-500/10 border-red-500/30';
                          statusText = 'text-red-500';
                          statusLabel = 'Cancelado';
                          break;
                        default:
                          statusBg = 'bg-slate-500/10 border-slate-500/30';
                          statusText = 'text-slate-500';
                          statusLabel = order.status;
                      }

                      return (
                        <div key={order._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-md">
                          {/* Top row */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">Cliente: {order.clientName}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusBg} ${statusText}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Pedido registrado: {dateStr}</p>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-semibold">
                              <span className="text-slate-400">
                                Tipo: <strong className="text-white">{order.orderType === 'dine_in' ? 'Para Mesa' : 'Domicilio'}</strong>
                              </span>
                              {order.orderType === 'dine_in' ? (
                                <span className="text-slate-400">
                                  Ubicación: <strong className="text-brand-yellow">{order.tableNumber || '-'}</strong>
                                </span>
                              ) : (
                                <span className="text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>Dir: <strong className="text-brand-yellow">{order.address || '-'}</strong></span>
                                  <span>Tel: <strong className="text-slate-300">{order.phone || '-'}</strong></span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items list */}
                          <div className="py-4 space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items del Pedido</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {order.items.map((item, idx) => {
                                const prod = item.productId || {};
                                return (
                                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between text-xs">
                                    <div>
                                      <p className="font-bold text-slate-200">{prod.name || 'Producto Eliminado'}</p>
                                      {item.extras && item.extras.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.extras.map((ext, eIdx) => (
                                            <span key={eIdx} className="bg-slate-900 border border-slate-800 text-[9px] font-bold text-brand-yellow px-1.5 py-0.5 rounded-md">
                                              +{ext.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-black text-brand-yellow shrink-0">x{item.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800 mt-2">
                            <div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total del Pedido</span>
                              <p className="text-sm font-black text-brand-yellow">${order.totalAmount.toLocaleString('es-CO')}</p>
                            </div>

                            {/* Actions based on state */}
                            <div className="flex items-center gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-brand-red/10"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-jj-yellow" />
                                    Aceptar Pedido
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/35 rounded-lg text-xs font-bold transition-all"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-brand-red" />
                                    Cancelar
                                  </button>
                                </>
                              )}

                              {order.status === 'preparing' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-jj-yellow" />
                                    Completar Pedido
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/35 rounded-lg text-xs font-bold transition-all"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-brand-red" />
                                    Cancelar
                                  </button>
                                </>
                              )}
                              
                              {['completed', 'cancelled'].includes(order.status) && (
                                <span className="text-xs text-slate-500 italic">
                                  {order.status === 'completed' ? 'Pedido finalizado y facturado' : 'Pedido cancelado'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Add / Edit Supply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-slideUp shadow-black/80"
            role="dialog"
            aria-labelledby="modal-title"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-jj-yellow/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 id="modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-jj-yellow" />
                {isEditing ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setFormError(''); setFormSuccess(''); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 bg-green-950/30 border border-green-500/40 text-green-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSupply} className="space-y-4">
              {/* Name field */}
              <div>
                <label htmlFor="supply-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nombre del Insumo
                </label>
                <input
                  id="supply-name"
                  type="text"
                  required
                  placeholder="Ej. Queso Mozzarella"
                  value={newSupply.name}
                  onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit field (dropdown lists Purchase Units) */}
                <div>
                  <label htmlFor="supply-unit" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Unidad de Compra
                  </label>
                  <select
                    id="supply-unit"
                    value={newSupply.unit}
                    onChange={handleUnitChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300"
                  >
                    {purchaseUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Cost price field per unit */}
                <div>
                  <label htmlFor="supply-cost" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Costo por {getUnitLabel(newSupply.unit)} ($)
                  </label>
                  <input
                    id="supply-cost"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Ej. 30000"
                    value={newSupply.costPrice}
                    onChange={(e) => setNewSupply({ ...newSupply, costPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Helper text for unit cost clarification */}
              <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
                <span>{getCostHelperText(newSupply.unit)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stock inicial field */}
                <div>
                  <label htmlFor="supply-stock" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Cantidad {isEditing ? 'Actual' : 'Inicial'} ({newSupply.unit})
                  </label>
                  <input
                    id="supply-stock"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Ej. 2"
                    value={newSupply.stock}
                    onChange={(e) => setNewSupply({ ...newSupply, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>

                {/* Min stock field */}
                <div>
                  <label htmlFor="supply-min-stock" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Mínimo Alerta ({newSupply.unit})
                  </label>
                  <input
                    id="supply-min-stock"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Ej. 1"
                    value={newSupply.minStock}
                    onChange={(e) => setNewSupply({ ...newSupply, minStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Active / Inactive toggle (Only shown when editing) */}
              {isEditing && (
                <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <label htmlFor="supply-active" className="block text-sm font-semibold text-white">
                      Insumo Activo
                    </label>
                    <span className="text-xs text-slate-500">
                      Desactivar oculta o inhabilita este insumo en recetas
                    </span>
                  </div>
                  <input
                    id="supply-active"
                    type="checkbox"
                    checked={newSupply.isActive}
                    onChange={(e) => setNewSupply({ ...newSupply, isActive: e.target.checked })}
                    className="w-5 h-5 accent-yellow-500 rounded bg-slate-950 border-slate-800 cursor-pointer focus:ring-yellow-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setFormError(''); setFormSuccess(''); }}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-brand-red/10"
                >
                  {isEditing ? 'Guardar Cambios' : 'Guardar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 relative overflow-hidden animate-slideUp shadow-black/80"
            role="dialog"
            aria-labelledby="product-modal-title"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-jj-yellow/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 id="product-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-jj-yellow" />
                {isEditingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{productFormError}</span>
              </div>
            )}

            {productFormSuccess && (
              <div className="mb-4 bg-green-950/30 border border-green-500/40 text-green-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{productFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    placeholder="Ej. Porción Pizza Jamón y Queso"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div>
                  <label htmlFor="product-category" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    id="product-category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Category Text field if 'Otro' selected */}
              {newProduct.category === 'Otro' && (
                <div className="animate-fadeIn">
                  <label htmlFor="product-custom-category" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Escribe la Nueva Categoría
                  </label>
                  <input
                    id="product-custom-category"
                    type="text"
                    required
                    placeholder="Ej. Adiciones"
                    value={newProduct.customCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, customCategory: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              )}

              {/* Row 2: Price & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Precio de Venta ($)
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    required
                    placeholder="Ej. 5000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div>
                  <label htmlFor="product-type" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tipo de Producto
                  </label>
                  <select
                    id="product-type"
                    disabled={isEditingProduct}
                    value={newProduct.type}
                    onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value, recipe: [] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300 disabled:opacity-50"
                  >
                    <option value="simple">Simple (Stock directo en tienda, ej: Gaseosas)</option>
                    <option value="composite">Compuesto / Receta (Descuenta de insumos bodega, ej: Pizzas)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="product-desc" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  id="product-desc"
                  rows="2"
                  placeholder="Ej. Porción con salsa pomodoro, doble queso mozzarella y jamón premium..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700 resize-none"
                />
              </div>

              {/* Conditional sections based on type */}
              {newProduct.type === 'simple' ? (
                /* Simple Product Fields */
                <div className="grid grid-cols-2 gap-4 bg-slate-950/20 p-4 border border-slate-800/80 rounded-xl">
                  <div>
                    <label htmlFor="product-stock" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Stock {isEditingProduct ? 'Actual' : 'Inicial'} (Unidades)
                    </label>
                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      placeholder="Ej. 50"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-min-stock" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Mínimo Alerta (Unidades)
                    </label>
                    <input
                      id="product-min-stock"
                      type="number"
                      min="0"
                      placeholder="Ej. 10"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>
              ) : (
                /* Composite Product: Recipe Builder */
                <div className="space-y-4 bg-slate-950/20 p-4 border border-slate-800/80 rounded-xl">
                  <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Armar Receta</h4>
                      <p className="text-xxs text-slate-500">Agrega los insumos que consume una porción / unidad de este producto (en unidad base de bodega)</p>
                    </div>

                    {/* Quick Cost Estimator Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xxs uppercase tracking-wider font-semibold">Costo Receta:</span>
                      <span className="font-mono text-sm font-bold text-yellow-500">
                        ${recipeStats.totalCost.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Add Ingredient Bar */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label htmlFor="recipe-select-supply" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Seleccionar Insumo de Bodega
                      </label>
                      <select
                        id="recipe-select-supply"
                        value={selectedSupplyId}
                        onChange={(e) => setSelectedSupplyId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300"
                      >
                        <option value="">-- Seleccionar Insumo --</option>
                        {availableSuppliesForRecipe.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.name} (Disponibles: {s.stock} {s.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!selectedSupplyId}
                      onClick={handleAddIngredient}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-slate-200 hover:text-white rounded-lg text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 h-[38px]"
                    >
                      <Plus className="w-4 h-4 text-yellow-500" />
                      Añadir
                    </button>
                  </div>

                  {/* Ingredients Recipe List */}
                  {newProduct.recipe.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No has añadido ingredientes a la receta aún. Selecciona un insumo arriba.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {newProduct.recipe.map((item, idx) => {
                        const qtyNum = item.quantity === '' ? 0 : Number(item.quantity);
                        const itemCost = !isNaN(qtyNum) ? qtyNum * item.costPrice : 0;
                        
                        return (
                          <div 
                            key={item.supplyId}
                            className="bg-slate-950/50 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between gap-4 animate-fadeIn"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-200 text-sm truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">Costo base: ${item.costPrice.toLocaleString('es-CO', { maximumFractionDigits: 2 })} / {item.unit}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                required
                                placeholder="Cant."
                                value={item.quantity}
                                onChange={(e) => handleRecipeQuantityChange(idx, e.target.value)}
                                className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-800"
                              />
                              <span className="text-xs text-slate-400 w-8">{item.unit}</span>
                            </div>

                            <div className="w-20 text-right font-mono text-xs text-slate-300 shrink-0">
                              ${itemCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 shrink-0 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Profitability Estimator Box */}
                  {newProduct.recipe.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 bg-slate-950/40 rounded-xl p-3 border border-slate-900/60">
                      {/* Stat Cost */}
                      <div className="text-center border-r border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Costo de Receta</span>
                        <span className="font-mono text-sm font-bold text-slate-300 mt-0.5 block">
                          ${recipeStats.totalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      {/* Stat Profit */}
                      <div className="text-center border-r border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Ganancia Est.</span>
                        <span className="font-mono text-sm font-bold text-emerald-400 mt-0.5 block flex items-center justify-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          {recipeStats.profit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      {/* Stat Margin */}
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Margen Utilidad</span>
                        <span className="font-mono text-sm font-bold text-yellow-500 mt-0.5 block flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          {recipeStats.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-brand-red/10"
                >
                  {isEditingProduct ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Inventory Movement Modal */}
      {isMovementModalOpen && selectedSupplyForMovement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-slideUp shadow-black/80"
            role="dialog"
            aria-labelledby="movement-modal-title"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 id="movement-modal-title" className="text-lg font-bold text-white flex flex-col">
                <span>Registrar Movimiento</span>
                <span className="text-xs font-semibold text-jj-yellow mt-0.5">Insumo: {selectedSupplyForMovement.name}</span>
              </h3>
              <button 
                onClick={() => { setIsMovementModalOpen(false); setMovementFormError(''); setMovementFormSuccess(''); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {movementFormError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{movementFormError}</span>
              </div>
            )}

            {movementFormSuccess && (
              <div className="mb-4 bg-green-950/30 border border-green-500/40 text-green-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{movementFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              {/* Type selector */}
              <div>
                <label htmlFor="mov-type" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tipo de Transacción
                </label>
                <select
                  id="mov-type"
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300"
                >
                  <option value="compra">Compra / Entrada (+ CPP)</option>
                  <option value="consumo">Consumo Interno / Salida (-)</option>
                  <option value="dano">Daño, Merma o Desperdicio / Salida (-)</option>
                  <option value="ajuste">Ajuste de Inventario (+ / -)</option>
                </select>
              </div>

              {/* Adjust options if type === 'ajuste' */}
              {newMovement.type === 'ajuste' && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Sentido del Ajuste:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ajuste-direction"
                        value="sumar"
                        checked={newMovement.ajusteDirection === 'sumar'}
                        onChange={(e) => setNewMovement({ ...newMovement, ajusteDirection: e.target.value })}
                        className="accent-yellow-500 cursor-pointer"
                      />
                      Sumar (+)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ajuste-direction"
                        value="restar"
                        checked={newMovement.ajusteDirection === 'restar'}
                        onChange={(e) => setNewMovement({ ...newMovement, ajusteDirection: e.target.value })}
                        className="accent-yellow-500 cursor-pointer"
                      />
                      Restar (-)
                    </label>
                  </div>
                </div>
              )}

              {/* Quantity & Unit Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mov-unit" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    id="mov-unit"
                    value={newMovement.unit}
                    onChange={handleMovementUnitChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all text-slate-300"
                  >
                    {getFilteredPurchaseUnitsForSupply(selectedSupplyForMovement.unit).map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mov-qty" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Cantidad a Registrar
                  </label>
                  <input
                    id="mov-qty"
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    placeholder="Ej. 5"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Cost Price row - ONLY for type === 'compra' */}
              {newMovement.type === 'compra' && (
                <div className="animate-fadeIn space-y-1">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label htmlFor="mov-cost" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Costo por {getUnitLabel(newMovement.unit)} ($)
                      </label>
                      <input
                        id="mov-cost"
                        type="number"
                        min="0.001"
                        step="any"
                        required
                        placeholder="Ej. 28000"
                        value={newMovement.unitCost}
                        onChange={(e) => setNewMovement({ ...newMovement, unitCost: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                    <Info className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
                    <span>{getCostHelperText(newMovement.unit)}</span>
                  </div>
                </div>
              )}

              {/* Notes / justification */}
              <div>
                <label htmlFor="mov-notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notas / Justificación
                </label>
                <textarea
                  id="mov-notes"
                  rows="2"
                  required
                  placeholder="Ej. Factura proveedor #304, Conteo de inventario fin de mes, Queso crema vencido..."
                  value={newMovement.notes}
                  onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsMovementModalOpen(false); setMovementFormError(''); setMovementFormSuccess(''); }}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-brand-red/10"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Purchase Modal */}
      {isBatchPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 relative overflow-hidden flex flex-col max-h-[90vh] animate-slideUp shadow-black/80">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-jj-yellow" />
                Registrar Factura de Compra (Lote)
              </h3>
              <button 
                onClick={() => setIsBatchPurchaseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchPurchaseError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{batchPurchaseError}</span>
              </div>
            )}

            {batchPurchaseSuccess && (
              <div className="mb-4 bg-green-950/30 border border-green-500/40 text-green-200 rounded-lg p-3 text-sm flex items-start gap-2 shrink-0">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{batchPurchaseSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBatchPurchase} className="flex-1 flex flex-col min-h-0">
              {/* Notes Input */}
              <div className="mb-4 shrink-0">
                <label htmlFor="batch-notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notas de la Factura (ej. Factura Nº 887, Distribuidora S.A.)
                </label>
                <input
                  id="batch-notes"
                  type="text"
                  required
                  placeholder="Ej. Factura #887 - Proveedor de Quesos y Carnes"
                  value={batchPurchaseNotes}
                  onChange={(e) => setBatchPurchaseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-705"
                />
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/30 p-4 mb-4 min-h-[200px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/30 font-bold">
                      <th className="pb-2 pt-2 pl-2 pr-4 font-bold">Insumo</th>
                      <th className="pb-2 pt-2 pr-4 font-bold w-24">Cantidad</th>
                      <th className="pb-2 pt-2 pr-4 font-bold w-32">Unidad</th>
                      <th className="pb-2 pt-2 pr-4 font-bold w-32">Costo Total ($)</th>
                      <th className="pb-2 pt-2 text-center w-12 font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchPurchaseItems.map((item, idx) => {
                      const selectedSupply = supplies.find(s => s._id === item.supplyId);
                      const baseUnit = selectedSupply ? selectedSupply.unit : 'g';
                      const filteredUnits = getFilteredPurchaseUnitsForSupply(baseUnit);

                      return (
                        <tr key={idx} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-all">
                          <td className="py-2 pr-4">
                            <select
                              value={item.supplyId}
                              required
                              onChange={(e) => handleBatchPurchaseItemChange(idx, 'supplyId', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-yellow-500 outline-none text-slate-300"
                            >
                              <option value="">-- Seleccionar Insumo --</option>
                              {supplies.filter(s => s.isActive).map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.stock} {s.unit})</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              required
                              value={item.quantity}
                              onChange={(e) => handleBatchPurchaseItemChange(idx, 'quantity', e.target.value)}
                              placeholder="Cant."
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-center font-mono focus:border-yellow-500 outline-none"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <select
                              value={item.purchaseUnit}
                              required
                              disabled={!item.supplyId}
                              onChange={(e) => handleBatchPurchaseItemChange(idx, 'purchaseUnit', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-yellow-500 outline-none text-slate-300 disabled:opacity-50"
                            >
                              {filteredUnits.map(u => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.totalCost}
                              onChange={(e) => handleBatchPurchaseItemChange(idx, 'totalCost', e.target.value)}
                              placeholder="Costo total"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono focus:border-yellow-500 outline-none"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchPurchaseRow(idx)}
                              disabled={batchPurchaseItems.length === 1}
                              className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title="Remover Fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Row: Add button & total summary */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl mb-4 shrink-0">
                <button
                  type="button"
                  onClick={handleAddBatchPurchaseRow}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-yellow-500" />
                  Añadir Fila / Item
                </button>
                <div className="flex items-center justify-end gap-3 text-right">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Factura:</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ${batchPurchaseItems.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBatchPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-brand-red/10"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical Count Adjustment Modal */}
      {isPhysicalCountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 relative overflow-hidden flex flex-col max-h-[90vh] animate-slideUp shadow-black/80" role="dialog">
            <div className="absolute top-0 right-0 w-48 h-48 bg-jj-yellow/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex flex-col">
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-jj-yellow" />
                  Auditoría / Conteo Físico de Inventario
                </span>
                <span className="text-xs font-normal text-slate-400 mt-0.5">Realice el cuadre de bodega e ingrese la cantidad real encontrada</span>
              </h3>
              <button 
                onClick={() => setIsPhysicalCountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {physicalCountError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{physicalCountError}</span>
              </div>
            )}

            {physicalCountSuccess && (
              <div className="mb-4 bg-green-950/30 border border-green-500/40 text-green-200 rounded-lg p-3 text-sm flex items-start gap-2 shrink-0">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{physicalCountSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPhysicalCount} className="flex-1 flex flex-col min-h-0">
              {/* Notes Input */}
              <div className="mb-4 shrink-0">
                <label htmlFor="count-notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Justificación / Notas del Ajuste (ej. Conteo fin de mes, Auditoría semanal)
                </label>
                <input
                  id="count-notes"
                  type="text"
                  required
                  placeholder="Ej. Cuadre físico semanal de bodega - Ajuste por discrepancias"
                  value={physicalCountNotes}
                  onChange={(e) => setPhysicalCountNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              {/* Table of active supplies */}
              <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/30 p-4 mb-4 min-h-[200px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/30 font-bold">
                      <th className="pb-2 pt-2 pl-2 font-bold">Insumo</th>
                      <th className="pb-2 pt-2 text-center w-24 font-bold">U. Base</th>
                      <th className="pb-2 pt-2 text-center w-36 font-bold">Stock Sistema</th>
                      <th className="pb-2 pt-2 text-center w-40 font-bold">Conteo Físico Real</th>
                      <th className="pb-2 pt-2 text-center w-36 font-bold">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {supplies.filter(s => s.isActive).map(supply => {
                      const countVal = physicalCounts[supply._id];
                      let diffText = '-';
                      let diffColor = 'text-slate-500';

                      if (countVal !== '' && countVal !== undefined && !isNaN(Number(countVal))) {
                        const diffNum = Number(countVal) - supply.stock;
                        if (diffNum > 0) {
                          diffText = `+${diffNum.toLocaleString('es-CO')}`;
                          diffColor = 'text-green-400 font-bold';
                        } else if (diffNum < 0) {
                          diffText = `${diffNum.toLocaleString('es-CO')}`;
                          diffColor = 'text-red-400 font-bold';
                        } else {
                          diffText = '0';
                          diffColor = 'text-slate-300';
                        }
                      }

                      return (
                        <tr key={supply._id} className="hover:bg-slate-800/20 border-b border-slate-900/35 transition-all">
                          <td className="py-2.5 font-medium text-white">{supply.name}</td>
                          <td className="py-2.5 text-center text-slate-400 text-xs">{supply.unit}</td>
                          <td className="py-2.5 text-center font-mono text-slate-300 text-xs">
                            {supply.stock.toLocaleString('es-CO')}
                          </td>
                          <td className="py-2.5 text-center px-4">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={countVal}
                              onChange={(e) => handlePhysicalCountChange(supply._id, e.target.value)}
                              placeholder="Sin cambios"
                              className="w-full max-w-[140px] mx-auto bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-center font-mono text-xs focus:border-jj-yellow outline-none"
                            />
                          </td>
                          <td className={`py-2.5 text-center font-mono text-xs ${diffColor}`}>
                            {diffText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary of discrepant lines count */}
              <div className="bg-slate-950/40 p-3 border border-slate-800 rounded-xl mb-4 text-xs text-slate-400 flex items-center justify-between shrink-0">
                <span>
                  Solo los insumos con un valor diferente al del sistema serán actualizados en la base de datos.
                </span>
                <span className="font-semibold text-slate-350">
                  Ajustes a aplicar: <strong className="text-jj-yellow font-bold">
                    {Object.keys(physicalCounts).filter(id => {
                      const val = physicalCounts[id];
                      const supply = supplies.find(s => s._id === id);
                      return val !== '' && val !== undefined && supply && Number(val) !== supply.stock;
                    }).length}
                  </strong>
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPhysicalCountModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-brand-red/10"
                >
                  Aplicar Ajustes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
