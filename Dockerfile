FROM node:21-alpine as builder
WORKDIR /app
COPY . .
RUN npm i
RUN npm run build

FROM node:21-alpine as final
WORKDIR /app
COPY --from=builder ./app/dist ./dist
COPY package.json .
COPY package-lock.json .
COPY .env .
RUN npm i --production

CMD [ "node", "./dist/index.js"]
