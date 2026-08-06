# Integración de Auth en Angular — CheckMate

> Este documento es para el proyecto **Angular** de CheckMate. Explica cómo iniciar
> sesión contra gobernanza (el servicio central de identidad), cómo se resuelven roles
> y permisos, y cómo usar el token resultante contra la API de CheckMate. No se necesita
> backend propio de Angular para el login — todo pasa por gobernanza directo desde el
> navegador; CheckMate-API solo entra para resolver permisos y para el resto del negocio.
>
> **Este doc ya refleja el código real** (no es solo diseño teórico). Los archivos
> concretos están linkeados en cada sección. Si algo no coincide con lo que ves en el
> repo, el código manda — actualiza este doc.

## 1. Contexto: quién hace qué

- **Gobernanza** (`Gobernanza-Login`, Laravel, corre en `localhost:8001` en dev) es el
  servicio de identidad. Ahí vive el login, el popup, y los endpoints de sesión
  (`logout`, `refresh`, `me`). Roles ahí están en **español**: `alumno`, `profesor`,
  `tutor_academico`, `administrador`, `director_carrera`.
- **CheckMate-API** (`CheckMate-API`, Laravel, corre en `localhost:8000` en dev) es
  donde vive la lógica de negocio (alumnos, profesores, asistencias, etc.) **y ahora
  también los permisos granulares por rol**. No tiene login propio — cada request
  protegido que le mandes debe traer el `Authorization: Bearer {token}` que te dio
  gobernanza. CheckMate-API valida ese token llamando a gobernanza por detrás
  (middleware `governance.auth` → `ResolveGovernanceUser`).
- **Angular** (`CheckMate-Frontend`, corre en `localhost:4200` en dev) habla con
  gobernanza directo para todo lo de sesión (login, logout, refresh), y con
  CheckMate-API para todo lo de negocio y para resolver permisos.

```
Angular  ──(popup / login / logout / refresh)──────────>  Gobernanza (:8001)
Angular  ──(Authorization: Bearer {token})──────────────>  CheckMate-API (:8000)
CheckMate-API  ──(valida el token, server-to-server)────>  Gobernanza (:8001)
```

## 2. Config en `environment.ts`

Archivo real: [`src/environments/environment.development.ts`](src/environments/environment.development.ts)

```ts
export const environment = {
  production: false,
  governanceBaseUrl: 'http://localhost:8001',        // popup y endpoints de auth
  governanceApiUrl: 'http://localhost:8001/api/v1',  // login/logout/refresh/me
  governanceClientId: 'governance-web-local',
  checkmateApiUrl: 'http://localhost:8000/api/v1',   // CheckMate-API (negocio + permisos)
};
```

Estos valores no son secretos, es seguro tenerlos en el bundle. `X-Client-Secret`
**nunca** debe estar en el frontend — eso solo se usa server-to-server
(CheckMate-API → gobernanza).

⚠️ **Gotcha que ya nos mordió:** del lado de gobernanza (`Gobernanza-Login/.env`),
`CHECKMATE_WEB_CALLBACK_URL` tiene que ser **exactamente** el origin de Angular
(`http://localhost:4200/auth/callback`), NO el de CheckMate-API. Es fácil confundirse
porque la variable se llama `CHECKMATE_WEB_URL` pero el que abre el popup es Angular,
no el backend Laravel de CheckMate. Si gobernanza tiene el puerto equivocado ahí vas a
ver "Acceso no autorizado" al abrir el popup aunque todo lo demás esté bien.

## 3. Login: abrir el popup

Código real: [`src/app/core/authentication/auth.service.ts`](src/app/core/authentication/auth.service.ts) método `login()`.

