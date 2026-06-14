using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Data.Entities;
using x4_api_core.Models;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/tickets")]
public class TicketController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? user_key, [FromQuery] string? status)
    {
        var q = db.UserTickets.Where(t => t.IsDeleted != true).AsQueryable();
        if (!string.IsNullOrEmpty(user_key)) q = q.Where(t => t.CreatedBy == user_key);
        if (!string.IsNullOrEmpty(status)) q = q.Where(t => t.Status == status);
        return Ok(ApiResponse.Success(await q.OrderByDescending(t => t.CreatedAt).ToListAsync()));
    }

    [HttpGet("{ticketKey}")]
    public async Task<IActionResult> Get(string ticketKey)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        var history = await db.UserTicketHistories
            .Where(h => h.TicketKey == ticketKey && h.IsDeleted != true)
            .OrderBy(h => h.UpdatedAt).ToListAsync();
        return Ok(ApiResponse.Success(new { ticket, history }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        var now = DateTime.UtcNow;
        var prefix = now.ToString("yy");
        var lastKey = await db.UserTickets.Where(t => t.Key.StartsWith(prefix)).OrderByDescending(t => t.Key).Select(t => t.Key).FirstOrDefaultAsync();
        var seq = lastKey != null && int.TryParse(lastKey[2..], out var n) ? n + 1 : 1;
        var key = $"{prefix}{seq:D4}";
        db.UserTickets.Add(new UserTicket
        {
            Key = key, Category = dto.Category, Topic = dto.Topic,
            Description = dto.Description, Priority = dto.Priority, Status = "open",
            Path = dto.Path, CreatedBy = dto.CreatedBy, CreatedAt = now, UpdatedAt = now
        });
        db.UserTicketHistories.Add(new UserTicketHistory
        { TicketKey = key, UpdatedBy = dto.CreatedBy, UpdatedAt = now, Action = "created", Comment = dto.Topic });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success(new { key }));
    }

    [HttpPut("{ticketKey}")]
    public async Task<IActionResult> UpdateTicket(string ticketKey, [FromBody] System.Text.Json.JsonElement body)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        if (ticket == null) return NotFound();
        if (body.TryGetProperty("topic", out var topic)) ticket.Topic = topic.GetString()!;
        if (body.TryGetProperty("category", out var category)) ticket.Category = category.GetString()!;
        if (body.TryGetProperty("priority", out var priority)) ticket.Priority = priority.GetString()!;
        ticket.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPut("{ticketKey}/status")]
    public async Task<IActionResult> ChangeStatus(string ticketKey, [FromBody] ChangeStatusDto dto)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        if (ticket == null) return NotFound();
        ticket.Status = dto.Status; ticket.UpdatedAt = DateTime.UtcNow;
        db.UserTicketHistories.Add(new UserTicketHistory
        { TicketKey = ticketKey, UpdatedBy = dto.UserKey, UpdatedAt = DateTime.UtcNow, Action = $"status:{dto.Status}", Comment = dto.Comment });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPut("{ticketKey}/assign")]
    public async Task<IActionResult> Assign(string ticketKey, [FromBody] AssignDto dto)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        if (ticket == null) return NotFound();
        ticket.AssignedTo = dto.AssignedTo; ticket.UpdatedAt = DateTime.UtcNow;
        db.UserTicketHistories.Add(new UserTicketHistory
        { TicketKey = ticketKey, UpdatedBy = dto.UserKey, UpdatedAt = DateTime.UtcNow, Action = "assigned", Comment = $"Assigned to {dto.AssignedTo}" });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpPost("{ticketKey}/comment")]
    public async Task<IActionResult> AddComment(string ticketKey, [FromBody] CommentDto dto)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        if (ticket == null) return NotFound();
        ticket.UpdatedAt = DateTime.UtcNow;
        db.UserTicketHistories.Add(new UserTicketHistory
        { TicketKey = ticketKey, UpdatedBy = dto.UserKey, UpdatedAt = DateTime.UtcNow, Action = "comment", Comment = dto.Comment });
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("{ticketKey}/history/{historyId}")]
    public async Task<IActionResult> DeleteHistory(string ticketKey, int historyId)
    {
        var h = await db.UserTicketHistories.FirstOrDefaultAsync(x => x.Id == historyId && x.TicketKey == ticketKey);
        if (h != null) { h.IsDeleted = true; await db.SaveChangesAsync(); }
        return Ok(ApiResponse.Success());
    }

    [HttpDelete("{ticketKey}")]
    public async Task<IActionResult> Delete(string ticketKey)
    {
        var ticket = await db.UserTickets.FindAsync(ticketKey);
        if (ticket != null) { ticket.IsDeleted = true; await db.SaveChangesAsync(); }
        return Ok(ApiResponse.Success());
    }
}
