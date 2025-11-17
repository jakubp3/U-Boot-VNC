FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Ensure node_modules is properly installed
RUN npm install --legacy-peer-deps

EXPOSE 3000

CMD ["npx", "craco", "start"]

