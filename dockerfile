FROM node:18-slim

WORKDIR /app

# Copiar arquivos do servidor
COPY server/package*.json ./server/
RUN cd server && npm install

# Copiar código do servidor
COPY server/ ./server/

# Copiar arquivos estáticos do frontend
COPY public/ ./public/

WORKDIR /app/server

EXPOSE 5001

CMD ["npm", "start"]