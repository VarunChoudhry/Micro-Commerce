namespace PaymentService.Integration;

public sealed class StripePaymentSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Currency { get; set; } = "inr";
    public string SuccessUrl { get; set; } = "http://localhost:4200/payment/success";
    public string CancelUrl { get; set; } = "http://localhost:4200/payment/cancel";
}
