using Microsoft.EntityFrameworkCore;
using GridApi.Models;

namespace GridApi.Data
{
    public class GridContext : DbContext
    {
        public GridContext(DbContextOptions<GridContext> options) : base(options) { }

        public DbSet<Player> Players { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Player>(entity =>
            {
                entity.ToTable("players");
                entity.HasKey(p => p.Id);
            });
        }
    }
}
