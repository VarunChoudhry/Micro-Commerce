using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using PaymentService.Contracts;

namespace PaymentService.Integration;

public interface IStripeCheckoutClient
{
    Task<StripeCheckoutSessionResponse> CreateSessionAsync(CreateStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<StripeCheckoutSessionDetails> GetSessionAsync(string sessionId, CancellationToken cancellationToken = default);
}

public sealed record StripeCheckoutSessionDetails(
    string SessionId,
    string OrderId,
    string UserId,
    decimal Amount,
    string Currency,
    string PaymentStatus,
    string Status);

public sealed class StripeCheckoutClient(HttpClient httpClient, IConfiguration configuration) : IStripeCheckoutClient
{
    private const string DefaultCurrency = "inr";

    public async Task<StripeCheckoutSessionResponse> CreateSessionAsync(CreateStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request);

        var secretKey = configuration["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("Stripe:SecretKey is missing in payment service configuration.");
        }

        var currency = string.IsNullOrWhiteSpace(request.Currency) ? DefaultCurrency : request.Currency.Trim().ToLowerInvariant();
        var successUrl = BuildReturnUrl(request.SuccessUrl, request.OrderId, addSessionPlaceholder: true);
        var cancelUrl = BuildReturnUrl(request.CancelUrl, request.OrderId, addSessionPlaceholder: false);
        var formFields = new List<KeyValuePair<string, string>>
        {
            new("mode", "payment"),
            new("success_url", successUrl),
            new("cancel_url", cancelUrl),
            new("client_reference_id", request.OrderId.ToString()),
            new("metadata[orderId]", request.OrderId.ToString()),
            new("metadata[userId]", request.UserId.ToString()),
            new("metadata[amount]", request.Amount.ToString(CultureInfo.InvariantCulture)),
            new("metadata[currency]", currency)
        };

        for (var index = 0; index < request.Items.Count; index++)
        {
            var item = request.Items.ElementAt(index);
            var unitAmount = Convert.ToInt64(Math.Round(item.UnitPrice * 100m, MidpointRounding.AwayFromZero));
            formFields.Add(new KeyValuePair<string, string>($"line_items[{index}][price_data][currency]", currency));
            formFields.Add(new KeyValuePair<string, string>($"line_items[{index}][price_data][product_data][name]", item.Name));
            if (!string.IsNullOrWhiteSpace(item.Description))
            {
                formFields.Add(new KeyValuePair<string, string>($"line_items[{index}][price_data][product_data][description]", item.Description));
            }

            formFields.Add(new KeyValuePair<string, string>($"line_items[{index}][price_data][unit_amount]", unitAmount.ToString(CultureInfo.InvariantCulture)));
            formFields.Add(new KeyValuePair<string, string>($"line_items[{index}][quantity]", Math.Max(item.Quantity, 1).ToString(CultureInfo.InvariantCulture)));
        }

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, "v1/checkout/sessions")
        {
            Content = new FormUrlEncodedContent(formFields)
        };
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

        using var response = await httpClient.SendAsync(requestMessage, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Stripe checkout session creation failed: {content}");
        }

        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;
        return new StripeCheckoutSessionResponse(
            root.GetProperty("id").GetString() ?? string.Empty,
            root.GetProperty("url").GetString() ?? string.Empty,
            root.GetProperty("status").GetString() ?? "open");
    }

    public async Task<StripeCheckoutSessionDetails> GetSessionAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var secretKey = configuration["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("Stripe:SecretKey is missing in payment service configuration.");
        }

        using var requestMessage = new HttpRequestMessage(HttpMethod.Get, $"v1/checkout/sessions/{sessionId}");
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

        using var response = await httpClient.SendAsync(requestMessage, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Stripe checkout session lookup failed: {content}");
        }

        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;
        var metadata = root.GetProperty("metadata");
        var amountTotal = root.TryGetProperty("amount_total", out var amountElement) && amountElement.TryGetInt64(out var amountCents)
            ? amountCents / 100m
            : 0m;

        return new StripeCheckoutSessionDetails(
            root.GetProperty("id").GetString() ?? sessionId,
            metadata.TryGetProperty("orderId", out var orderIdElement) ? orderIdElement.GetString() ?? string.Empty : string.Empty,
            metadata.TryGetProperty("userId", out var userIdElement) ? userIdElement.GetString() ?? string.Empty : string.Empty,
            amountTotal,
            root.TryGetProperty("currency", out var currencyElement) ? currencyElement.GetString() ?? DefaultCurrency : DefaultCurrency,
            root.TryGetProperty("payment_status", out var paymentStatusElement) ? paymentStatusElement.GetString() ?? string.Empty : string.Empty,
            root.TryGetProperty("status", out var statusElement) ? statusElement.GetString() ?? string.Empty : string.Empty);
    }

    private static void Validate(CreateStripeCheckoutSessionRequest request)
    {
        if (request.OrderId == Guid.Empty)
        {
            throw new ArgumentException("OrderId is required.");
        }

        if (request.UserId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required.");
        }

        if (request.Items.Count == 0)
        {
            throw new ArgumentException("At least one line item is required.");
        }

        var computedTotal = request.Items.Sum(item => item.UnitPrice * Math.Max(item.Quantity, 1));
        if (Math.Round(computedTotal, 2) != Math.Round(request.Amount, 2))
        {
            throw new ArgumentException("Order amount does not match the provided line items.");
        }
    }

    private static string BuildReturnUrl(string baseUrl, Guid orderId, bool addSessionPlaceholder)
    {
        var separator = baseUrl.Contains('?') ? '&' : '?';
        var sessionPart = addSessionPlaceholder ? "&session_id={CHECKOUT_SESSION_ID}" : string.Empty;
        return $"{baseUrl}{separator}orderId={orderId}{sessionPart}";
    }
}