```ts
login(): void {
  this.detachPopupListener();

  const redirectUri = `${window.location.origin}${ROUTE_PATHS.authCallback}`;
  const popupUrl =
    `${environment.governanceBaseUrl}/governance/auth` +
    `?client_id=${environment.governanceClientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  this.popupWindow = window.open(popupUrl, 'governance-login', 'width=500,height=600');

  this.popupMessageListener = (event: MessageEvent<GovernanceAuthMessage>) => {
    if (event.origin !== this.governanceOrigin() || event.data?.type !== 'governance_auth') {
      return;
    }

    const { token, token_type, user } = event.data.data;
    const authenticatedUser$ = user ? this.toAuthenticatedUser(token, token_type, user) : of(null);

    authenticatedUser$.subscribe((authenticatedUser) => {
      if (authenticatedUser) {
        this.sessionService.setUser(authenticatedUser);
        void this.router.navigateByUrl(this.getHomeUrl());
      } else {
        this.toastService.error('No se pudo iniciar sesión', 'Tu rol no está soportado en este portal.');
      }
    });

    this.popupWindow?.close();
    this.detachPopupListener();
  };

  window.addEventListener('message', this.popupMessageListener);
}
```

**Cómo llega el token:** gobernanza detecta que la ventana tiene `window.opener` (o sea,
que sí se abrió con `window.open()`) y manda el token por `postMessage`, sin redirigir a
ningún lado. Por eso el flujo normal nunca toca `/auth/callback`.

Nota que `toAuthenticatedUser` **ya no es síncrono** — ahora regresa un `Observable`
porque necesita ir a buscar los permisos reales a CheckMate-API antes de dar por buena
la sesión. Ver sección 6.

## 4. Fallback: si el popup fue bloqueado

Si el navegador bloquea el popup, el usuario puede terminar navegando la URL de
gobernanza en una pestaña normal. Ahí **no** hay `window.opener`, así que gobernanza en
vez de `postMessage` hace un redirect a `redirect_uri?token=...&token_type=...`.

Por eso existe una ruta real `/auth/callback` en Angular (no en CheckMate-API) —
componente [`auth-callback.component.ts`](src/app/features/authentication/pages/auth-callback/auth-callback.component.ts) — que lee esos query params y llama a
`authService.completeCallback(token, tokenType)`, el cual:

1. Llama a `GET {governanceApiUrl}/auth/me` para obtener el usuario (en este flujo no
   viene en el query string, solo `token`/`token_type`).
2. Pasa por el mismo `toAuthenticatedUser()` que el flujo del popup — o sea, también
   pasa por la resolución de permisos en CheckMate-API antes de considerar la sesión
   lista.

## 5. Mapeo de rol: gobernanza (español) → Angular (inglés)

Gobernanza guarda y devuelve el rol como `key_name` en español (`alumno`, `profesor`,
`tutor_academico`, `administrador`, `director_carrera`). Angular usa internamente un
enum en inglés (`UserRole.STUDENT`, `UserRole.TEACHER`, etc.) para todo — rutas, guards,
labels de UI.

La traducción vive en un solo lugar: [`governance-role.mapper.ts`](src/app/core/authentication/governance-role.mapper.ts)

```ts
const GOVERNANCE_ROLE_MAP: Record<string, UserRole> = {
  administrador: UserRole.ADMIN,
  director_carrera: UserRole.CAREER_DIRECTOR,
  profesor: UserRole.TEACHER,
  tutor_academico: UserRole.TUTOR_TEACHER,
  alumno: UserRole.STUDENT,
};
```

Si ves `role: "STUDENT"` en `sessionStorage`/consola, es correcto — es la
representación interna de Angular, no un bug. El backend/BD siguen en español; solo
Angular usa inglés puertas adentro. Si `mapGovernanceRole` no reconoce el `key_name`
(rol nuevo en gobernanza que Angular no conoce todavía), `toAuthenticatedUser` regresa
`null` y se muestra el toast "Tu rol no está soportado en este portal." — si agregas un
rol nuevo en gobernanza, agrégalo aquí también.

## 6. Permisos granulares (agregado — antes esto NO existía)

**Antes de este cambio**, `toAuthenticatedUser()` dejaba `permissions: []` hardcodeado
para cualquier usuario logueado vía gobernanza. Como casi todas las rutas de cada rol
tienen `canActivate: [permissionGuard]` con un `data.permission` requerido (ver
`student.routes.ts`, `admin.routes.ts`, etc.), **todo mundo caía en "Acceso denegado"**
apenas entraba, incluso al dashboard. El rol se resolvía bien, pero el guard de
permisos siempre bloqueaba porque la lista estaba vacía.

**Ahora** los permisos reales se piden a CheckMate-API. El flujo completo:

```
Angular → GET {checkmateApiUrl}/me   (Authorization: Bearer {token de gobernanza})
        ← { data: { id, full_name, email, role, permissions: [...] } }
