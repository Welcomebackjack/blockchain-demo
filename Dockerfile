# Blockchain Demo Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Copy static files
COPY index.html ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "serve"]
