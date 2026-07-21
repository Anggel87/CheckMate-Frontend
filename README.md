# CheckMate Frontend

Proyecto desarrollado con Angular 21 corriendo sobre Docker. No se requiere tener Node.js o Angular CLI instalados localmente, únicamente Docker Desktop.

---

## Requisitos Previos

- Docker Desktop instalado y corriendo.
- Git

---

## Iniciar el Proyecto por Primera Vez

1. **Clonar el repositorio:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd CheckMate-Frontend
   ```

2. **Levantar el entorno de desarrollo:**

   ```bash
   docker compose up --build
   ```

3. **Acceder a la aplicación:**

   Abre tu navegador en [http://localhost:4200](http://localhost:4200)

---

## Comandos de Uso Diario

### Encender la aplicación

```bash
docker compose up
```

### Detener la aplicación

Presiona `Ctrl + C` en la terminal, o en otra ventana ejecuta:

```bash
docker compose down
```

---

## Gestión de Dependencias y Comandos CLI

Todos los comandos de `npm` y `ng` deben ejecutarse dentro del contenedor con la aplicación encendida:

### Instalar una nueva librería

```bash
docker compose exec checkmate-app npm install <nombre-del-paquete>
```

### Generar un componente, servicio o módulo

```bash
docker compose exec checkmate-app npx ng g c componentes/<nombre-componente>
```

### Reconstruir la imagen

```bash
docker compose up --build
```
