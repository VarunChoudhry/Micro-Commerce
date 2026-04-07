using InventoryService.Contracts;
using InventoryService.Services;
using Microsoft.AspNetCore.Mvc;

namespace InventoryService.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class InventoryController(IInventoryService inventoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<InventoryItemDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await inventoryService.GetAllAsync(cancellationToken));

    [HttpGet("{productId:int}")]
    public async Task<ActionResult<InventoryItemDto>> Get(int productId, CancellationToken cancellationToken)
    {
        var item = await inventoryService.GetByProductIdAsync(productId, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPut("{productId:int}")]
    public async Task<ActionResult<InventoryItemDto>> Upsert(int productId, [FromBody] UpdateInventoryRequest request, CancellationToken cancellationToken) =>
        Ok(await inventoryService.UpsertAsync(productId, request, cancellationToken));

    [HttpPost("reserve")]
    public async Task<ActionResult<InventoryItemDto>> Reserve([FromBody] ReserveInventoryRequest request, CancellationToken cancellationToken)
    {
        var item = await inventoryService.ReserveAsync(request, cancellationToken);
        return item is null ? BadRequest(new { message = "Insufficient stock." }) : Ok(item);
    }
}

