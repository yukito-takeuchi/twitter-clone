# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy migration script if needed
COPY --from=builder /app/src/scripts ./src/scripts

# Heroku sets PORT environment variable dynamically
ENV NODE_ENV=production

# Expose port (Heroku will set $PORT)
EXPOSE $PORT

# Start production server
CMD ["npm", "start"]
