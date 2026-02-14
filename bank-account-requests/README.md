# Gestión de Solicitudes de Cuentas Bancarias

Aplicación Angular 17 con PrimeNG para gestionar solicitudes de cuentas bancarias con descarga de archivos ZIP.

## Características

### 📋 Tab 1: Nueva Solicitud
- Formulario reactivo con validaciones
- Ingreso múltiple de números de cuenta (chips)
- Selector de rango de fechas con validaciones:
  - Fecha inicial menor a fecha final
  - Rango máximo de 1 año
  - Fechas entre 2020 y hoy
- Notificaciones toast para feedback

### 📊 Tab 2: Estado de Solicitudes
- Tabla con paginación (5, 10, 20, 50 registros)
- Buscador en tiempo real (por ID o número de cuenta)
- Botón de actualización manual
- Auto-refresh cada 5 segundos para solicitudes pendientes
- Expansión de filas para ver detalles de errores

### Estados de Solicitud
- **PENDING**: Solicitud en cola
- **PROCESSING**: Procesando solicitudes
- **SUCCESS**: Completado exitosamente
- **PARTIAL_SUCCESS**: Algunas cuentas exitosas, otras fallidas
- **FAILED**: Solicitud fallida completamente

### Tipos de Error
- **EXCESSIVE_MOVEMENTS**: Más de 3 millones de movimientos
- **PROCESSING_ERROR**: Error en el procesamiento
- **TIMEOUT**: Tiempo de espera agotado
- **INVALID_ACCOUNT**: Cuenta inválida

### 🔐 Seguridad y UX
- Confirmación antes de descargar archivos ZIP
- Descarga individual por cuenta en caso de éxito parcial
- Indicadores visuales claros (tags de colores)
- Mensajes de error descriptivos

## Arquitectura con Signals

La aplicación utiliza **Angular Signals** para gestión de estado reactivo:

```typescript
// Servicio con Signals
private requestsSignal = signal<AccountRequest[]>([]);
requests = this.requestsSignal.asReadonly();

// Computed signals
pendingRequests = computed(() => 
  this.requestsSignal().filter(req => req.status === RequestStatus.PENDING)
);
```

### Ventajas de Signals
- ✅ Rendimiento optimizado (fine-grained reactivity)
- ✅ Simplicidad en el código
- ✅ Detección de cambios automática
- ✅ Composición con `computed()`

## Tecnologías

- **Angular 17** - Framework standalone components
- **PrimeNG** - Librería UI (TabView, Table, Calendar, etc.)
- **TypeScript** - Tipado estático
- **RxJS** - Programación reactiva
- **SCSS** - Estilos

## Instalación

```bash
cd bank-account-requests
npm install
```

## Desarrollo

```bash
npm start
```

Navegar a `http://localhost:4200/`

## Configuración del Backend

Actualizar la URL del backend en:

```typescript
// src/app/services/account-request.service.ts
private readonly apiUrl = 'http://localhost:8080/api/account-requests';
```

## Estructura del Proyecto

```
src/app/
├── models/
│   └── account-request.model.ts    # Interfaces y enums
├── services/
│   └── account-request.service.ts   # Servicio con Signals
├── components/
│   ├── request-form/                # Formulario de solicitud
│   └── request-status/              # Tabla de estado
└── app.ts                           # Componente principal con tabs
```

## API Backend Esperada

### POST /api/account-requests
```json
{
  "accountNumbers": ["123456", "789012"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "accountNumbers": ["123456", "789012"],
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "results": []
  }
}
```

### GET /api/account-requests
Lista todas las solicitudes

### GET /api/account-requests/:id
Obtiene una solicitud específica con resultados:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PARTIAL_SUCCESS",
    "results": [
      {
        "accountNumber": "123456",
        "status": "SUCCESS",
        "downloadUrl": "/download/123456.zip"
      },
      {
        "accountNumber": "789012",
        "status": "FAILED",
        "errorType": "EXCESSIVE_MOVEMENTS",
        "errorMessage": "La cuenta tiene más de 3 millones de movimientos"
      }
    ]
  }
}
```

### GET /api/account-requests/:id/download
Descarga ZIP completo

### GET /api/account-requests/:id/download/:accountNumber
Descarga ZIP de cuenta específica

## Funcionalidades Implementadas

- ✅ Formulario reactivo con validaciones
- ✅ Validación de fechas personalizada
- ✅ Gestión de estado con Signals
- ✅ Tabla con paginación
- ✅ Filtros de búsqueda
- ✅ Auto-refresh de solicitudes pendientes
- ✅ Confirmación de descarga
- ✅ Notificaciones toast
- ✅ Descarga de archivos ZIP
- ✅ Manejo de errores detallado
- ✅ Diseño responsive

## Building

```bash
ng build
```

Los archivos se generarán en `dist/`

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.0.
