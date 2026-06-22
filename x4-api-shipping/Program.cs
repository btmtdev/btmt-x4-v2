using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using x4_api_shipping.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:4001");

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower);

builder.Services.AddDbContext<ShippingDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("ShippingDb")));

var app = builder.Build();

app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "x4-api-shipping" }));
app.MapControllers();
app.Run();
