using AuthService.Models;
using AuthService.Repositories;
using AuthService.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace AuthService.Services;

public sealed class AuthServiceHandler(
    IUserRepository userRepository,
    IPasswordHasher<AppUser> passwordHasher,
    IConfiguration configuration) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new AppUser
        {
            FullName = request.FullName,
            Email = request.Email.Trim().ToLowerInvariant(),
            Role = AppRoles.User
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return ToAuthResponse(user);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null)
        {
            return null;
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        return verification == PasswordVerificationResult.Failed ? null : ToAuthResponse(user);
    }

    public async Task<UserProfile?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        return user is null ? null : new UserProfile(user.Id, user.FullName, user.Email, user.Role);
    }

    private AuthResponse ToAuthResponse(AppUser user)
    {
        var issuer = configuration["Jwt:Issuer"] ?? "microcommerce-auth";
        var token = $"dev-token-{issuer}-{user.Role.ToLowerInvariant()}-{user.Id:N}";
        return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, token);
    }
}

