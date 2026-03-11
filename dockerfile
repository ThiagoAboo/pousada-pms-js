FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copiar arquivos do servidor
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/

# Copiar arquivos do cliente
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/

# Build do cliente com caminho corrigido
WORKDIR /app/client
RUN npm run build

# Mover os arquivos do build para o servidor servir
RUN mkdir -p /app/server/public && cp -r dist/* /app/server/public/

WORKDIR /app/server

EXPOSE 5001

CMD ["npm", "start"]