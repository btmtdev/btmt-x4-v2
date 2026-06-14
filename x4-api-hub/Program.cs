using x4_api_hub;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:4100");

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddSignalR();
builder.Services.AddSingleton<PresenceTracker>();

var app = builder.Build();

app.UseCors();
app.MapHub<PresenceHub>("/hub/presence");

app.MapGet("/api/online-sessions", (PresenceTracker tracker) =>
    Results.Ok(new { status = true, data = tracker.GetAll() }));

app.Run();
