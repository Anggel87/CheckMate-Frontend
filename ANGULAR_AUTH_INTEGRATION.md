# Integracion de Auth en Angular - CheckMate

Este documento describe el flujo vigente entre **CheckMate-Frontend** y
**Gobernanza_Login**. El login ya no se abre en popup: el navegador sale de
`checkmate.com`, entra al subdominio centralizado de autenticacion y vuelve al portal
autorizado con un codigo temporal de un solo uso.

## 1. Responsabilidades

- **Gobernanza_Login** (`login.checkmate.com`, localmente el host configurado) muestra
  el formulario de login, valida credenciales, valida `returnUrl`, emite codigos
  temporales y entrega tokens Bearer mediante endpoint seguro.
- **CheckMate-Frontend** no muestra formularios de credenciales. Redirige al login
  central, recibe el `code` en `/portal`, lo canjea y crea la sesion local.
- **CheckMate-API** resuelve permisos y datos del usuario en `GET /api/v1/me` usando
  el Bearer token emitido por Gobernanza.

## 2. Variables de entorno Angular

Archivos:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

Variables requeridas:

```ts
export const environment = {
  production: false,
  governanceBaseUrl: 'http://localhost:8001',
  governanceApiUrl: 'http://localhost:8001/api/v1',
  governanceLoginUrl: 'http://localhost:8001/login',
  governanceLogoutUrl: 'http://localhost:8001/governance/logout',
  governanceClientId: 'governance-web-local',
  checkmateWebUrl: 'http://localhost:4200',
  checkmatePortalUrl: 'http://localhost:4200/portal',
  checkmatePostLogoutRedirectUrl: 'http://localhost:4200',
  checkmateApiUrl: 'http://localhost:8000/api/v1',
};
```

En produccion el flujo esperado es:

```text
https://checkmate.com
  -> https://login.checkmate.com/login?client_id=...&returnUrl=https%3A%2F%2Fcheckmate.com%2Fportal
  -> https://checkmate.com/portal?code=...
  -> dashboard del rol autenticado
```

Si en desarrollo Gobernanza corre en `http://localhost:4300`, solo cambia
`governanceBaseUrl`, `governanceApiUrl`, `governanceLoginUrl` y
`governanceLogoutUrl` en `environment.development.ts`.

## 3. Inicio de sesion

El boton **Abrir portal** llama a `AuthService.login()`. La URL se construye en
`core/authentication/auth-redirect-url.util.ts`; ningun componente contiene URLs de
autenticacion.

`AuthService.login()` hace una navegacion normal:

```ts
window.location.assign(buildGovernanceLoginUrl('/portal'));
```

No se usa `window.open()`, `postMessage`, modal ni ventana emergente.

## 4. Validacion de `returnUrl`

Gobernanza recibe `client_id` y `returnUrl`. Antes de mostrar el login o redirigir,
valida que el cliente este activo y que el `returnUrl` pertenezca a
`client_apps.allowed_redirect_uris`.

Variables del seeder de Gobernanza:

```env
CHECKMATE_WEB_URL=https://checkmate.com
CHECKMATE_WEB_PORTAL_URL=https://checkmate.com/portal
CHECKMATE_WEB_CALLBACK_URL=https://checkmate.com/auth/callback
GOVERNANCE_WEB_CLIENT_ID=governance-web
GOVERNANCE_WEB_CLIENT_SECRET=...
```

`CHECKMATE_WEB_CALLBACK_URL` se conserva por compatibilidad, pero el retorno normal es
`CHECKMATE_WEB_PORTAL_URL`.

## 5. Codigo temporal y sesion Angular

Despues de un login correcto, Gobernanza redirige al `returnUrl` autorizado con:

```text
https://checkmate.com/portal?code={codigo_temporal}
```

El `code`:

- no es un token Bearer;
- dura 2 minutos;
- se invalida al primer uso con `Cache::pull`;
- esta ligado al `client_id` y al `return_url` con los que fue emitido.

Angular, desde `/portal`, llama:

```http
POST {governanceApiUrl}/auth/exchange-code
Content-Type: application/json

{
  "client_id": "governance-web-local",
  "return_url": "http://localhost:4200/portal",
  "code": "...",
  "device_name": "web-redirect"
}
```

La respuesta contiene el token Bearer y el usuario de Gobernanza. Angular no considera
la sesion lista todavia: primero llama a `GET {checkmateApiUrl}/me` con ese token para
resolver rol local y permisos. Solo despues guarda el `AuthenticatedUser` en
`sessionStorage` mediante `SessionService`.

## 6. Roles, permisos e interceptores

El mapeo de roles sigue centralizado en
`src/app/core/authentication/governance-role.mapper.ts`.

Los permisos siguen resolviendose con:

```text
Angular -> GET {checkmateApiUrl}/me
Authorization: Bearer {token_de_gobernanza}
```

El `authInterceptor` conserva el comportamiento existente: agrega el Bearer token solo
a requests de `checkmateApiUrl`. El `errorInterceptor` conserva el manejo de `AUTH05`,
limpia la sesion y redirige nuevamente al login central.

## 7. Guards y ruta `/portal`

- `/portal` es el punto de retorno del login central.
- Si llega con `code`, canjea el codigo y crea sesion.
- Si ya existe sesion, redirige al dashboard del rol con `AuthService.getHomeUrl()`.
- Si no hay sesion ni `code`, redirige al login central.
- `authGuard` y `roleGuard` ya no mandan al login local; redirigen a Gobernanza.

## 8. Logout centralizado

`AuthService.signOut()`:

1. lee el Bearer token de `SessionService`;
2. limpia la sesion local;
3. llama `POST {governanceApiUrl}/auth/logout` para revocar el token cuando existe;
4. redirige a `{governanceLogoutUrl}?client_id=...&returnUrl=https://checkmate.com`;
5. Gobernanza invalida su sesion web y vuelve al `returnUrl` autorizado.

## 9. Archivos modificados

Frontend:

- `angular.json`
- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`
- `src/app/core/authentication/auth.service.ts`
- `src/app/core/authentication/auth-redirect-url.util.ts`
- `src/app/core/authentication/governance-auth.model.ts`
- `src/app/core/constants/route-paths.constants.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/guards/role.guard.ts`
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/features/authentication/pages/login/login-page.component.ts`
- `src/app/features/authentication/pages/auth-callback/auth-callback.component.ts`
- `src/app/features/authentication/pages/portal-entry/portal-entry.component.ts`
- `src/app/app.routes.ts`
- `src/app/layouts/components/sidebar/sidebar.component.ts`

Gobernanza:

- `routes/web.php`
- `routes/api.php`
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- `app/Http/Controllers/AuthController.php`
- `app/Http/Controllers/GovernanceAuthController.php`
- `resources/views/governance/auth.blade.php`
- `resources/views/governance/token.blade.php`
- `database/seeders/ClientAppSeeder.php`
- `tests/Feature/GovernanceAuthTest.php`
