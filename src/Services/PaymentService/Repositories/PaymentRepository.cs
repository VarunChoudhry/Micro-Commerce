using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Models;

namespace PaymentService.Repositories;

public sealed class PaymentRepository(PaymentDbContext dbContext) : IPaymentRepository
{
    public Task<List<PaymentRecord>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        dbContext.Payments.Where(payment => payment.OrderId == orderId).OrderByDescending(payment => payment.ProcessedAt).ToListAsync(cancellationToken);

    public Task<List<PaymentRecord>> GetAllAsync(CancellationToken cancellationToken = default) =>
        dbContext.Payments.OrderByDescending(payment => payment.ProcessedAt).ToListAsync(cancellationToken);

    public Task AddAsync(PaymentRecord payment, CancellationToken cancellationToken = default) => dbContext.Payments.AddAsync(payment, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
}
