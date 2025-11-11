# ChroniCaree Platform

Plataforma de gestión de salud crónica con sistema de suscripciones y pagos integrados vía Stripe.

## 🚀 Inicio Rápido

### 1. Backend (JSON Server)
```bash
cd server
npm install  # Solo primera vez
npm start
```
Backend: `http://localhost:3000`

### 2. Frontend (Angular)
```bash
npm install  # Solo primera vez
npm start
```
Aplicación: `http://localhost:4200`

## 👥 Usuarios de Prueba

### Paciente
- Email: `ana@b2c.com`
- Password: `password123`

### Hospital Admin
- Email: `admin1@hospital1.com`
- Password: `password123`

### Doctor
- Email: `dr.maria@hospital1.com`
- Password: `password123`

## 💳 Tarjeta de Prueba Stripe
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura (ej: 12/25)
- CVC: Cualquier 3 dígitos (ej: 123)
- Nombre: Cualquier nombre

## 📋 Flujos de Uso

### Registro de Paciente (3 Pasos Integrados)
1. Ir a `/iam/register` y seleccionar "Soy Paciente"
2. **Paso 1:** Información de Cuenta (email, contraseña)
3. **Paso 2:** Datos Personales (nombre, DNI, dirección, etc.)
4. **Paso 3:** Selección de Plan
   - **Gratuito** ($0) → Activación automática, redirige al dashboard
   - **Estándar** ($19.99) → Redirige a pago con Stripe
   - **Premium** ($49.99) → Redirige a pago con Stripe
5. **Todo en una sola vista** - Sin salir del proceso de registro

### Registro de Hospital (3 Pasos Integrados)
1. Ir a `/iam/register` y seleccionar "Soy Hospital/Clínica"
2. **Paso 1:** Información de Cuenta del Admin (nombre, email, contraseña)
3. **Paso 2:** Datos del Hospital (nombre, dirección, teléfono)
4. **Paso 3:** Selección de Plan Empresarial
   - **Basic** ($299/mes) → 5 doctores, 100 pacientes
   - **Professional** ($599/mes) → 20 doctores, 500 pacientes
   - **Enterprise** ($999/mes) → Ilimitado
5. Redirige a `/hospital/subscription` para completar pago
6. **Todo en una sola vista** - Sin salir del proceso de registro

### Gestionar Suscripción (Paciente)
1. Login como paciente
2. Ir a `/patient/subscription`
3. Ver plan actual
4. Cambiar o renovar plan

### Gestionar Suscripción (Hospital)
1. Login como admin del hospital
2. Ir a `/hospital/subscription`
3. Ver plan actual del hospital
4. Cambiar o renovar plan empresarial

## 💰 Planes Disponibles

### Para Pacientes (B2C)
| Plan | Precio | Características |
|------|--------|-----------------|
| **Gratuito** | $0/mes | Acceso a doctores L-V 24/7, Seguimiento básico |
| **Estándar** ⭐ | $19.99/mes | Todo lo anterior + 24/7 todos los días + Visitas domicilio |
| **Premium** | $49.99/mes | Todo + Reportes IA + Especialistas + Familia (5 miembros) |

### Para Hospitales (B2B)
| Plan | Precio | Características |
|------|--------|-----------------|
| **Basic** | $299/mes | 5 doctores, 100 pacientes, Analytics básico |
| **Professional** | $599/mes | 20 doctores, 500 pacientes, Analytics avanzado, API |
| **Enterprise** | $999/mes | Ilimitado, White label, Integraciones personalizadas |

## 🏗️ Arquitectura

### Bounded Contexts (DDD)
- **IAM**: Autenticación y usuarios
- **Patients**: Gestión de pacientes
- **Doctors**: Gestión de doctores
- **Tenants**: Gestión de hospitales/clínicas
- **Subscriptions**: Planes y suscripciones
- **Payments**: Procesamiento de pagos con Stripe
- **Clinical**: Síntomas y diagnósticos
- **Communication**: Mensajes y notificaciones
- **Devices**: Dispositivos IoT médicos
- **Medications**: Medicamentos y prescripciones

### Tecnologías
- **Frontend**: Angular 17+ (Standalone Components, Signals)
- **Backend**: JSON Server (Mock API)
- **Pagos**: Stripe Elements v3
- **Estilos**: CSS custom con variables
- **Estado**: Signals + Stores

## 🔐 Seguridad
- Datos de tarjeta procesados por Stripe (PCI compliant)
- Nunca se almacenan datos de tarjeta en el servidor
- Tokens de pago de un solo uso
- Validación de tarjetas en tiempo real

## 📁 Estructura del Proyecto
```
src/app/
├── iam/                    # Autenticación
├── patients/               # Pacientes
│   └── presentation/views/patient-subscription/
├── tenants/                # Hospitales
│   └── presentation/views/hospital-subscription/
├── payments/               # Sistema de pagos
│   ├── domain/
│   ├── infrastructure/
│   └── application/
├── subscriptions/          # Suscripciones
└── shared/                 # Componentes compartidos

server/
├── db.json                 # Base de datos mock
└── routes.json             # Rutas personalizadas
```

## 🎯 Características Clave
- ✅ Registro automático con selección de plan
- ✅ Pagos seguros con Stripe
- ✅ Plan gratuito sin tarjeta
- ✅ Multi-tenant (hospitales independientes)
- ✅ Roles: Paciente, Doctor, Admin Hospital
- ✅ DDD + Clean Architecture
- ✅ Responsive design
- ✅ Signals para reactividad

## 🐛 Solución de Problemas

### Error: "Stripe.js no está cargado"
- Verificar que el script esté en `src/index.html`:
  ```html
  <script src="https://js.stripe.com/v3/"></script>
  ```

### Error: "No se encontró el hospital/paciente"
- Asegurarse de haber completado el registro
- Verificar que el usuario esté en localStorage

### Backend no responde
- Verificar que JSON Server esté corriendo en puerto 3000
- Revisar `server/db.json` existe

## 📝 Notas de Desarrollo
- Los doctores NO se registran públicamente
- Los doctores son creados por los admins de hospitales
- Solo hay 2 tipos de registro: Paciente y Hospital
- Cada hospital es un tenant independiente

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

