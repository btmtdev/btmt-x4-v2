using System.Text;
using x4_api_core.Models;

namespace x4_api_core.Services;

public class GatewayService(HttpClient http, GatewayOptions opts)
{
    private string? _token;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public async Task<string> GetTokenAsync()
    {
        if (_token != null && DateTime.UtcNow < _tokenExpiry)
            return _token;

        var resp = await http.PostAsJsonAsync($"{opts.BaseUrl}/token/v1/request",
            new { client_id = opts.ClientId, client_secret = opts.ClientSecret });
        resp.EnsureSuccessStatusCode();
        var result = await resp.Content.ReadFromJsonAsync<GatewayTokenResponse>()
            ?? throw new Exception("Empty token response");
        _token = result.AccessToken;
        _tokenExpiry = DateTimeOffset.FromUnixTimeMilliseconds(result.ExpirationIn).UtcDateTime.AddSeconds(-30);
        return _token;
    }

    public async Task<bool> HrLoginAsync(string empCode, string password)
    {
        var token = await GetTokenAsync();
        var req = new HttpRequestMessage(HttpMethod.Post, $"{opts.BaseUrl}/user/v1/hr/login");
        req.Headers.Authorization = new("Bearer", token);
        req.Content = JsonContent.Create(new { username = empCode, password });
        var resp = await http.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return false;
        var result = await resp.Content.ReadFromJsonAsync<GatewayHrLoginResponse>();
        return result?.Status == true;
    }

    public async Task<GatewayAdLoginData?> AdLoginAsync(string username, string password)
    {
        var token = await GetTokenAsync();
        var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(
            username + ":" + Convert.ToBase64String(Encoding.UTF8.GetBytes(password))));
        var req = new HttpRequestMessage(HttpMethod.Post, $"{opts.BaseUrl}/user/v1/ad/login");
        req.Headers.Authorization = new("Bearer", token);
        req.Content = JsonContent.Create(new { username, password = encoded });
        var resp = await http.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return null;
        var result = await resp.Content.ReadFromJsonAsync<GatewayAdLoginResponse>();
        return result?.Status == true ? result.Data : null;
    }

    public async Task<GatewayAdProfileData?> GetAdProfileAsync(string identifier)
    {
        var token = await GetTokenAsync();
        // If numeric (empcode) → use profile-id endpoint
        var isEmpCode = identifier.All(char.IsDigit);
        var url = isEmpCode
            ? $"{opts.BaseUrl}/user/v1/ad/profile-id/{identifier}"
            : $"{opts.BaseUrl}/user/v1/ad/profile/{identifier}";
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new("Bearer", token);
        var resp = await http.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return null;
        var result = await resp.Content.ReadFromJsonAsync<GatewayAdProfileResponse>();
        return result?.Status == true ? result.Data : null;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string prefix)
    {
        var token = await GetTokenAsync();
        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(fileStream), "file", fileName);
        content.Add(new StringContent(prefix), "prefix");
        var req = new HttpRequestMessage(HttpMethod.Post, $"{opts.BaseUrl}/tools/v1/upload");
        req.Headers.Authorization = new("Bearer", token);
        req.Content = content;
        var resp = await http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadAsStringAsync();
    }

    public async Task<GatewayHrProfileData?> GetHrProfileAsync(string empCode)
    {
        var token = await GetTokenAsync();
        var req = new HttpRequestMessage(HttpMethod.Get, $"{opts.BaseUrl}/user/v1/hr/profile/{empCode}");
        req.Headers.Authorization = new("Bearer", token);
        var resp = await http.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return null;
        var result = await resp.Content.ReadFromJsonAsync<GatewayHrProfileResponse>();
        return result?.Status == true ? result.Data : null;
    }
}
