using PaymentService.Contracts;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<PaymentResultDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await paymentService.GetAllAsync(cancellationToken));

    [HttpPost("process")]
    public async Task<ActionResult<PaymentResultDto>> Process([FromBody] PaymentRequest request, CancellationToken cancellationToken) =>
        Ok(await paymentService.ProcessAsync(request, cancellationToken));

    [HttpPost("stripe/session")]
    public async Task<ActionResult<StripeCheckoutSessionResponse>> CreateStripeSession([FromBody] CreateStripeCheckoutSessionRequest request, CancellationToken cancellationToken) =>
        Ok(await paymentService.CreateStripeCheckoutSessionAsync(request, cancellationToken));

    [HttpPost("stripe/confirm")]
    public async Task<ActionResult<PaymentResultDto>> ConfirmStripeSession([FromBody] ConfirmStripeCheckoutSessionRequest request, CancellationToken cancellationToken) =>
        Ok(await paymentService.ConfirmStripeCheckoutSessionAsync(request, cancellationToken));

    [HttpGet("order/{orderId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<PaymentResultDto>>> GetByOrder(Guid orderId, CancellationToken cancellationToken) =>
        Ok(await paymentService.GetByOrderIdAsync(orderId, cancellationToken));
}

