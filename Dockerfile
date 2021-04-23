FROM node:14.15.4

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . /app
RUN npm run babel

# Use smaller alpine image for the runtime
FROM node:14.15.4-alpine

COPY --from=build /app /

CMD [ "node", "run", "production" ]