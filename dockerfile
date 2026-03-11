FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copiar arquivos do servidor
COPY server/package*.json ./server/
RUN cd server && npm install

# Copiar código do servidor
COPY server/ ./server/

# Copiar arquivos estáticos do frontend
COPY public/ ./public/

# Instalar navegador do Playwright
RUN cd server && npx playwright install chromium

# Verificar se os arquivos foram copiados (opcional, para debug)
RUN ls -la /app/public && echo "✅ Public directory contents:"

WORKDIR /app/server

EXPOSE 5001

CMD ["npm", "start"]