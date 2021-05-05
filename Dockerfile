FROM node:14.15.4 AS build

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . /app
RUN npm run build

# Use smaller alpine image for the runtime
FROM node:14.15.4-alpine

WORKDIR /app
COPY --from=build /app /app

CMD [ "npm", "run", "production" ]