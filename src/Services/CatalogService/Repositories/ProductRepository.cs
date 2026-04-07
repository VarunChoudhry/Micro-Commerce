using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Repositories;

public sealed class ProductRepository(CatalogDbContext dbContext) : IProductRepository
{
    public Task<List<Product>> GetAllAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        var query = BuildBaseQuery(categoryId);
        return query.OrderBy(product => product.Name).ToListAsync(cancellationToken);
    }

    public Task<List<Product>> SearchAsync(string searchQuery, CancellationToken cancellationToken = default)
    {
        var normalizedQuery = searchQuery.Trim().ToLower();
        var query = BuildBaseQuery(null)
            .Where(product =>
                product.Name.ToLower().Contains(normalizedQuery) ||
                product.Description.ToLower().Contains(normalizedQuery) ||
                (product.Category != null && product.Category.Name.ToLower().Contains(normalizedQuery)));

        return query.OrderBy(product => product.Name).ToListAsync(cancellationToken);
    }

    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Products.Include(product => product.Category).FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default) =>
        await dbContext.Products.AddAsync(product, cancellationToken);

    public void Update(Product product) => dbContext.Products.Update(product);

    public void Remove(Product product) => dbContext.Products.Remove(product);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);

    private IQueryable<Product> BuildBaseQuery(int? categoryId)
    {
        var query = dbContext.Products
            .AsNoTracking()
            .Include(product => product.Category)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(product => product.CategoryId == categoryId.Value);
        }

        return query;
    }
}
