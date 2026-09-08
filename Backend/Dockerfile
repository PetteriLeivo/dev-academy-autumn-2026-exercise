FROM node:22-alpine

WORKDIR /app

# Build frontend
COPY Frontend/electricity_info ./Frontend/electricity_info
WORKDIR /app/Frontend/electricity_info
RUN npm install && npm run build

# Build backend
WORKDIR /app
COPY Backend/package.json Backend/package-lock.json ./Backend/
WORKDIR /app/Backend
RUN npm install
COPY Backend/ .

EXPOSE 3001
CMD ["npm", "run", "dev"]