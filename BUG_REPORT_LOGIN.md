# Reporte de Bug: Fallo de Login Inmediato tras Registro (404)

**Prioridad:** Alta
**Componente:** IAM / Authentication Controller

## Descripción
El flujo de registro de usuario (Sign Up) crea el usuario exitosamente en la base de datos, pero el intento inmediato de inicio de sesión (Sign In) con las mismas credenciales falla devolviendo un error **404 Not Found**.

Esto impide que el Frontend pueda obtener el Token JWT necesario para continuar con los pasos siguientes (creación de Tenant/Paciente y Pago).

## Pasos para Reproducir
1.  Enviar petición `POST /api/v1/authentication/sign-up` con un usuario nuevo.
    *   Payload: `{ email: "test@test.com", password: "123", role: "hospital_admin", ... }`
    *   **Resultado:** 200 OK (Usuario creado).
2.  Inmediatamente, enviar petición `POST /api/v1/authentication/sign-in` con las mismas credenciales.
    *   Payload: `{ email: "test@test.com", password: "123" }`

## Comportamiento Actual
*   El endpoint `/sign-in` devuelve **404 Not Found**.
*   Mensaje de error (inferido): "User not found" o "Bad credentials".

## Comportamiento Esperado
*   El endpoint `/sign-in` debería devolver **200 OK** y el objeto con `accessToken`, ya que el usuario acaba de ser creado con esa contraseña.

## Posibles Causas (Backend)
1.  **Hashing de Contraseña:** ¿Se está usando el mismo algoritmo de hash en `sign-up` y `sign-in`? Si `sign-up` guarda la contraseña en texto plano y `sign-in` compara contra un hash (o viceversa), fallará.
2.  **Estado del Usuario:** ¿El usuario se crea con `isVerified: false` o `enabled: false` y el Login filtra estos usuarios?
3.  **Roles:** ¿El Login espera el rol en mayúsculas (`HOSPITAL_ADMIN`) pero se guardó en minúsculas (`hospital_admin`)?
4.  **Latencia/Transacción:** ¿La transacción de creación de usuario no se ha commiteado cuando llega la petición de login? (Poco probable en bases de datos relacionales estándar, pero posible).

## Logs del Frontend
```
POST .../sign-up 200 OK
POST .../sign-in 404 Not Found (Correo electrónico o contraseña incorrectos)
```
*(Al reintentar)*
```
POST .../sign-up 400 Bad Request (Email already exists)
```
