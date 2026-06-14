using System.Collections.Concurrent;

namespace x4_api_hub;

public class PresenceTracker
{
    private readonly ConcurrentDictionary<string, PresenceEntry> _connections = new();

    public int Count => _connections.Count;

    public void AddConnection(string connectionId, PresenceEntry entry)
    {
        _connections[connectionId] = entry;
    }

    public void RemoveConnection(string connectionId)
    {
        _connections.TryRemove(connectionId, out _);
    }

    public IEnumerable<PresenceEntry> GetAll() => _connections.Values;
}

public record PresenceEntry(string? DeviceId, string? Username, string? DisplayName, string? Browser, string? IpAddress, DateTime ConnectedAt);
