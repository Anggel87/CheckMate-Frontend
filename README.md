CheckMate Frontend
Proyecto desarrollado con Angular 21 corriendo sobre Docker. No se requiere tener Node.js o Angular CLI instalados localmente, únicamente Docker Desktop.

Requisitos Previos
Docker Desktop instalado y corriendo.

Git

Iniciar el Proyecto por Primera Vez
Clonar el repositorio:

Bash
git clone <URL_DEL_REPOSITORIO>
cd CheckMate-Frontend
Levantar el entorno de desarrollo:

Bash
docker compose up --build
Acceder a la aplicación:
Abre tu navegador en http://localhost:4200

Comandos de Uso Diario
Encender la aplicación
Bash
docker compose up
Detener la aplicación
Presiona Ctrl + C en la terminal, o en otra ventana ejecuta:

Bash
docker compose down
Gestión de Dependencias y Comandos CLI
Todos los comandos de npm y ng deben ejecutarse dentro del contenedor con la aplicación encendida:

Instalar una nueva librería
Bash
docker compose exec checkmate-app npm install <nombre-del-paquete>
Generar un componente, servicio o módulo
Bash
docker compose exec checkmate-app npx ng g c componentes/<nombre-componente>
Reconstruir la imagen
Bash
docker compose up --build