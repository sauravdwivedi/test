using Microsoft.EntityFrameworkCore;
using NotesService.Models;

namespace NotesService.Controllers;

public static class NoteEndpoints
{
    public static void MapNotesApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notes")
                       .WithTags("Notes");

        // GET - list with search & sort
        group.MapGet("/", async (
            NotesDbContext db,
            string? search,
            string? sort = "createdAt",
            string? order = "desc") =>
        {
            IQueryable<NoteResponseSchema> query = db.Notes;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(n =>
                    EF.Functions.ILike(n.Title, $"%{term}%") ||
                    EF.Functions.ILike(n.Content, $"%{term}%") ||
                    (n.Summary != null && EF.Functions.ILike(n.Summary, $"%{term}%")) ||
                    (n.Tags != null && n.Tags.Any(t => EF.Functions.ILike(t, $"%{term}%")))
                );
            }

            query = sort?.ToLowerInvariant() switch
            {
                "title" when order?.ToLowerInvariant() == "asc" => query.OrderBy(n => n.Title),
                "title" => query.OrderByDescending(n => n.Title),
                "createdat" when order?.ToLowerInvariant() == "asc" => query.OrderBy(n => n.CreatedAt),
                "createdat" => query.OrderByDescending(n => n.CreatedAt),
                "updatedat" when order?.ToLowerInvariant() == "asc" => query.OrderBy(n => n.UpdatedAt),
                "updatedat" => query.OrderByDescending(n => n.UpdatedAt),
                _ => query.OrderByDescending(n => n.CreatedAt)
            };

            var notes = await query.ToListAsync();
            return Results.Ok(notes);
        })
        .WithName("GetNotes");

        // GET single
        group.MapGet("/{id:guid}", async (NotesDbContext db, Guid id) =>
            await db.Notes.FindAsync(id) is NoteResponseSchema note
                ? Results.Ok(note)
                : Results.NotFound())
        .WithName("GetNote");

        // POST - create
        group.MapPost("/", async (NotesDbContext db, NoteRequestSchema request) =>
        {
            var note = new NoteResponseSchema
            {
                Title   = request.Title,
                Content = request.Content,
            };

            db.Notes.Add(note);
            await db.SaveChangesAsync();

            var response = new NoteResponseSchema
            {
                Id        = note.Id,
                Title     = note.Title,
                Content   = note.Content,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt
            };

            return Results.CreatedAtRoute(
                "GetNote",
                new { id = note.Id },
                response
            );
        })
        .WithName("CreateNote")
        .Produces<NoteResponseSchema>(StatusCodes.Status201Created);

        // PUT - update
        group.MapPut("/{id:guid}", async (NotesDbContext db, Guid id, NoteRequestSchema input) =>
        {
            var note = await db.Notes.FindAsync(id);
            if (note is null) return Results.NotFound();

            note.Title = input.Title;
            note.Content = input.Content;
            note.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(note);
        })
        .WithName("UpdateNote");

        // DELETE
        group.MapDelete("/{id:guid}", async (NotesDbContext db, Guid id) =>
        {
            var note = await db.Notes.FindAsync(id);
            if (note is null) return Results.NotFound();

            db.Notes.Remove(note);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteNote");

        // POST - summarize + generate tags (AI call)
        group.MapPost("/{id:guid}/summarize", async (
            NotesDbContext db,
            AiSummarizationService aiService,
            Guid id,
            CancellationToken ct) =>
        {
            var note = await db.Notes.FindAsync([id], cancellationToken: ct);
            if (note is null) return Results.NotFound();

            var (summary, tags) = await aiService.SummarizeAndTagAsync(note.Content, ct);

            note.Summary = summary;
            note.Tags = tags;
            note.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);

            return Results.Ok(note);
        })
        .WithName("SummarizeNote");
    }
}