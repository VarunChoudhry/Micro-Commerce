using StackExchange.Redis;
using System.Text.Json;

namespace CatalogService.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDatabase _db;

        public RedisCacheService(IConnectionMultiplexer redis)
        {
            _db = redis.GetDatabase();
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            var value = await _db.StringGetAsync(key);
            if (value.IsNullOrEmpty) return default;

            return JsonSerializer.Deserialize<T>(value!);
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry)
        {
            var json = JsonSerializer.Serialize(value);

            if (expiry.HasValue)
                await _db.StringSetAsync(key, json, expiry.Value);
            else
                await _db.StringSetAsync(key, json);
        }

        public async Task RemoveAsync(string key)
        {
            await _db.KeyDeleteAsync(key);
        }
    }
}
