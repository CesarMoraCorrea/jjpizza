# 🍕 JJ Pizza - Client Menu & POS Management System

Interfaz Web interactiva, moderna y receptiva orientada a la experiencia de compra de los clientes, monitoreo en vivo para la cocina (KDS) y administración de punto de venta (POS) de **JJ PIZZA**.

---

## 🚀 Descripción del Proyecto

El frontend de **JJ PIZZA** conecta en tiempo real la carta digital con el control de inventario y la caja registradora. Diseñado con una interfaz oscura de alto contraste y legibilidad, permite una navegación fluida por categorías para los clientes, a la vez que proporciona paneles de control protegidos por roles para el personal operativo y administrativo.

---

## ✨ Características UI/UX Principales

1. **Sistema de Diseño Premium Oscuro**:
   - Paleta cromática coordinada: Fondo Piedra Oscura (`#141414` / `#1A1A1A`), Títulos y Destacados en Amarillo Mostaza (`#FFD700`), Tarjetas y Botones de Acción en Rojo Carmesí (`#8B1E1E`).
   - Tipografía Sans-serif moderna de alta legibilidad y micro-animaciones en interacciones.
2. **Navegación Jerárquica por Categorías**:
   - Tarjetas de categorías principales (Pizzas, Lasagnas, Hamburguesas, Perros, Salchifrancesas, Maicitos, Colitas Cubanas, Bebidas, Adicionales).
   - Verificación visual de stock en tiempo real (oculta o marca productos agotados automáticamente).
   - Modalidades de pedido: En Mesa, Para Llevar y Domicilio (integración directa con WhatsApp).
3. **Tablero KDS en Vivo para Cocina**:
   - Columnas Kanban sincronizadas en tiempo real (`Pendientes` $\rightarrow$ `En Preparación` $\rightarrow$ `Listos / Entregados`).
   - Cálculo automático de tiempo transcurrido por comanda.
4. **Módulo POS / Caja Integrado**:
   - **Venta Directa POS**: Selección rápida para clientes de mostrador.
   - **Cuentas por Cobrar**: Filtro automático de pedidos pendientes con alertas destacadas para pedidos servidos en mesa (`🪑 Mesa X - Servido / Pendiente de Cobro`).
   - **Calculadora de Vueltas**: Conteo rápido de efectivo recibido y cambio.
   - **Arqueo y Cierre Diario Auditado**: Conciliación de dinero esperado vs. dinero real contado con generación de comprobante térmico imprimible (`window.print()`).

---

## 🧰 Tecnologías Utilizadas

- **Core**: React 18 & Vite
- **Estilos**: Tailwind CSS & Vanilla CSS
- **Iconografía**: Lucide React
- **Peticiones HTTP**: Axios con interceptores JWT
- **WebSockets**: Socket.io-client
- **Enrutamiento**: HTML5 History API & Manejo Dinámico de Rutas RBAC

---

## 📥 Guía de Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/CesarMoraCorrea/jjpizza.git
cd jjpizza
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Cree un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:
```bash
cp .env.example .env
```

Ajuste las URLs de la API Backend:
```env
VITE_API_URL=http://localhost:5000/api/inventory
VITE_API_URL_ORDERS=http://localhost:5000/api/orders
VITE_API_URL_AUTH=http://localhost:5000/api/auth
VITE_API_URL_SHIFTS=http://localhost:5000/api/shifts
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación web se ejecutará en `http://localhost:5173`.

---

## 🔗 Repositorio Backend API

Consulte el servidor de base de datos, lógica de negocio y conectores REST en:
👉 [JJ Pizza - Backend Repository](https://github.com/CesarMoraCorrea/jjpizzaback)
