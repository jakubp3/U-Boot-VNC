FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Ensure node_modules is properly installed
RUN npm install --legacy-peer-deps

# Verify craco is installed
RUN ls -la node_modules/.bin/ | grep craco || (echo "craco not found, checking @craco/craco..." && ls -la node_modules/@craco/ 2>/dev/null || echo "@craco/craco not installed")

EXPOSE 3000

CMD ["npm", "start"]

