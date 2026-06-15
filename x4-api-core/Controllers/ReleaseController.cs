using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/releases")]
public class ReleaseController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.AppReleaseHistories
            .OrderByDescending(r => r.ReleasedAt)
            .Select(r => new { r.Id, r.Version, r.Title, r.Description, r.ReleasedAt })
            .ToListAsync();
        return Ok(ApiResponse.Success(list));
    }

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest()
    {
        var latest = await db.AppReleaseHistories
            .OrderByDescending(r => r.ReleasedAt)
            .Select(r => new { r.Version })
            .FirstOrDefaultAsync();
        return Ok(ApiResponse.Success(latest));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReleaseDto dto)
    {
        var entity = new AppReleaseHistory
        {
            Version = dto.Version,
            Title = dto.Title,
            Description = dto.Description,
            ReleasedAt = DateTime.UtcNow
        };
        db.AppReleaseHistories.Add(entity);
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { entity.Id, entity.Version }));
    }
}

public record ReleaseDto(string Version, string Title, string? Description);
