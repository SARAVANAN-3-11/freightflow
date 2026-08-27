FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js ./
ENV NODE_ENV=production
EXPOSE 4001
CMD ["node", "index.js"]