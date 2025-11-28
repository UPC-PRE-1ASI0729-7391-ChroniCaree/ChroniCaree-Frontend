# Especificaciones de Bounded Contexts para el Backend de ChroniCare

Este documento define los requisitos funcionales, de dominio y de infraestructura para cada Bounded Context del sistema, alineados con la arquitectura del Frontend existente.

---

## 1. IAM (Identity and Access Management)
**Responsabilidad:** Gestión de identidades, autenticación y autorización.

### Entidades Principales
*   **User**: `id`, `email`, `password` (hashed), `role` (PATIENT, DOCTOR, HOSPITAL_ADMIN), `isVerified`.
*   **RefreshToken**: `token`, `expiryDate`, `user`.

### Endpoints Requeridos
*   `POST /api/v1/authentication/sign-up`: Registro de nuevos usuarios.
*   `POST /api/v1/authentication/sign-in`: Inicio de sesión (retorna Access + Refresh Token).
*   `POST /api/v1/authentication/refresh`: Rotación de tokens.
*   `POST /api/v1/authentication/logout`: Revocación de sesión.

### Reglas de Negocio
1.  **Unicidad**: El email debe ser único en todo el sistema.
2.  **Roles**: Un usuario tiene un único rol principal en el registro.
3.  **Seguridad**: Contraseñas deben ser hasheadas (BCrypt). Tokens JWT deben tener tiempo de vida corto (ej. 15 min).

---

## 2. Tenants (Gestión de Hospitales)
**Responsabilidad:** Gestión de organizaciones médicas (Hospitales/Clínicas) que agrupan doctores y pacientes.

### Entidades Principales
*   **Tenant**: `id`, `name`, `adminUserId` (FK), `subscriptionId`, `status` (ACTIVE, PENDING, SUSPENDED), `settings` (JSON).

### Endpoints Requeridos
*   `POST /api/v1/tenants`: Crear nuevo hospital (vinculado al usuario admin).
*   `GET /api/v1/tenants/{id}`: Obtener perfil del hospital.
*   `PATCH /api/v1/tenants/{id}`: Actualizar datos o configuración.

### Reglas de Negocio
1.  **Vinculación**: Un `HOSPITAL_ADMIN` gestiona un único Tenant principal.
2.  **Configuración**: El campo `settings` controla reglas como `maxDoctors`, `requirePatientApproval`.
3.  **Estado**: Un tenant recién creado nace en estado `PENDING` hasta que se confirma su suscripción.

---

## 3. Patients (Gestión de Pacientes)
**Responsabilidad:** Perfiles de pacientes e información demográfica.

### Entidades Principales
*   **Patient**: `id`, `userId` (FK), `firstName`, `lastName`, `dni`, `birthDate`, `gender`, `emergencyContact` (Value Object), `tenantId` (FK, opcional), `assignedDoctorId` (FK, opcional).

### Endpoints Requeridos
*   `POST /api/v1/patients`: Crear perfil de paciente.
*   `GET /api/v1/patients/profile`: Obtener perfil del usuario logueado.
*   `PATCH /api/v1/patients/{id}`: Actualizar datos médicos básicos (peso, altura).

### Reglas de Negocio
1.  **Perfil Único**: Un `User` con rol `PATIENT` tiene un único perfil `Patient`.
2.  **Afiliación**: Un paciente puede ser independiente o pertenecer a un `Tenant` (Hospital).

---

## 4. Doctors (Gestión de Doctores)
**Responsabilidad:** Perfiles profesionales de salud y gestión de staff.

### Entidades Principales
*   **Doctor**: `id`, `userId` (FK), `firstName`, `lastName`, `specialty`, `licenseNumber`, `tenantId` (FK, opcional), `isIndependent`.

### Endpoints Requeridos
*   `GET /api/v1/doctors`: Listar doctores (con filtros por especialidad/tenant).
*   `POST /api/v1/doctors`: Onboarding de doctores.
*   `GET /api/v1/doctors/{id}/patients`: Listar pacientes asignados.

### Reglas de Negocio
1.  **Licencia**: El número de licencia médica es obligatorio y único.
2.  **Capacidad**: Si pertenece a un Tenant, debe respetar el límite de doctores del plan del Tenant.

---

## 5. Clinical (Historia Clínica)
**Responsabilidad:** Registro de síntomas, diagnósticos y evolución clínica.

### Entidades Principales
*   **Symptom**: `id`, `patientId`, `type`, `severity`, `timestamp`, `notes`.
*   **Diagnosis**: `id`, `patientId`, `doctorId`, `diseaseName`, `status` (CONFIRMED, SUSPECTED), `date`.

