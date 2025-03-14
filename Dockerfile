FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

ENV NODE_ENV production

EXPOSE 3000

CMD ["node", "dist/server.js"]
