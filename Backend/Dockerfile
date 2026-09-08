FROM node:22-alpine

WORKDIR /app

# Build frontend
COPY frontend/electricity_info ./frontend/electricity_info
WORKDIR /app/frontend/electricity_info
RUN npm install && npm run build

# Build backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ .

EXPOSE 3001
CMD ["npm", "run", "dev"]