FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install

RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]