FROM node:22.12-alpine

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto por defecto de Angular
EXPOSE 4200

# Comando para iniciar el servidor de desarrollo
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]