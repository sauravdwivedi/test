namespace NotesService.Models;

public class Note
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string[]? Tags { get; set; }   // e.g. ["#todo", "#urgent"]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}