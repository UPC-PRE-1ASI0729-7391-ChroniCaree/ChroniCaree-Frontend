# ChroniCaree Frontend - Guía de Inicio

## 🚀 Configuración Inicial

### Prerrequisitos
- Node.js v18+ instalado
- npm v9+ instalado

### Instalación de Dependencias

```powershell
npm install
```

## 📦 Scripts Disponibles

### Opción 1: Iniciar con comandos separados (Recomendado)

**Terminal 1 - Servidor Fake API:**
```powershell
npm run api
```
Esto inicia json-server en el puerto 3000 con la base de datos en `server/db.json`

**Terminal 2 - Aplicación Angular:**
```powershell
npm start
```
Esto inicia la aplicación en http://localhost:4200

### Opción 2: Iniciar todo junto (Alternativa)
```powershell
npm run dev
```
Inicia ambos servicios simultáneamente en una sola terminal (requiere `concurrently`)

## 🏥 Estructura del Proyecto

```
ChroniCaree-Frontend/
├── server/
│   ├── db.json          # Base de datos fake con datos de prueba
│   └── routes.json      # Rutas del API (mapeo /api/v1/* a /*)
├── src/
│   ├── app/
│   │   ├── tenants/     # Bounded Context: Tenants
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── application/
│   │   └── shared/      # Código compartido
│   ├── environments/    # Configuración de ambientes
│   └── styles.css       # Estilos globales con paleta de colores
```

## 🎨 Paleta de Colores

La aplicación utiliza las siguientes variables CSS:

- **Verde Principal**: `--color-cc-green: #26B5A6`
- **Verde Oscuro**: `--color-cc-bold-green: #36837B`
- **Rojo**: `--color-cc-red: #E63946`
- **Azul Oscuro**: `--color-cc-dark-blue: #1A2A33`
- **Fondo**: `--color-background: #F5F5F5`
- **Muted**: `--color-muted: #CCD0DA`

## 🔧 Configuración del API

El archivo `environment.ts` y `environment.development.ts` contienen:

```typescript
export const environment = {
  production: false, // true en production
  apiBaseUrl: 'http://localhost:3000/api/v1'
};
```

Para cambiar la URL del API (por ejemplo, cuando despliegues tu fake API), solo cambia `apiBaseUrl`.

## 📊 Base de Datos JSON

El archivo `server/db.json` contiene datos de prueba para:
- Users
- Tenants (Hospitales/Clínicas)
- Patients
- Doctors
- Symptoms
- Medications
- Devices
- Messages
- Alerts
- Diagnoses
- Treatment Plans

## 🌐 API Endpoints

El servidor JSON expone los siguientes endpoints:

- `GET http://localhost:3000/api/v1/users`
- `GET http://localhost:3000/api/v1/tenants`
- `GET http://localhost:3000/api/v1/patients`
- `GET http://localhost:3000/api/v1/doctors`
- Y más...

## 🏗️ Arquitectura

### Bounded Context Example (Tenants)

```
tenants/
├── domain/
│   └── model/
│       └── tenant.entity.ts      # Entidad del dominio
├── infrastructure/
│   ├── tenant.resource.ts        # DTO del API
│   ├── tenant.assembler.ts       # Conversión Resource ↔ Entity
│   └── tenant-api.endpoint.ts    # Endpoint del API
└── application/
    └── tenant.service.ts          # Servicio de aplicación
```

### Base Classes

El proyecto incluye clases base reutilizables:

- `BaseEntity`: Interface para entidades con ID
- `BaseResource`: Interface para DTOs del API
- `BaseAssembler`: Interface para conversores
- `BaseApiEndpoint`: Clase abstracta con operaciones CRUD

## 🎯 Próximos Pasos

1. ✅ Servidor JSON configurado
2. ✅ Página principal creada
3. ✅ Estilos globales definidos
4. ✅ Environment configurado
5. ✅ Primer Bounded Context (Tenants) implementado

### Para comenzar con un nuevo Bounded Context:

1. Crear estructura de carpetas (domain, infrastructure, application)
2. Definir entidad en `domain/model/`
3. Crear resource en `infrastructure/`
4. Implementar assembler en `infrastructure/`
5. Crear endpoint en `infrastructure/` extendiendo `BaseApiEndpoint`
6. Crear servicio en `application/`

## 📝 Notas Importantes

- El servidor JSON debe estar corriendo para que la aplicación funcione correctamente
- La página principal muestra el nombre del hospital obtenido de `db.json` (ID: 1)
- Si ves un error de conexión, verifica que json-server esté corriendo en el puerto 3000

## 🚀 Deploy

Cuando despliegues tu fake API:

1. Actualiza `apiBaseUrl` en `environment.ts`
2. Ejemplo: `apiBaseUrl: 'https://tu-api-deployada.com/api/v1'`
3. Rebuild la aplicación: `npm run build`

---

**¡Listo para comenzar el desarrollo de ChroniCaree! 🏥💚**
