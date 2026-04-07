FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG PROJECT_PATH
ARG APP_DLL

WORKDIR /src

COPY ["MicroCommerce.sln", "./"]
COPY ["src/ApiGateway/ApiGateway.csproj", "src/ApiGateway/"]
COPY ["src/Services/AuthService/AuthService.csproj", "src/Services/AuthService/"]
COPY ["src/Services/CartService/CartService.csproj", "src/Services/CartService/"]
COPY ["src/Services/CatalogService/CatalogService.csproj", "src/Services/CatalogService/"]
COPY ["src/Services/InventoryService/InventoryService.csproj", "src/Services/InventoryService/"]
COPY ["src/Services/NotificationService/NotificationService.csproj", "src/Services/NotificationService/"]
COPY ["src/Services/OrderService/OrderService.csproj", "src/Services/OrderService/"]
COPY ["src/Services/PaymentService/PaymentService.csproj", "src/Services/PaymentService/"]

RUN dotnet restore "$PROJECT_PATH"

COPY . .

RUN dotnet publish "$PROJECT_PATH" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
ARG APP_DLL

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV APP_DLL=$APP_DLL

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["sh", "-c", "dotnet \"$APP_DLL\""]
