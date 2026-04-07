using PaymentService.Contracts;

namespace PaymentService.Services;

public interface IPaymentService
{
    Task<PaymentResultDto> ProcessAsync(PaymentRequest request, CancellationToken cancellationToken = default);
    Task<StripeCheckoutSessionResponse> CreateStripeCheckoutSessionAsync(CreateStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<PaymentResultDto> ConfirmStripeCheckoutSessionAsync(ConfirmStripeCheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PaymentResultDto>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PaymentResultDto>> GetAllAsync(CancellationToken cancellationToken = default);
}

