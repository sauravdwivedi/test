using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NotesService.Models;
using NotesService.Controllers;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// ── OpenTelemetry ───────────────────────────────────────────────────────────────
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("NotesService"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource("NotesService.AI")
        .AddConsoleExporter()
    );

// ── Database ────────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<NotesDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Hugging Face AI Client ─────────────────────────────────────────────────────
builder.Services.AddHttpClient("HuggingFace", client =>
{
    client.BaseAddress = new Uri("https://router.huggingface.co/hf-inference/");

    var token = builder.Configuration["HuggingFace:ApiToken"];
    if (!string.IsNullOrWhiteSpace(token))
    {
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    client.DefaultRequestHeaders.Accept.Add(
        new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

builder.Services.AddScoped<AiSummarizationService>();

// ── Swagger ─────────────────────────────────────────────────────────────────────
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Notes Service API", Version = "v1" });
});

// -- Health Check -------
builder.Services.AddHealthChecks();

// ── CORS for local Angular dev ─────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notes Service API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.MapHealthChecks("/health");
app.MapNotesApi();

app.Run();