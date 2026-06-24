namespace x4_api_warehouse.Models;

public record ApiResponse<T>(bool Status, T? Data, object? Error = null);
