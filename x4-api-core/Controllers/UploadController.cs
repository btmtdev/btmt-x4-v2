using Microsoft.AspNetCore.Mvc;
using x4_api_core.Services;

namespace x4_api_core.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController(GatewayService gateway) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? prefix)
    {
        using var stream = file.OpenReadStream();
        var json = await gateway.UploadAsync(stream, file.FileName, prefix ?? "x4-avatars");
        return Content(json, "application/json");
    }
}
