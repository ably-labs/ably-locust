FROM node:16

# Install @ably/locust into /usr/src/app
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Install the example dependencies
WORKDIR /usr/src/app/example
RUN npm install

# Set the command to run the example
CMD ["node", "index.js"]
