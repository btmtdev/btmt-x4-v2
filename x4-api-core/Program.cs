using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using x4_api_core.Data;
using x4_api_core.Models;
using x4_api_core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:4000");

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Gateway service
var gatewayOpts = builder.Configuration.GetSection("Gateway").Get<GatewayOptions>()!;
builder.Services.AddSingleton(gatewayOpts);
builder.Services.AddHttpClient<GatewayService>();
builder.Services.AddSingleton<GatewayService>(sp =>
    new GatewayService(sp.GetRequiredService<IHttpClientFactory>().CreateClient(), gatewayOpts));

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.Run();
