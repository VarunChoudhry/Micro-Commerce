using PaymentService.Contracts;
using PaymentService.Models;
using PaymentService.Repositories;
using PaymentService.Integration;

namespace PaymentService.Services;

public sealed class PaymentServiceHandler(
    IPaymentRepository paymentRepository,
    IStripeCheckoutClient stripeCheckoutClient,
    IOrderServiceClient orderServiceClient) : IPaymentService
{
    private const string StripeCheckoutMethod = "Stripe Checkout";

    public async Task<PaymentResultDto> ProcessAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        var payment = new PaymentRecord
        {
            OrderId = request.OrderId,
            UserId = request.UserId,
            Amount = request.Amount,
            Method = request.Method,
            Status = request.Method.Equals("fail", StringComparison.OrdinalIgnoreCase) ? "Failed" : "Succeeded"
        };

        await paymentRepository.AddAsync(payment, cancellationToken);
        await paymentRepository.SaveChangesAsync(cancellationToken);

        return ToDto(payment);
    }

    public async Task<StripeCheckoutSessionResponse> CreateStripeCheckoutSessionAsync(CreateStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default) =>
        await stripeCheckoutClient.CreateSessionAsync(request, cancellationToken);

    public async Task<PaymentResultDto> ConfirmStripeCheckoutSessionAsync(ConfirmStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default)
    {
        var stripeSession = await stripeCheckoutClient.GetSessionAsync(request.SessionId, cancellationToken);

        if (!string.Equals(stripeSession.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Stripe payment has not completed yet.");
        }

        if (!Guid.TryParse(stripeSession.OrderId, out var orderId) || !Guid.TryParse(stripeSession.UserId, out var userId))
        {
            throw new InvalidOperationException("Stripe session metadata is missing required order information.");
        }

        var existingPayments = await paymentRepository.GetByOrderIdAsync(orderId, cancellationToken);
        var existingStripePayment = existingPayments.FirstOrDefault(payment =>
            payment.Method.Equals(StripeCheckoutMethod, StringComparison.OrdinalIgnoreCase) &&
            payment.Status.Equals("Succeeded", StringComparison.OrdinalIgnoreCase));

        if (existingStripePayment is not null)
        {
            return ToDto(existingStripePayment);
        }

        var orderUpdated = await orderServiceClient.UpdateStatusAsync(orderId, "Paid", cancellationToken);
        if (!orderUpdated)
        {
            throw new InvalidOperationException("Payment succeeded, but order status could not be updated.");
        }

        var paymentRecord = new PaymentRecord
        {
            OrderId = orderId,
            UserId = userId,
            Amount = stripeSession.Amount,
            Method = StripeCheckoutMethod,
            Status = "Succeeded"
        };

        await paymentRepository.AddAsync(paymentRecord, cancellationToken);
        await paymentRepository.SaveChangesAsync(cancellationToken);

        return ToDto(paymentRecord);
    }

    public async Task<IReadOnlyCollection<PaymentResultDto>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        (await paymentRepository.GetByOrderIdAsync(orderId, cancellationToken))
        .Select(ToDto)
        .ToList();

    public async Task<IReadOnlyCollection<PaymentResultDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await paymentRepository.GetAllAsync(cancellationToken))
        .Select(ToDto)
        .ToList();

    private static PaymentResultDto ToDto(PaymentRecord payment) =>
        new(payment.Id, payment.OrderId, payment.UserId, payment.Amount, payment.Method, payment.Status, payment.ProcessedAt);
}

