using Microsoft.EntityFrameworkCore;
using GanttApi.Models;

namespace GanttApi.Data
{
    public class GanttContext : DbContext
    {
        public GanttContext(DbContextOptions<GanttContext> options) : base(options) { }

        public DbSet<GanttTask> Tasks { get; set; } = null!;

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
        }
    }
}
