using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using x4_api_quality.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:4003");

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDbContext<QualityDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("QualityDb")));

var app = builder.Build();

app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "x4-api-quality" }));
app.MapControllers();
app.Run();