```

Ese endpoint es nuevo, vive en `CheckMate-API`:

- [`routes/api.php`](../CheckMate-API/routes/api.php) — `GET /api/v1/me`, protegido solo
  por el middleware `governance.auth` (cualquier rol autenticado puede pegarle, no hace
  falta `role:xxx`).
- [`app/Http/Controllers/MeController.php`](../CheckMate-API/app/Http/Controllers/MeController.php)
  — arma la respuesta.
- [`app/Models/User.php`](../CheckMate-API/app/Models/User.php) método
  `effectivePermissions()` — junta los permisos del `permission_group` del rol del
  usuario, y aplica overrides individuales (`user_permission_overrides`: `PERMITIR`
  agrega, `DENEGAR` quita).
- [`database/seeders/PermissionSeeder.php`](../CheckMate-API/database/seeders/PermissionSeeder.php)
  — la fuente de verdad de **qué permiso tiene cada rol**. Es un mapa
  `rol => [lista de permission keys]`, sembrado a partir de las claves `permission:`
  que ya usan las rutas de Angular (`dashboard.view`, `students.view`, `claims.view`,
  etc.) — no inventamos claves nuevas, usamos las que el frontend ya pedía.

`toAuthenticatedUser()` en Angular ahora se ve así:

```ts
private toAuthenticatedUser(
  token: string,
  tokenType: string,
  user: GovernanceUser,
): Observable<AuthenticatedUser | null> {
  const role = mapGovernanceRole(user.role);
  if (!role) return of(null);

  return this.http
    .get<ApiResponse<{ permissions: string[] }>>(`${environment.checkmateApiUrl}/me`, {
      headers: { Authorization: `${tokenType} ${token}` },
    })
    .pipe(
      map((response) => ({
        id: user.id,
        fullName: user.name,
        email: user.email,
        role,
        initials: this.buildInitials(user.name),
        permissions: response.data?.permissions ?? [],
        token,
        tokenType,
      })),
      catchError(() => of(null)),
    );
}
```

`PermissionService.hasPermission()` ([`permission.service.ts`](src/app/core/authorization/permission.service.ts))
y `permissionGuard` ([`permission.guard.ts`](src/app/core/guards/permission.guard.ts)) no cambiaron —
ya esperaban un array de strings en `currentUser().permissions`, el problema era
exclusivamente que ese array nunca se llenaba.

### Cómo agregar un permiso nuevo (para tu compañero / su Claude)

1. Si es una ruta nueva en Angular con `data: { permission: 'algo.view' }`, primero
   revisa que esa clave ya no exista con otro nombre (`schedule.view` vs
   `schedules.view` — ver nota abajo, ya hay una inconsistencia sin resolver).
2. Agrega la clave a la lista del rol correspondiente en
   `CheckMate-API/database/seeders/PermissionSeeder.php` (`ROLE_PERMISSIONS`), y si es
   una clave nueva agrégale también su label en `PERMISSION_LABELS`.
3. Vuelve a correr el seeder: `php artisan db:seed --class=PermissionSeeder` en
   `CheckMate-API` (es `updateOrCreate`/`sync`, seguro correrlo varias veces).
4. Si el usuario de prueba ya tenía sesión, tiene que volver a loguearse (o refrescar el
   token) para que `GET /me` traiga el permiso nuevo — los permisos no son parte del JWT
   ni se cachean del lado de Angular más allá de la sesión actual.
5. Para dar/quitar un permiso a **un usuario puntual** sin tocarle el rol completo, usa
   `user_permission_overrides` en CheckMate-API (`type: PERMITIR` o `DENEGAR`) — no hay
   endpoint todavía para gestionar esto desde Angular, es directo a BD o por seeder/tinker.

⚠️ **Inconsistencia conocida, no la "arregles" sin avisar:** `student.routes.ts` y
`teacher.routes.ts` usan la clave `schedule.view` (singular) para la ruta de horario,
mientras que `admin.routes.ts` y `career-director.routes.ts` usan `schedules.view`
(plural) para lo mismo conceptualmente. El seeder respeta exactamente lo que cada rol
pedía porque así es como funciona ahora mismo. Si las unifican, hay que cambiar ambos
lados (rutas de Angular + `PermissionSeeder`) a la vez o algún rol se queda sin acceso
a su horario.

## 7. Dónde y cómo guardar el token

Recomendado: **`sessionStorage`**, no `localStorage`. Se limpia solo al cerrar la
pestaña/navegador, reduce la ventana de exposición si roban el token (XSS), y sigue
sobreviviendo un refresh de página (a diferencia de guardarlo solo en memoria). Ver
[`session.service.ts`](src/app/core/authentication/session.service.ts) para la
implementación real (usa signals + `sessionStorage`, no un `BehaviorSubject`).

## 8. Mandar el token a CheckMate-API

Interceptor HTTP que agrega el header a **todas** las llamadas a `checkmateApiUrl`
(no a las de gobernanza, esas no lo necesitan salvo `logout`/`refresh`/`me`):

```ts
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token && req.url.startsWith(environment.checkmateApiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
```

El nuevo endpoint `GET {checkmateApiUrl}/me` usa exactamente este mismo interceptor —
no necesitó nada especial de configuración de rutas.

## 9. Cuando el token expira o es inválido

CheckMate-API responde así ante cualquier endpoint protegido si el token no es válido
(expirado, revocado, ausente, o el usuario no está vinculado localmente):

```json
{
  "success": false,
  "status_code": 401,
  "message": "Tu sesión ha expirado. Inicia sesión nuevamente.",
  "error_code": "AUTH05",
  "data": null,
  "errors": null,
  "meta": { "...": "..." }
}
```

Atrapa el `401` con `error_code: AUTH05` en un interceptor y manda al usuario a login:

```ts
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.error_code === 'AUTH05') {
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

Otros códigos de error relevantes del catálogo (`error_code` en la respuesta), por si
quieres mensajes específicos en vez de uno genérico:

| Código | HTTP | Significado |
|--------|------|--------------|
| `AUTH02` | 403 | El usuario no tiene el rol correcto para ese portal/endpoint |
| `AUTH03` | 403 | Cuenta desactivada |
| `AUTH05` | 401 | Sesión expirada/inválida, token no resuelve, o usuario sin perfil local — mandar a login |
| `VAL01` | 422 | Error de validación — revisar `errors` en la respuesta |

## 10. Logout y refresh (van directo a gobernanza, no a CheckMate-API)

```ts
logout() {
  const token = this.authService.getToken();

  return this.http.post(
    `${environment.governanceApiUrl}/auth/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  ).pipe(
    finalize(() => {
      this.authService.clearSession();
      this.router.navigate(['/login']);
    })
  );
}

