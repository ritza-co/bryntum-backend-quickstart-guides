using Microsoft.EntityFrameworkCore;
using GanttApi.Models;

namespace GanttApi.Data
{
    public class GanttContext : DbContext
    {
        public GanttContext(DbContextOptions<GanttContext> options) : base(options) { }

        public DbSet<GanttTask> Tasks { get; set; } = null!;
        public DbSet<GanttDependency> Dependencies { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<GanttTask>(entity =>
            {
                entity.ToTable("tasks");
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Id).ValueGeneratedOnAdd();

                // Self-referencing relationship for parent-child tasks
                // OnDelete Cascade ensures children are deleted when parent is deleted
                entity.HasMany<GanttTask>()
                    .WithOne()
                    .HasForeignKey(t => t.ParentId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<GanttDependency>(entity =>
            {
                entity.ToTable("dependencies");
                entity.HasKey(d => d.Id);
                entity.Property(d => d.Id).ValueGeneratedOnAdd();

                // Foreign key relationships to tasks
                // OnDelete Cascade ensures dependencies are deleted when associated tasks are deleted
                entity.HasOne<GanttTask>()
                    .WithMany()
                    .HasForeignKey(d => d.FromEvent)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<GanttTask>()
                    .WithMany()
                    .HasForeignKey(d => d.ToEvent)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Cascade);

                // Create indexes on fromEvent and toEvent for better query performance
                entity.HasIndex(d => d.FromEvent);
                entity.HasIndex(d => d.ToEvent);
            });
        }
    }
}
