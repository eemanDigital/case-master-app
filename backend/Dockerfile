# Use a specific Puppeteer-ready image (includes Chrome and all dependencies)
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Set the environment variable so Puppeteer knows where Chrome is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
