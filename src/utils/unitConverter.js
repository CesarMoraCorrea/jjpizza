export const purchaseUnits = [
  { value: 'g', label: 'Gramo (g)', baseUnit: 'g', factor: 1 },
  { value: 'kg', label: 'Kilo (kg)', baseUnit: 'g', factor: 1000 },
  { value: 'lb', label: 'Libra (lb)', baseUnit: 'g', factor: 500 },
  { value: 'ml', label: 'Mililitro (ml)', baseUnit: 'ml', factor: 1 },
  { value: 'L', label: 'Litro (L)', baseUnit: 'ml', factor: 1000 },
  { value: 'und', label: 'Unidad (und)', baseUnit: 'und', factor: 1 }
];

/**
 * Convierte una cantidad de unidad de compra a su equivalente en unidad base.
 * Ej. 2 Kilos -> 2000 gramos.
 */
export const convertToBase = (quantity, purchaseUnit) => {
  const unit = purchaseUnits.find(u => u.value === purchaseUnit);
  if (!unit) return Number(quantity || 0);
  return Number(quantity || 0) * unit.factor;
};

/**
 * Calcula el costo unitario basado en la unidad base.
 * Ej. Si 1 Kilo (1000g) cuesta $30,000 -> Retorna $30 por gramo.
 * Ej. Si 1 Libra (500g) cuesta $10,000 -> Retorna $20 por gramo.
 */
export const calculateBaseCost = (purchaseUnitCost, purchaseUnit) => {
  const unit = purchaseUnits.find(u => u.value === purchaseUnit);
  if (!unit || unit.factor === 0) return Number(purchaseUnitCost || 0);
  return Number(purchaseUnitCost || 0) / unit.factor;
};

/**
 * Determina cuál es la unidad base correspondiente a una unidad de compra.
 * Ej. Kilo (kg) -> gramos (g).
 */
export const determineBaseUnit = (purchaseUnit) => {
  const unit = purchaseUnits.find(u => u.value === purchaseUnit);
  return unit ? unit.baseUnit : 'und';
};

/**
 * Devuelve el factor de conversión de una unidad de compra.
 */
export const getConversionFactor = (purchaseUnit) => {
  const unit = purchaseUnits.find(u => u.value === purchaseUnit);
  return unit ? unit.factor : 1;
};
