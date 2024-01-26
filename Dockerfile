FROM node:20 as target

WORKDIR /app

COPY ./ ./

COPY ./ ./

RUN npm install

ENV NODE_ENV=production

CMD ["node", "/app"]