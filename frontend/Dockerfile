FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Ensure node_modules is properly installed
RUN npm install --legacy-peer-deps

# Verify craco is installed and find its location
RUN ls -la node_modules/.bin/craco && echo "---" && find node_modules/@craco -name "craco.js" 2>/dev/null || echo "craco.js not found"

EXPOSE 3000

CMD ["npm", "start"]

