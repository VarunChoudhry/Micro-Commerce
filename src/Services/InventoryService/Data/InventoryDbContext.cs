using InventoryService.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data;

public sealed class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options)
{
    public DbSet<InventoryRecord> Inventory => Set<InventoryRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InventoryRecord>(entity =>
        {
            entity.HasKey(record => record.Id);
            entity.HasIndex(record => record.ProductId).IsUnique();
            entity.Property(record => record.ProductName).HasMaxLength(200).IsRequired();
        });
    }
}