### Endpoints Requeridos
*   `POST /api/v1/symptoms`: Paciente registra síntomas.
*   `GET /api/v1/symptoms`: Historial de síntomas.
*   `POST /api/v1/diagnoses`: Doctor registra diagnóstico.

### Reglas de Negocio
1.  **Inmutabilidad**: Los registros clínicos históricos no deben modificarse, solo anularse o agregar nuevos.
2.  **Acceso**: Solo el paciente y sus doctores asignados pueden ver el historial detallado.

---

## 6. Devices (IoT & Vital Signs)
**Responsabilidad:** Ingesta de datos de dispositivos médicos.

### Entidades Principales
*   **VitalSign**: `id`, `patientId`, `type` (GLUCOSE, BLOOD_PRESSURE, OXYGEN, ECG), `value` (JSON/String), `unit`, `timestamp`, `deviceId`.

### Endpoints Requeridos
*   `POST /api/v1/glucose-readings`: Registro de glucómetro.
*   `POST /api/v1/blood-pressure-readings`: Registro de tensiómetro.
*   `POST /api/v1/ecg-readings`: Registro de ECG.

### Reglas de Negocio
1.  **Alta Frecuencia**: El sistema debe soportar múltiples lecturas por día.
2.  **Normalización**: Los valores deben guardarse en unidades estándar (ej. mg/dL para glucosa) para permitir comparaciones.

---

## 7. Alerts (Sistema de Alertas)
**Responsabilidad:** Monitoreo de signos vitales y generación de alertas automáticas.

### Entidades Principales
*   **Alert**: `id`, `patientId`, `severity` (LOW, MEDIUM, CRITICAL), `message`, `isRead`, `triggeredBy` (VitalSign ID).

### Endpoints Requeridos
*   `GET /api/v1/alerts`: Listar alertas activas.
*   `PATCH /api/v1/alerts/{id}/ack`: Marcar alerta como vista/atendida.

### Reglas de Negocio
1.  **Trigger Automático**: Al recibir un `VitalSign` (Contexto Devices), este contexto debe evaluar reglas (ej. Glucosa > 180) y crear una `Alert` si es necesario.
2.  **Notificación**: Las alertas críticas deben generar notificaciones inmediatas (Push/Email).

---

## 8. Medications (Gestión de Medicamentos)
**Responsabilidad:** Recetas médicas y control de ingesta.

### Entidades Principales
*   **Prescription**: `id`, `patientId`, `doctorId`, `medicationName`, `dosage`, `frequency`, `startDate`, `endDate`.
*   **IntakeLog**: `id`, `prescriptionId`, `takenAt`, `status` (TAKEN, MISSED).

### Endpoints Requeridos
*   `POST /api/v1/prescriptions`: Crear receta.
*   `GET /api/v1/medications/history`: Ver historial de adherencia.

---

## 9. Communication (Mensajería)
**Responsabilidad:** Comunicación segura entre médico y paciente.

### Entidades Principales
*   **Thread**: `id`, `patientId`, `doctorId`, `topic`.
*   **Message**: `id`, `threadId`, `senderId`, `content`, `timestamp`, `readStatus`.
*   **Nudge**: `id`, `receiverId`, `type` (REMINDER, ALERT), `content`.

### Endpoints Requeridos
*   `GET /api/v1/threads`: Listar conversaciones.
*   `POST /api/v1/messages`: Enviar mensaje.
*   `GET /api/v1/nudges`: Obtener recordatorios.

### Reglas de Negocio
1.  **Privacidad**: Los mensajes solo son accesibles por los participantes del hilo.
2.  **Nudges**: El sistema puede generar "empujones" (nudges) automáticos para recordar medicamentos o citas.

---

## 10. Subscriptions & Payments (Suscripciones)
**Responsabilidad:** Monetización, planes y pasarela de pagos.

### Entidades Principales
*   **SubscriptionPlan**: `id`, `name`, `price`, `features` (JSON), `type` (PATIENT, TENANT).
*   **Subscription**: `id`, `payerId`, `planId`, `status` (ACTIVE, PAST_DUE), `stripeSubscriptionId`.
*   **Payment**: `id`, `amount`, `status`, `stripePaymentIntentId`.

### Endpoints Requeridos
*   `GET /api/v1/subscriptionPlans`: Listar planes públicos.
*   `POST /api/v1/subscriptions`: Crear suscripción.
*   `POST /api/v1/payments/webhook`: Webhook para eventos de Stripe.

### Reglas de Negocio
1.  **Acceso**: El estado de la suscripción (`ACTIVE`) determina si el Tenant o Paciente puede acceder a ciertas funcionalidades premium.
2.  **Renovación**: Manejo de ciclos de facturación mensuales/anuales.
