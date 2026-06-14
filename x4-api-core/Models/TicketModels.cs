using System.Text.Json.Serialization;

namespace x4_api_core.Models;

public record CreateTicketDto(
    [property: JsonPropertyName("key")] string? Key = null,
    [property: JsonPropertyName("category")] string Category = "",
    [property: JsonPropertyName("topic")] string Topic = "",
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("priority")] string Priority = "medium",
    [property: JsonPropertyName("path")] string? Path = null,
    [property: JsonPropertyName("created_by")] string CreatedBy = "");

public record ChangeStatusDto(
    [property: JsonPropertyName("user_key")] string UserKey,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("comment")] string? Comment);

public record AssignDto(
    [property: JsonPropertyName("user_key")] string UserKey,
    [property: JsonPropertyName("assigned_to")] string AssignedTo);

public record CommentDto(
    [property: JsonPropertyName("user_key")] string UserKey,
    [property: JsonPropertyName("comment")] string Comment);
