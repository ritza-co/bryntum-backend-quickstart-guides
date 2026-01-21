using Microsoft.EntityFrameworkCore;
using SchedulerProApi.Models;

namespace SchedulerProApi.Data
{
    public class SchedulerProContext : DbContext
    {
        public SchedulerProContext(DbContextOptions<SchedulerProContext> options) : base(options) { }

        public DbSet<Event> Events { get; set; } = null!;
        public DbSet<Resource> Resources { get; set; } = null!;
        public DbSet<Assignment> Assignments { get; set; } = null!;
        public DbSet<Dependency> Dependencies { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Event>(entity =>
            {
                entity.ToTable("events");
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<Resource>(entity =>
            {
                entity.ToTable("resources");
                entity.HasKey(r => r.Id);
            });

            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.ToTable("assignments");
                entity.HasKey(a => a.Id);
                entity.HasIndex(a => a.EventId);
                entity.HasIndex(a => a.ResourceId);

                // Configure cascade delete
                entity.HasOne<Event>()
                    .WithMany()
                    .HasForeignKey(a => a.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Resource>()
                    .WithMany()
                    .HasForeignKey(a => a.ResourceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Dependency>(entity =>
            {
                entity.ToTable("dependencies");
                entity.HasKey(d => d.Id);
                entity.HasIndex(d => d.From);
                entity.HasIndex(d => d.To);

                // Configure cascade delete for dependencies
                entity.HasOne<Event>()
                    .WithMany()
                    .HasForeignKey(d => d.From)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Event>()
                    .WithMany()
                    .HasForeignKey(d => d.To)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
