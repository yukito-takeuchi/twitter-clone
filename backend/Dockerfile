# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy migration script if needed
COPY --from=builder /app/src/scripts ./src/scripts

# Copy migration files
COPY --from=builder /app/migrations ./migrations

# Heroku sets PORT environment variable dynamically
ENV NODE_ENV=production

# Expose port (Heroku will set $PORT)
EXPOSE $PORT

# Start production server
CMD ["npm", "start"]
