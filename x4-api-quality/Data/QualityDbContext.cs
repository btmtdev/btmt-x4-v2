using Microsoft.EntityFrameworkCore;
using x4_api_quality.Data.Entities;

namespace x4_api_quality.Data;

public class QualityDbContext(DbContextOptions<QualityDbContext> options) : DbContext(options)
{
    public DbSet<BlacklistRequest> BlacklistRequests => Set<BlacklistRequest>();
    public DbSet<BlacklistItem> BlacklistItems => Set<BlacklistItem>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<BlacklistRequest>(e =>
        {
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.RequestNo).IsUnique();
        });

        m.Entity<BlacklistItem>(e =>
        {
            e.HasIndex(x => x.Barcode);
            e.HasOne(x => x.Request).WithMany(x => x.Items).HasForeignKey(x => x.RequestId);
        });
    }
}
