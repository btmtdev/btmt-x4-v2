using System.Text.Json.Serialization;

namespace x4_api_core.Models;

// === Gateway Config ===

public class GatewayOptions
{
    public string BaseUrl { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
}

// === Gateway Responses ===

public class GatewayTokenResponse
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = "";
    [JsonPropertyName("expiration_in")] public long ExpirationIn { get; set; }
}

public class GatewayHrLoginResponse
{
    [JsonPropertyName("status")] public bool Status { get; set; }
}

public class GatewayAdLoginResponse
{
    [JsonPropertyName("status")] public bool Status { get; set; }
    [JsonPropertyName("data")] public GatewayAdLoginData? Data { get; set; }
}

public class GatewayAdLoginData
{
    [JsonPropertyName("eid")] public string? EmpCode { get; set; }
    [JsonPropertyName("username")] public string? Username { get; set; }
}

public class GatewayHrProfileResponse
{
    [JsonPropertyName("status")] public bool Status { get; set; }
    [JsonPropertyName("data")] public GatewayHrProfileData? Data { get; set; }
}

public class GatewayHrProfileData
{
    [JsonPropertyName("emp_code")] public string? EmpCode { get; set; }
    [JsonPropertyName("emp_th_prefix")] public string? ThPrefix { get; set; }
    [JsonPropertyName("emp_th_fname")] public string? ThFname { get; set; }
    [JsonPropertyName("emp_th_lname")] public string? ThLname { get; set; }
    [JsonPropertyName("emp_en_prefix")] public string? EnPrefix { get; set; }
    [JsonPropertyName("emp_en_fname")] public string? EnFname { get; set; }
    [JsonPropertyName("emp_en_lname")] public string? EnLname { get; set; }
    [JsonPropertyName("emp_org_code")] public string? OrgCode { get; set; }
    [JsonPropertyName("emp_org_name")] public string? OrgName { get; set; }
    [JsonPropertyName("emp_position_name")] public string? PositionName { get; set; }
    [JsonPropertyName("work_status")] public string? WorkStatus { get; set; }

    public string DisplayNameTh => $"{ThFname} {ThLname}".Trim();
    public string DisplayNameEn => $"{EnFname} {EnLname}".Trim();
}

public class GatewayAdProfileResponse
{
    [JsonPropertyName("status")] public bool Status { get; set; }
    [JsonPropertyName("data")] public GatewayAdProfileData? Data { get; set; }
}

public class GatewayAdProfileData
{
    [JsonPropertyName("eid")] public string? EmpCode { get; set; }
    [JsonPropertyName("username")] public string? AdUsername { get; set; }
    [JsonPropertyName("mail")] public string? Email { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("department")] public string? Department { get; set; }
}
