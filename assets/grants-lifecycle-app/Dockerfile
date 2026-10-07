FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production --cache /tmp/npm-cache

COPY . .
RUN npm run build 2>/dev/null || true

EXPOSE 4004

ENV NODE_ENV=production
ENV PORT=4004

CMD ["npm", "start"]
