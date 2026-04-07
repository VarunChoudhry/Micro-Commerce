using CartService.Data;
using CartService.Repositories;
using CartService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddDbContext<CartDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("CartDb")));
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ICartService, CartServiceHandler>();

var app = builder.Build();
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
await using var scope = app.Services.CreateAsyncScope();
await scope.ServiceProvider.GetRequiredService<CartDbContext>().Database.EnsureCreatedAsync();
app.Run();


