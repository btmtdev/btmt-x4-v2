using System.Text.Json.Serialization;

namespace x4_api_core.Models;

public record SettingDto(
    [property: JsonPropertyName("value")] string Value,
    [property: JsonPropertyName("description")] string? Description);

public record AvatarRequest([property: JsonPropertyName("usernames")] string[] Usernames);
