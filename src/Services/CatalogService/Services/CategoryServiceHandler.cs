using CatalogService.Contracts;
using CatalogService.Models;
using CatalogService.Repositories;

namespace CatalogService.Services;

public sealed class CategoryServiceHandler(ICategoryRepository categoryRepository, ICacheService cache) : ICategoryService
{
    //public async Task<IReadOnlyCollection<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
    //    (await categoryRepository.GetAllAsync(cancellationToken))
    //    .Select(category => new CategoryDto(category.Id, category.Name))
    //    .ToList();


    public async Task<IReadOnlyCollection<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cacheKey = "categories:all";

        var cached = await cache.GetAsync<List<CategoryDto>>(cacheKey);
        if (cached != null)
            return cached;

        var categories = (await categoryRepository.GetAllAsync(cancellationToken))
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToList();

        await cache.SetAsync(cacheKey, categories, TimeSpan.FromMinutes(30));

        return categories;
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = new Category { Name = request.Name };
        await categoryRepository.AddAsync(category, cancellationToken);
        await categoryRepository.SaveChangesAsync(cancellationToken);
       await InvalidateCategoryCache();
        return new CategoryDto(category.Id, category.Name);
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return null;
        }

        category.Name = request.Name;
        categoryRepository.Update(category);
        await categoryRepository.SaveChangesAsync(cancellationToken);
        await InvalidateCategoryCache();
        return new CategoryDto(category.Id, category.Name);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return false;
        }

        categoryRepository.Remove(category);
        await categoryRepository.SaveChangesAsync(cancellationToken);
        await InvalidateCategoryCache();
        return true;
    }
    private async Task InvalidateCategoryCache()
    {
        await cache.RemoveAsync("categories:all");
    }
}

