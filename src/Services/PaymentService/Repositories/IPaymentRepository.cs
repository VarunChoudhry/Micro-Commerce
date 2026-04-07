using PaymentService.Models;

namespace PaymentService.Repositories;

public interface IPaymentRepository
{
    Task<List<PaymentRecord>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<List<PaymentRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(PaymentRecord payment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
