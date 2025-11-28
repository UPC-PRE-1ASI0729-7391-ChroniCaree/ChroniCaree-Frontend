# Requisitos del Backend para ChroniCare Frontend

Este documento detalla los endpoints y estructuras de datos que el Frontend espera para completar los flujos de Registro y Login.

## 1. Configuración Base
- **Base URL**: `/api/v1`
- **CORS**: Debe permitir peticiones desde `http://localhost:4200` (o el dominio de producción).

## 2. Autenticación (IAM)

### 2.1 Registro (`POST /api/v1/authentication/sign-up`)
El frontend envía datos básicos para crear el usuario (Identity).

**Payload (Paciente):**
```json
{
  "email": "paciente@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Perez",
  "role": "patient"
}
```

**Payload (Hospital/Tenant):**
```json
{
  "email": "admin@hospital.com",
  "password": "password123",
  "name": "Admin Name",
  "role": "hospital_admin"
}
```

**Respuesta Esperada:**
Debe devolver el objeto usuario creado, conteniendo al menos el `id`.
```json
{
  "id": 1,
  "email": "...",
  "role": "..."
}
```

### 2.2 Login (`POST /api/v1/authentication/sign-in`)
**Payload:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta Esperada:**
```json
{
  "accessToken": "jwt-token...",
  "refreshToken": "refresh-token...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "patient"
  }
}
```

## 3. Tenants (Hospitales)

### 3.1 Crear Tenant (`POST /api/v1/tenants`)
Se llama inmediatamente después de crear el usuario y hacer login.

**Payload:**
```json
{
  "adminUserId": 1,
  "name": "Hospital Central",
  "email": "admin@hospital.com",
  "address": "Av. Principal 123",
  "phone": "555-0101",
  "status": "pending_subscription",
  "subscriptionId": null,
  "registrationDate": "2025-11-27T...",
  "settings": {
    "allowIndependentDoctors": false,
    "requirePatientApproval": true,
    "maxDoctors": 10
  }
}
```

**Respuesta Esperada:**
Objeto Tenant creado con su `id`.

## 4. Pacientes

### 4.1 Crear Paciente (`POST /api/v1/patients`)
Se llama inmediatamente después de crear el usuario y hacer login.

**Payload:**
```json
{
  "userId": 1,
  "firstName": "Juan",
  "lastName": "Perez",
  "dni": "12345678",
  "birthDate": "1990-01-01",
  "gender": "male",
  "phone": "555-9999",
  "address": "Calle Falsa 123",
  "emergencyContact": {
    "name": "",
    "relationship": "",
    "phone": ""
  }
}
```

**Respuesta Esperada:**
Objeto Patient creado con su `id`.

## 5. Suscripciones

### 5.1 Obtener Plan (`GET /api/v1/subscriptionPlans/{id}`)
Para validar el plan seleccionado.

### 5.2 Crear Suscripción (`POST /api/v1/subscriptions`)
Si el usuario seleccionó un plan de pago.

**Payload:**
```json
{
  "planId": 1,
  "payerType": "tenant", // o "patient"
  "payerId": 1, // ID del Tenant o Patient
  "paymentMethod": "credit_card",
  "billingEmail": "email@example.com",
  "autoRenew": true
}
```

## 6. Doctores (Opcional en Registro)
### 6.1 Listar Doctores (`GET /api/v1/doctors`)
El frontend intenta asignar un doctor automáticamente al registrar un paciente. Si falla, el registro continúa sin doctor asignado.
