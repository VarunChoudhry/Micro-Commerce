using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public sealed class NotificationDbContext(DbContextOptions<NotificationDbContext> options) : DbContext(options)
{
    public DbSet<NotificationLog> Notifications => Set<NotificationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NotificationLog>(entity =>
        {
            entity.HasKey(log => log.Id);
            entity.Property(log => log.Channel).HasMaxLength(40).IsRequired();
            entity.Property(log => log.Subject).HasMaxLength(200).IsRequired();
            entity.Property(log => log.Message).HasMaxLength(2000).IsRequired();
        });
    }
}
