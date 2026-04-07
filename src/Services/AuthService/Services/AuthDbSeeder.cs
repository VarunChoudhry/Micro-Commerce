using AuthService.Data;
using AuthService.Models;
using AuthService.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Services;

public static class AuthDbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();

        await dbContext.Database.EnsureCreatedAsync();

        if (await dbContext.Users.AnyAsync())
        {
            return;
        }

        var admin = new AppUser
        {
            FullName = "System Admin",
            Email = "admin@microcommerce.local",
            Role = AppRoles.Admin
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin@123");

        var user = new AppUser
        {
            FullName = "Demo User",
            Email = "user@microcommerce.local",
            Role = AppRoles.User
        };
        user.PasswordHash = passwordHasher.HashPassword(user, "User@123");

        dbContext.Users.AddRange(admin, user);
        await dbContext.SaveChangesAsync();
    }
}



