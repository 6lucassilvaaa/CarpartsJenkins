FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node src ./src
ARG APP_COMMIT=local
ENV APP_COMMIT=$APP_COMMIT
LABEL org.opencontainers.image.revision=$APP_COMMIT
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
