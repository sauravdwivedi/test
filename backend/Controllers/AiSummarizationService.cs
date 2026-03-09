using System.Diagnostics;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using OpenTelemetry.Trace;

namespace NotesService.Controllers;

public class AiSummarizationService
{
    private readonly HttpClient _httpClient;
    private readonly HuggingFaceOptions _options;
    private static readonly ActivitySource ActivitySource = new("NotesService.AI");

    public AiSummarizationService(
        IHttpClientFactory factory,
        IOptions<HuggingFaceOptions> options)
    {
        _httpClient = factory.CreateClient("HuggingFace");
        _options = options.Value;
    }

    public async Task<(string? Summary, string[] Tags)> SummarizeAndTagAsync(string content, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(content))
            return (null, Array.Empty<string>());

        using var activity = ActivitySource.StartActivity("GenerateSummaryAndTags", ActivityKind.Client);

        activity?.SetTag("hf.model", _options.SummarizationModel);
        activity?.SetTag("input_chars", content.Length);

        try
        {
            var payload = new
            {
                inputs = content,
                parameters = new
                {
                    max_length = _options.MaxSummaryLength,
                    min_length = _options.MinSummaryLength,
                    do_sample = false,
                    early_stopping = true
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"models/{_options.SummarizationModel}",
                payload,
                ct);

            response.EnsureSuccessStatusCode();

            var summaries = await response.Content.ReadFromJsonAsync<string[]>(ct);
            var summary = summaries?.FirstOrDefault()?.Trim();

            if (string.IsNullOrWhiteSpace(summary))
                return (null, Array.Empty<string>());

            var tags = ExtractTags(content, summary);

            activity?.SetTag("output_chars", summary.Length);
            activity?.SetTag("tags_count", tags.Length);

            return (summary, tags);
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);

            return (
                "[Summary generation failed - content too long or rate limit]",
                new[] { "#error", "#ai-failed" }
            );
        }
    }

    private string[] ExtractTags(string original, string summary)
    {
        var text = original + " " + summary;
        var candidates = text
            .Split(new[] { ' ', '.', ',', '!', '?', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= 4 && w.All(c => char.IsLetter(c) || c == '\''))
            .Select(w => w.ToLowerInvariant())
            .GroupBy(w => w)
            .OrderByDescending(g => g.Count())
            .Take(6)
            .Select(g => "#" + g.Key)
            .ToArray();

        return candidates.Length > 0 ? candidates : new[] { "#note" };
    }
}

public class HuggingFaceOptions
{
    public string ApiToken { get; set; } = string.Empty;
    public string SummarizationModel { get; set; } = "facebook/bart-large-cnn";
    public int MaxSummaryLength { get; set; } = 130;
    public int MinSummaryLength { get; set; } = 40;
}