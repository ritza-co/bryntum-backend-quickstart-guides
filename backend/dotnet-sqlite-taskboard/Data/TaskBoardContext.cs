using Microsoft.EntityFrameworkCore;
using TaskBoardApi.Models;

namespace TaskBoardApi.Data
{
    public class TaskBoardContext : DbContext
    {
        public TaskBoardContext(DbContextOptions<TaskBoardContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; } = null!;
        public DbSet<Resource> Resources { get; set; } = null!;
        public DbSet<Assignment> Assignments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.ToTable("tasks");
                entity.HasKey(t => t.Id);
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
                entity.HasOne<TaskItem>()
                    .WithMany()
                    .HasForeignKey(a => a.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Resource>()
                    .WithMany()
                    .HasForeignKey(a => a.ResourceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
