using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;
using x4_api_core.Services;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, GatewayService gateway) : ControllerBase
{
    private static bool IsEmpCode(string s) => s.Length == 8 && s.All(char.IsDigit);
    private static string GenerateToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var input = req.Username.Trim().ToLower();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Key == input)
                ?? (!IsEmpCode(input) ? await db.Users.FirstOrDefaultAsync(u => u.AdUsername == input) : null);

        if (user == null || user.AuthMode == "gateway")
            return await HandleGatewayLogin(input, req.Password, req.Device, user);

        return await HandleLocalLogin(input, req.Password, req.Device, user);
    }

    private async Task<IActionResult> HandleLocalLogin(string input, string password, DeviceInfo? device, User? user)
    {
        if (user == null) return Unauthorized(ApiResponse.Error("INVALID_CREDENTIALS"));
        if (user.AuthMode != "local") return await HandleGatewayLogin(input, password, device, null);
        if (user.Status == "pending") return Unauthorized(ApiResponse.Error("ACCOUNT_PENDING"));
        if (user.Status == "disabled") return Unauthorized(ApiResponse.Error("ACCOUNT_LOCKED"));
        if (user.LockedUntil > DateTime.UtcNow) return Unauthorized(ApiResponse.Error("ACCOUNT_LOCKED"));
        if (user.PasswordHash != password)
        {
            user.FailedLoginCount++;
            await db.SaveChangesAsync();
            await LogLogin(user.Key, false, "invalid_credentials");
            return Unauthorized(ApiResponse.Error("INVALID_CREDENTIALS"));
        }
        user.FailedLoginCount = 0;
        user.LastLoggedIn = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await LogLogin(user.Key, true, null);
        return Ok(ApiResponse.Success(BuildLoginResponse(await CreateSession(user.Key, device), user)));
    }

    private async Task<IActionResult> HandleGatewayLogin(string input, string password, DeviceInfo? device, User? user)
    {
        string? empCode = null, adUsername = null;

        if (IsEmpCode(input))
        {
            if (!await gateway.HrLoginAsync(input, password))
            { await LogLogin(input, false, "gateway_hr_failed"); return Unauthorized(ApiResponse.Error("INVALID_CREDENTIALS")); }
            empCode = input;
        }
        else
        {
            var ad = await gateway.AdLoginAsync(input, password);
            if (ad == null) { await LogLogin(input, false, "gateway_ad_failed"); return Unauthorized(ApiResponse.Error("INVALID_CREDENTIALS")); }
            empCode = ad.EmpCode?.ToLower();
            adUsername = input;
        }
        if (empCode == null) return Unauthorized(ApiResponse.Error("INVALID_CREDENTIALS"));

        user ??= await db.Users.FirstOrDefaultAsync(u => u.Key == empCode);

        // Check work status before creating user
        var hr = await gateway.GetHrProfileAsync(empCode);
        var adp = await gateway.GetAdProfileAsync(empCode);
        if (hr?.WorkStatus != null && hr.WorkStatus != "Active")
            return Unauthorized(ApiResponse.Error("ACCOUNT_LOCKED"));

        if (user == null)
        {
            user = new User { Key = empCode, AuthMode = "gateway", Status = "pending", IsPending = true, Company = "BTMT", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        if (user.ProfileUpdatedAt == null || user.ProfileUpdatedAt.Value.Date < DateTime.UtcNow.Date)
        {
            adUsername ??= adp?.AdUsername?.ToLower();
            user.AdUsername = adUsername; user.EmpCode = empCode;
            user.DisplayNameTh = hr?.DisplayNameTh; user.DisplayNameEn = hr?.DisplayNameEn;
            user.DeptCode = hr?.OrgCode; user.DeptName = hr?.OrgName;
            user.Position = hr?.PositionName; user.Email = adp?.Email?.ToLower();
            user.ProfileUpdatedAt = DateTime.UtcNow;
        }

        user.LastLoggedIn = DateTime.UtcNow; user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (user.Status == "pending") return Unauthorized(ApiResponse.Error("ACCOUNT_PENDING"));
        if (user.Status == "disabled") return Unauthorized(ApiResponse.Error("ACCOUNT_LOCKED"));

        await LogLogin(user.Key, true, null);
        return Ok(ApiResponse.Success(BuildLoginResponse(await CreateSession(user.Key, device), user)));
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateSession([FromBody] ValidateRequest req)
    {
        var session = await db.UserSessions.FirstOrDefaultAsync(s => s.Token == req.Token && !s.IsRevoked);
        if (session == null) return Unauthorized(ApiResponse.Error("INVALID_SESSION"));
        session.LastActiveAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Key == session.UserKey);
        if (user is not { Status: "active" }) return Unauthorized(ApiResponse.Error("INVALID_SESSION"));
        return Ok(ApiResponse.Success(BuildLoginResponse(req.Token, user)));
    }

    [HttpPost("forgot-password/verify-username")]
    public async Task<IActionResult> VerifyUsername([FromBody] VerifyUsernameRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Key == req.Username.Trim().ToLower());
        if (user is not { AuthMode: "local" }) return BadRequest(ApiResponse.Error("USER_NOT_FOUND"));
        if (user.Mobile == null) return BadRequest(ApiResponse.Error("NO_MOBILE"));
        return Ok(ApiResponse.Success(new { mobile_masked = "***" + user.Mobile[^4..] }));
    }

    [HttpPost("forgot-password/verify-mobile")]
    public async Task<IActionResult> VerifyMobile([FromBody] VerifyMobileRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Key == req.Username.Trim().ToLower());
        if (user is not { AuthMode: "local" }) return BadRequest(ApiResponse.Error("INVALID_REQUEST"));
        if (user.Mobile != req.MobileNo) return BadRequest(ApiResponse.Error("MOBILE_NOT_MATCH"));
        return Ok(ApiResponse.Success(new { verified = true }));
    }

    [HttpPost("forgot-password/reset")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Key == req.Username.Trim().ToLower());
        if (user is not { AuthMode: "local" }) return BadRequest(ApiResponse.Error("INVALID_REQUEST"));
        if (user.Mobile != req.MobileNo) return BadRequest(ApiResponse.Error("INVALID_REQUEST"));
        user.PasswordHash = req.NewPassword;
        user.PasswordChangedAt = DateTime.UtcNow; user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? req)
    {
        if (req?.Token != null)
        {
            var session = await db.UserSessions.FirstOrDefaultAsync(s => s.Token == req.Token);
            if (session != null) { session.IsRevoked = true; await db.SaveChangesAsync(); }
        }
        return Ok(ApiResponse.Success());
    }

    private async Task<string> CreateSession(string userKey, DeviceInfo? device)
    {
        var token = GenerateToken();
        db.UserSessions.Add(new UserSession
        {
            UserKey = userKey, Token = token,
            DeviceId = Request.Headers["X-Device-Id"].FirstOrDefault(),
            DeviceName = device?.Name, DeviceOs = device?.Os, Browser = device?.Browser,
            IpAddress = GetIPv4(), CreatedAt = DateTime.UtcNow, LastActiveAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return token;
    }

    private async Task LogLogin(string userKey, bool success, string? reason)
    {
        db.UserLoginHistories.Add(new UserLoginHistory
        {
            UserKey = userKey, CreatedAt = DateTime.UtcNow,
            IpAddress = GetIPv4(), Device = Request.Headers["User-Agent"].FirstOrDefault(),
            IsSuccess = success, FailureReason = reason
        });
        await db.SaveChangesAsync();
    }

    private string GetIPv4()
    {
        var ip = HttpContext.Connection.RemoteIpAddress;
        if (ip == null) return "127.0.0.1";
        if (ip.IsIPv4MappedToIPv6) return ip.MapToIPv4().ToString();
        return ip.ToString() == "::1" ? "127.0.0.1" : ip.MapToIPv4().ToString();
    }

    private static object BuildLoginResponse(string token, User u) => new
    {
        token,
        user = new
        {
            key = u.Key, auth_mode = u.AuthMode, status = u.Status,
            display_name_th = u.DisplayNameTh, display_name_en = u.DisplayNameEn,
            ad_username = u.AdUsername, emp_code = u.EmpCode, position = u.Position,
            dept_code = u.DeptCode, dept_name = u.DeptName,
            email = u.Email, mobile = u.Mobile, company = u.Company,
        }
    };
}
