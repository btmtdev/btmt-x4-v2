using System.Data.Odbc;

namespace x4_api_warehouse.Data;

public class WarehouseDb(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("Warehouse")!;

    public OdbcConnection CreateConnection() => new(_connectionString);
}
