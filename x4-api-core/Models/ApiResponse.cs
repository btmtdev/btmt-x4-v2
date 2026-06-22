namespace x4_api_core.Models;

public static class ApiResponse
{
    public static object Success(object? data = null) => new { status = true, data };

    public static object Error(string errorCode, string errorDescription = "") => new
    {
        status = false,
        error = new { error_code = errorCode, error_description = errorDescription }
    };
}
