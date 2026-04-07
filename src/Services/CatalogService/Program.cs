using CatalogService.Data;
using CatalogService.Integration;
using CatalogService.Repositories;
using CatalogService.Services;
using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CatalogDb")));
builder.Services.AddHttpClient<IInventorySyncClient, InventorySyncClient>(client =>
    client.BaseAddress = new Uri(builder.Configuration["Services:InventoryServiceBaseUrl"] ?? "http://localhost:5249/api/inventory/"));
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var redisConnection = builder.Configuration["Redis:Connection"] ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(redisConnection);
});


var settings = new ElasticsearchClientSettings(new Uri("https://localhost:9200"))
    .Authentication(new BasicAuthentication("elastic", "-gF1TmjM+6xgX=njZIn6"))
    .ServerCertificateValidationCallback((o, cert, chain, errors) => true);

builder.Services.AddSingleton(new ElasticsearchClient(settings));

builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryService, CategoryServiceHandler>();
builder.Services.AddScoped<IProductService, ProductServiceHandler>();
builder.Services.AddScoped<ICacheService, RedisCacheService>();

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

await CatalogDbSeeder.SeedAsync(app.Services);

app.Run();
