FROM node:20-alpine AS build

WORKDIR /app

COPY ["src/web/microcommerce-ui/package.json", "src/web/microcommerce-ui/package-lock.json", "./"]

RUN npm ci

COPY src/web/microcommerce-ui/ .

RUN npm run build

FROM nginx:1.27-alpine AS final

COPY deploy/nginx/microcommerce-ui.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/microcommerce-ui/browser /usr/share/nginx/html

EXPOSE 80
