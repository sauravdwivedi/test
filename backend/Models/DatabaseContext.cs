using Microsoft.EntityFrameworkCore;

namespace NotesService.Models;

public class NotesDbContext : DbContext
{
    public DbSet<NoteResponseSchema> Notes => Set<NoteResponseSchema>();

    public NotesDbContext(DbContextOptions<NotesDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NoteResponseSchema>()
            .HasIndex(n => n.Title);

        modelBuilder.Entity<NoteResponseSchema>()
            .HasIndex(n => n.CreatedAt);

        modelBuilder.Entity<NoteResponseSchema>()
            .HasIndex(n => n.UpdatedAt);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<NoteResponseSchema>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;

                case EntityState.Modified:
                    // Important: prevent client from overriding CreatedAt
                    entry.Property(n => n.CreatedAt).IsModified = false;

                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }
}