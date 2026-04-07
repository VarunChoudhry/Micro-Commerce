using CatalogService.Data;
using CatalogService.Integration;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Services;

public static class CatalogDbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        await dbContext.Database.EnsureCreatedAsync();

        if (!await dbContext.Categories.AnyAsync())
        {
            var electronics = new Category { Name = "Electronics" };
            var fashion = new Category { Name = "Fashion" };
            var books = new Category { Name = "Books" };

            dbContext.Categories.AddRange(electronics, fashion, books);
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.Products.AnyAsync())
        {
            var electronics = await dbContext.Categories.FirstAsync(category => category.Name == "Electronics");
            var fashion = await dbContext.Categories.FirstAsync(category => category.Name == "Fashion");

            dbContext.Products.AddRange(
                new Product { Name = "Mechanical Keyboard", Description = "Compact keyboard with RGB backlight", Price = 3499m, Stock = 25, CategoryId = electronics.Id },
                new Product { Name = "Noise Cancelling Headphones", Description = "Over-ear wireless headphones", Price = 7999m, Stock = 12, CategoryId = electronics.Id },
                new Product { Name = "Everyday Hoodie", Description = "Cotton fleece hoodie", Price = 1499m, Stock = 40, CategoryId = fashion.Id });

            await dbContext.SaveChangesAsync();
        }

        await SyncInventoryAsync(scope.ServiceProvider, dbContext);
    }

    private static async Task SyncInventoryAsync(IServiceProvider serviceProvider, CatalogDbContext dbContext)
    {
        var inventorySyncClient = serviceProvider.GetService<IInventorySyncClient>();
        if (inventorySyncClient is null)
        {
            return;
        }

        var logger = serviceProvider.GetService<ILoggerFactory>()?.CreateLogger("CatalogDbSeeder");
        var products = await dbContext.Products
            .AsNoTracking()
            .Include(product => product.Category)
            .ToListAsync();

        foreach (var product in products)
        {
            try
            {
                await inventorySyncClient.UpsertAsync(product.Id, product.Name, product.Stock);
            }
            catch (Exception exception)
            {
                logger?.LogWarning(exception, "Inventory sync failed for seeded product {ProductId}.", product.Id);
            }
        }
    }
}
