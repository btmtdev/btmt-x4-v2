using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/testers")]
public class TesterController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.AppTesters.OrderBy(t => t.UserKey).ToListAsync();
        return Ok(ApiResponse.Success(list));
    }

    [HttpGet("check/{userKey}")]
    public async Task<IActionResult> Check(string userKey)
    {
        var exists = await db.AppTesters.AnyAsync(t => t.UserKey == userKey);
        return Ok(ApiResponse.Success(new { is_tester = exists }));
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] TesterDto dto)
    {
        if (await db.AppTesters.AnyAsync(t => t.UserKey == dto.UserKey))
            return Ok(ApiResponse.Success(new { message = "already_exists" }));
        db.AppTesters.Add(new AppTester { UserKey = dto.UserKey, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { message = "added" }));
    }

    [HttpDelete("{userKey}")]
    public async Task<IActionResult> Remove(string userKey)
    {
        var entity = await db.AppTesters.FindAsync(userKey);
        if (entity != null) { db.AppTesters.Remove(entity); await db.SaveChangesAsync(); }
        return Ok(ApiResponse.Success(new { message = "removed" }));
    }
}

public record TesterDto(string UserKey);
