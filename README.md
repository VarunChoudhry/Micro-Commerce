# MicroCommerce

Starter Amazon-like e-commerce project using Angular on the frontend and .NET microservices on the backend.

## Current Structure

- `src/ApiGateway`: starter gateway metadata service
- `src/Services/AuthService`: registration and login starter APIs
- `src/Services/CatalogService`: products and categories starter APIs
- `src/Services/CartService`: user cart starter APIs
- `src/Services/OrderService`: order starter APIs
- `src/Services/PaymentService`: payment starter APIs
- `src/Services/InventoryService`: inventory starter APIs
- `src/Services/NotificationService`: notification starter APIs
- `src/web/microcommerce-ui`: Angular application shell
- `deploy/docker-compose.yml`: local infrastructure placeholder

## Notes

- Backend services currently use in-memory collections so the scaffold runs without SQL Server setup.
- API Gateway is currently a simple metadata service backed by `ocelet.json`. Replace it with YARP or Ocelot later if you need real routing.
- Angular CLI was not available locally in a working state, so the Angular app files were created manually. Run `npm install` inside `src/web/microcommerce-ui` before using `ng serve`.

## Docker

- `deploy/docker/backend.Dockerfile` builds any .NET 9 backend service by passing `PROJECT_PATH` and `APP_DLL` as build args.
- `deploy/docker/frontend.Dockerfile` builds the Angular 19 UI and serves it with Nginx.
- `deploy/docker-compose.yml` includes build definitions plus tagged image names, so the same config can be used for local builds and registry pushes.

Build all images:

```powershell
docker compose -f deploy/docker-compose.yml build
```

Push images to your registry:

```powershell
$env:IMAGE_REPOSITORY_PREFIX="your-dockerhub-user/microcommerce"
$env:IMAGE_TAG="latest"
docker compose -f deploy/docker-compose.yml push
```

Build and start the stack locally:

```powershell
docker compose -f deploy/docker-compose.yml up --build
```

Build a single backend image directly:

```powershell
docker build `
  -f deploy/docker/backend.Dockerfile `
  --build-arg PROJECT_PATH=src/Services/AuthService/AuthService.csproj `
  --build-arg APP_DLL=AuthService.dll `
  -t your-dockerhub-user/microcommerce/auth-service:latest `
  .
```

## Suggested Next Steps

1. Keep each service self-contained with its own models and persistence.
2. Introduce JWT bearer authentication and role-based authorization filters.
3. Replace the gateway placeholder with YARP only when you actually need proxying.
4. Add RabbitMQ publishers and consumers for order, inventory, and notification events.
5. Build the Angular pages and HTTP services against these backend endpoints.



## Kafka installation

# Kafka Setup (Windows - KRaft Mode)

## Steps

cd kafka_2.13-4.2.0\bin\windows

kafka-storage.bat random-uuid

kafka-storage.bat format -t <CLUSTER_ID> -c ..\..\config\server.properties --standalone

kafka-server-start.bat ..\..\config\server.properties


## Create Topic

kafka-topics.bat --create --topic test-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

## Producer

kafka-console-producer.bat --topic test-topic --bootstrap-server localhost:9092

## Consumer

kafka-console-consumer.bat --topic test-topic --from-beginning --bootstrap-server localhost:9092

