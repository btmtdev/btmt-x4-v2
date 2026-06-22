using System.Text.Json.Serialization;

namespace x4_api_core.Models;

// === Auth Requests ===

public record LoginRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("password")] string Password,
    [property: JsonPropertyName("device")] DeviceInfo? Device,
    [property: JsonPropertyName("visitor_id")] string? VisitorId);

public record DeviceInfo(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("os")] string? Os,
    [property: JsonPropertyName("browser")] string? Browser);

public record ValidateRequest([property: JsonPropertyName("token")] string Token);

public record LogoutRequest([property: JsonPropertyName("token")] string? Token);

public record HeartbeatRequest(
    [property: JsonPropertyName("visitor_id")] string? VisitorId,
    [property: JsonPropertyName("device")] string? Device,
    [property: JsonPropertyName("token")] string? Token);

public record VerifyUsernameRequest([property: JsonPropertyName("username")] string Username);

public record VerifyMobileRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("mobile_no")] string MobileNo);

public record ResetPasswordRequest(
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("mobile_no")] string MobileNo,
    [property: JsonPropertyName("new_password")] string NewPassword);
