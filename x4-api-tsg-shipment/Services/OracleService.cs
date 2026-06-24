using Oracle.ManagedDataAccess.Client;

namespace x4_api_tsg_shipment.Services;

public class OracleService(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("Oracle")!;

    public OracleConnection CreateConnection() => new(_connectionString);

    public async Task<List<Dictionary<string, object?>>> QueryAsync(string sql, params OracleParameter[] parameters)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = new OracleCommand(sql, conn);
        foreach (var p in parameters) cmd.Parameters.Add(p);

        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<Dictionary<string, object?>>();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            results.Add(row);
        }
        return results;
    }
}
