using System.Diagnostics;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using OpenTelemetry.Trace;
using System.Text.Json;
using System.Text.Json.Serialization;


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
                    early_stopping = true,
                    // Optional: helps with cleaner output on some models
                    num_beams = 4,
                    length_penalty = 2.0f
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"models/{_options.SummarizationModel}",
                payload,
                ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException($"HF Inference failed ({response.StatusCode}): {errorBody}");
            }

            // The real response shape from HF summarization models
            var result = await response.Content.ReadFromJsonAsync<SummaryResponse[]>(ct);

            var summary = result?
                .FirstOrDefault()?
                .SummaryText?
                .Trim();

            if (string.IsNullOrWhiteSpace(summary))
            {
                return (null, Array.Empty<string>());
            }

            var tags = ExtractTags(content, summary);

            activity?.SetTag("output_chars", summary.Length);
            activity?.SetTag("tags_count", tags.Length);

            return (summary, tags);
        }
        catch (JsonException jsonEx)
        {
            activity?.SetStatus(ActivityStatusCode.Error, "JSON deserialization failed");
            activity?.RecordException(jsonEx);

            return (
                "[Summary generation failed - unexpected response format]",
                new[] { "#error", "#ai-format-error" }
            );
        }
        catch (HttpRequestException httpEx)
        {
            activity?.SetStatus(ActivityStatusCode.Error, httpEx.Message);
            activity?.RecordException(httpEx);

            return (
                $"[Summary generation failed: {httpEx.Message}]",
                new[] { "#error", "#ai-http-failed" }
            );
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);

            return (
                "[Summary generation failed - unexpected error]",
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

    // DTO matching Hugging Face summarization response format
    private record SummaryResponse
    {
        [JsonPropertyName("summary_text")]
        public string? SummaryText { get; init; }
    }
}

public class HuggingFaceOptions
{
    public string ApiToken { get; set; } = string.Empty;
    public string SummarizationModel { get; set; } = "sshleifer/distilbart-cnn-12-6";
    public int MaxSummaryLength { get; set; } = 130;
    public int MinSummaryLength { get; set; } = 40;
}