FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Accept the API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the Vite project
RUN npm run build

# Expose the Vite preview port
EXPOSE 5173

# Serve the built application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]