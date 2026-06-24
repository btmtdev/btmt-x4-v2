using Microsoft.AspNetCore.Mvc;
using x4_api_warehouse.Models;

namespace x4_api_warehouse.Controllers;

[Route("api/picking")]
[ApiController]
public class PhotoController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public PhotoController(IWebHostEnvironment env) => _env = env;

    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile file, [FromForm] string? gcos_no)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse<object>(false, null, new { error_code = "NO_FILE" }));

        var folder = Path.Combine(_env.ContentRootPath, "Uploads", gcos_no ?? "unknown");
        Directory.CreateDirectory(folder);

        var fileName = $"{DateTime.Now:yyyyMMddHHmmss}_{file.FileName}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/{gcos_no ?? "unknown"}/{fileName}";
        return Ok(new ApiResponse<object>(true, new { url, file_name = fileName }));
    }

    [HttpGet("{gcosNo}/photos")]
    public IActionResult GetPhotos(string gcosNo)
    {
        var folder = Path.Combine(_env.ContentRootPath, "Uploads", gcosNo);
        if (!Directory.Exists(folder))
            return Ok(new ApiResponse<List<object>>(true, new List<object>()));

        var photos = Directory.GetFiles(folder)
            .Select(f => new { url = $"/uploads/{gcosNo}/{Path.GetFileName(f)}", file_name = Path.GetFileName(f) })
            .ToList<object>();

        return Ok(new ApiResponse<List<object>>(true, photos));
    }
}
