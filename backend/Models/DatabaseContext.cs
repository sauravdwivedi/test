using Microsoft.EntityFrameworkCore;

namespace NotesService.Models;

public class NotesDbContext : DbContext
{
    public DbSet<Note> Notes => Set<Note>();

    public NotesDbContext(DbContextOptions<NotesDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Note>()
            .HasIndex(n => n.Title);

        modelBuilder.Entity<Note>()
            .HasIndex(n => n.CreatedAt);

        modelBuilder.Entity<Note>()
            .HasIndex(n => n.UpdatedAt);
    }
}