using Microsoft.AspNetCore.SignalR;

namespace x4_api_hub;

public class PresenceHub(PresenceTracker tracker) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var ctx = Context.GetHttpContext()!;
        var entry = new PresenceEntry(
            ctx.Request.Query["deviceId"].FirstOrDefault(),
            ctx.Request.Query["username"].FirstOrDefault(),
            ctx.Request.Query["displayName"].FirstOrDefault(),
            ctx.Request.Query["browser"].FirstOrDefault(),
            ctx.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "127.0.0.1",
            DateTime.UtcNow
        );
        tracker.AddConnection(Context.ConnectionId, entry);
        await Clients.All.SendAsync("OnlineCount", tracker.Count);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        tracker.RemoveConnection(Context.ConnectionId);
        await Clients.All.SendAsync("OnlineCount", tracker.Count);
        await base.OnDisconnectedAsync(ex);
    }
}
