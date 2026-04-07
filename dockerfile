FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

ARG PROJECT

COPY . .

RUN dotnet restore "src/Services/${PROJECT}/${PROJECT}.csproj" || dotnet restore "src/ApiGateway/${PROJECT}.csproj"

RUN dotnet publish "src/Services/${PROJECT}/${PROJECT}.csproj" -c Release -o /app/publish || dotnet publish "src/ApiGateway/${PROJECT}.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "${PROJECT}.dll"]