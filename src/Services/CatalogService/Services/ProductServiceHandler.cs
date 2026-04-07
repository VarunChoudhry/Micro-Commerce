using CatalogService.Contracts;
using CatalogService.Integration;
using CatalogService.Models;
using CatalogService.Repositories;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace CatalogService.Services;

public sealed class ProductServiceHandler(
    IProductRepository productRepository,
    ICategoryRepository categoryRepository,
    IInventorySyncClient inventorySyncClient,
    ILogger<ProductServiceHandler> logger,
    ICacheService cache,
    ElasticsearchClient es) : IProductService
{
    public async Task<IReadOnlyCollection<ProductDto>> GetAllAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetProductsCacheKey(categoryId);

        var cached = await cache.GetAsync<List<ProductDto>>(cacheKey);
        if (cached != null)
        {
            return cached;
        }

        var products = (await productRepository.GetAllAsync(categoryId, cancellationToken))
            .Select(MapToDto)
            .ToList();

        await cache.SetAsync(cacheKey, products, TimeSpan.FromMinutes(5));
        await TryIndexProductsAsync(products, cancellationToken);

        return products;
    }

    public async Task<IReadOnlyCollection<ProductDto>> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await GetAllAsync(null, cancellationToken);
        }

        var normalizedQuery = query.Trim();

        try
        {
            var response = await es.SearchAsync<ProductDto>(new SearchRequest<ProductDto>("products")
            {
                Query = new MultiMatchQuery
                {
                    Fields = new[] { "name", "description", "categoryName" },
                    Query = normalizedQuery
                }
            }, cancellationToken);

            var elasticResults = response.Documents.ToList();
            if (elasticResults.Count > 0)
            {
                return elasticResults;
            }

            logger.LogInformation("Elasticsearch returned no products for query {Query}. Falling back to SQL search.", normalizedQuery);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Elasticsearch search failed for query {Query}. Falling back to SQL search.", normalizedQuery);
        }

        var fallbackResults = (await productRepository.SearchAsync(normalizedQuery, cancellationToken))
            .Select(MapToDto)
            .ToList();

        await TryIndexProductsAsync(fallbackResults, cancellationToken);
        return fallbackResults;
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new InvalidOperationException("Category does not exist.");

        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            ImageBase64 = NormalizeImage(request.ImageBase64),
            CategoryId = request.CategoryId,
            Category = category
        };

        await productRepository.AddAsync(product, cancellationToken);
        await productRepository.SaveChangesAsync(cancellationToken);
        await InvalidateProductListCacheAsync(product.CategoryId);
        await SyncInventoryAsync(product, cancellationToken);

        var dto = MapToDto(product);
        await TryIndexProductAsync(dto, cancellationToken);
        return dto;
    }

    public async Task<ProductDto?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return null;
        }

        var previousCategoryId = product.CategoryId;
        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new InvalidOperationException("Category does not exist.");

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.ImageBase64 = NormalizeImage(request.ImageBase64);
        product.CategoryId = request.CategoryId;
        product.Category = category;

        productRepository.Update(product);
        await productRepository.SaveChangesAsync(cancellationToken);
        await InvalidateProductListCacheAsync(previousCategoryId, product.CategoryId);
        await SyncInventoryAsync(product, cancellationToken);

        var dto = MapToDto(product);
        await TryIndexProductAsync(dto, cancellationToken);
        return dto;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return false;
        }

        productRepository.Remove(product);
        await productRepository.SaveChangesAsync(cancellationToken);
        await InvalidateProductListCacheAsync(product.CategoryId);
        await TryDeleteProductFromIndexAsync(product.Id, cancellationToken);

        return true;
    }

    private static ProductDto MapToDto(Product product) =>
        new(product.Id, product.Name, product.Description, product.Price, product.Stock, product.ImageBase64, product.CategoryId, product.Category?.Name ?? string.Empty);

    private static string? NormalizeImage(string? imageBase64)
    {
        if (string.IsNullOrWhiteSpace(imageBase64))
        {
            return null;
        }

        return imageBase64.Trim();
    }

    private async Task InvalidateProductListCacheAsync(params int[] categoryIds)
    {
        var cacheKeys = new HashSet<string>(StringComparer.Ordinal)
        {
            GetProductsCacheKey(null)
        };

        foreach (var categoryId in categoryIds)
        {
            cacheKeys.Add(GetProductsCacheKey(categoryId));
        }

        foreach (var cacheKey in cacheKeys)
        {
            await cache.RemoveAsync(cacheKey);
        }
    }

    private static string GetProductsCacheKey(int? categoryId) => $"products:{categoryId ?? 0}";

    private async Task SyncInventoryAsync(Product product, CancellationToken cancellationToken)
    {
        try
        {
            await inventorySyncClient.UpsertAsync(product.Id, product.Name, product.Stock, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Inventory sync failed for product {ProductId}.", product.Id);
        }
    }

    private async Task TryIndexProductsAsync(IEnumerable<ProductDto> products, CancellationToken cancellationToken)
    {
        foreach (var product in products)
        {
            await TryIndexProductAsync(product, cancellationToken);
        }
    }

    private async Task TryIndexProductAsync(ProductDto product, CancellationToken cancellationToken)
    {
        try
        {
            await es.IndexAsync(product, index => index.Index("products").Id(product.Id), cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Elasticsearch index sync failed for product {ProductId}.", product.Id);
        }
    }

    private async Task TryDeleteProductFromIndexAsync(int productId, CancellationToken cancellationToken)
    {
        try
        {
            await es.DeleteAsync<ProductDto>(productId, delete => delete.Index("products"), cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Elasticsearch delete sync failed for product {ProductId}.", productId);
        }
    }
}