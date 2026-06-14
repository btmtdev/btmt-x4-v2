using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var settings = await db.AppSettings.OrderBy(s => s.Key)
            .Select(s => new { s.Key, s.Value, s.Description }).ToListAsync();
        return Ok(ApiResponse.Success(settings));
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> Get(string key)
    {
        var s = await db.AppSettings.FindAsync(key);
        return Ok(ApiResponse.Success(new { key, value = s?.Value }));
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] SettingDto dto)
    {
        var s = await db.AppSettings.FindAsync(key);
        if (s == null)
        {
            db.AppSettings.Add(new AppSetting { Key = key, Value = dto.Value, Description = dto.Description, UpdatedAt = DateTime.UtcNow });
        }
        else
        {
            s.Value = dto.Value;
            if (dto.Description != null) s.Description = dto.Description;
            s.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    // === USER SETTINGS ===

    [HttpGet("user/{userKey}")]
    public async Task<IActionResult> GetUserSettings(string userKey)
    {
        var settings = await db.UserSettings.Where(s => s.UserKey == userKey).ToListAsync();
        var dict = settings.ToDictionary(s => s.Key, s => s.Value);
        return Ok(ApiResponse.Success(dict));
    }

    [HttpPut("user/{userKey}")]
    public async Task<IActionResult> SetUserSettings(string userKey, [FromBody] Dictionary<string, string> settings)
    {
        foreach (var kv in settings)
        {
            var existing = await db.UserSettings.FindAsync(userKey, kv.Key);
            if (existing != null)
                existing.Value = kv.Value;
            else
                db.UserSettings.Add(new UserSetting { UserKey = userKey, Key = kv.Key, Value = kv.Value });
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPost("avatars")]
    public async Task<IActionResult> GetAvatars([FromBody] AvatarRequest req)
    {
        var dict = await db.UserSettings
            .Where(s => s.Key == "avatar_url" && req.Usernames.Contains(s.UserKey))
            .ToDictionaryAsync(s => s.UserKey, s => s.Value);
        return Ok(ApiResponse.Success(dict));
    }
}