refresh() {
  const token = this.authService.getToken();

  return this.http.post<{ data: { token: string; token_type: string } }>(
    `${environment.governanceApiUrl}/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  ).pipe(
    tap(({ data }) => this.authService.storeSession(data.token, data.token_type, null))
  );
}
```

## 11. Resumen del flujo completo

1. Usuario da clic en "Iniciar sesión" → Angular abre popup a gobernanza (`:8001`).
2. Usuario mete credenciales en la página de gobernanza (esa pantalla no es nuestra).
3. Gobernanza manda el token por `postMessage` (o redirect a `/auth/callback` si el
   popup fue bloqueado).
4. Angular resuelve el rol (`mapGovernanceRole`, español → inglés) y, con ese mismo
   token, pide los permisos reales a CheckMate-API (`GET /api/v1/me`).
5. Solo si ambas cosas (rol conocido + respuesta de permisos) salen bien, Angular guarda
   `token`/`token_type`/`role`/`permissions` en sesión y navega al home del rol.
6. Todas las llamadas a CheckMate-API llevan `Authorization: Bearer {token}` (vía
   interceptor). `permissionGuard` compara `data.permission` de cada ruta contra el
   array de permisos guardado en sesión.
7. Si CheckMate-API responde `401 AUTH05`, se limpia la sesión y se manda a login.
8. Logout/refresh se llaman directo a gobernanza, no a CheckMate-API.

## 12. Troubleshooting rápido

- **"Acceso no autorizado" al abrir el popup** → problema del lado de gobernanza, no de
  Angular. Revisa `Gobernanza-Login/.env` → `CHECKMATE_WEB_CALLBACK_URL` debe ser
  exactamente `{origin de Angular}/auth/callback`. Si lo cambias, tienes que correr
  `php artisan config:clear` **antes** de re-sembrar (`db:seed --class=ClientAppSeeder`)
  — si hay config cacheado, Laravel deja de leer `.env` y el seeder usa los valores
  default hardcodeados en vez de los tuyos, en silencio.
- **Login exitoso pero "Acceso denegado" en cualquier página** → revisa que
  `GET {checkmateApiUrl}/me` esté respondiendo con un array de `permissions` no vacío
  para ese usuario. Si viene vacío, el usuario probablemente no tiene
  `governance_user_id` vinculado en la tabla `users` de CheckMate-API, o su rol no tiene
  ningún `permission_group` asignado (revisa `PermissionSeeder`).
- **Un rol nuevo en gobernanza no funciona en Angular** → agrégalo a
  `GOVERNANCE_ROLE_MAP` en `governance-role.mapper.ts` Y a `ROLE_PERMISSIONS` en
  `PermissionSeeder.php`. Faltan los dos lados si no.
