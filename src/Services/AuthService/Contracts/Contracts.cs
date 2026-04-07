namespace AuthService.Contracts;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string User = "User";
}

public sealed record RegisterRequest(string FullName, string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(Guid UserId, string FullName, string Email, string Role, string Token);

public sealed record UserProfile(Guid UserId, string FullName, string Email, string Role);
