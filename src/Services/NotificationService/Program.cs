using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Repositories;
using NotificationService.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddDbContext<NotificationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("NotificationDb")));
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationServiceHandler>();
builder.Services.AddSingleton<KafkaConsumer>();
var app = builder.Build();

#region Kafka
var consumer = app.Services.GetRequiredService<KafkaConsumer>();
Task.Run(() => consumer.Start());
#endregion

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
await using var scope = app.Services.CreateAsyncScope();
await scope.ServiceProvider.GetRequiredService<NotificationDbContext>().Database.EnsureCreatedAsync();
app.Run();


