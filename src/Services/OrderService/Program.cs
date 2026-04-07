using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Repositories;
using OrderService.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddDbContext<OrderDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("OrderDb")));
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderServiceHandler>();
builder.Services.AddScoped<KafkaProducer>();

var app = builder.Build();
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
await using var scope = app.Services.CreateAsyncScope();
var dbContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
await dbContext.Database.EnsureCreatedAsync();
await dbContext.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('Orders', 'ShippingCarrier') IS NULL
    ALTER TABLE Orders ADD ShippingCarrier nvarchar(120) NULL;
IF COL_LENGTH('Orders', 'TrackingNumber') IS NULL
    ALTER TABLE Orders ADD TrackingNumber nvarchar(80) NULL;
IF COL_LENGTH('Orders', 'ShippedAt') IS NULL
    ALTER TABLE Orders ADD ShippedAt datetimeoffset NULL;
IF COL_LENGTH('Orders', 'DeliveredAt') IS NULL
    ALTER TABLE Orders ADD DeliveredAt datetimeoffset NULL;");
app.Run();
