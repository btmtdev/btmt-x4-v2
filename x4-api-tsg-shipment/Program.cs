using System.Text.Json;
using x4_api_tsg_shipment.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:4004");

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower);

builder.Services.AddSingleton<OracleService>();

var app = builder.Build();

app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "x4-api-tsg-shipment" }));
app.MapControllers();
app.Run();
