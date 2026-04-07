using CartService.Contracts;
using CartService.Services;
using Microsoft.AspNetCore.Mvc;

namespace CartService.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartController(ICartService cartService) : ControllerBase
{
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<CartDto>> Get(Guid userId, CancellationToken cancellationToken) =>
        Ok(await cartService.GetAsync(userId, cancellationToken));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem([FromBody] AddCartItemRequest request, CancellationToken cancellationToken) =>
        Ok(await cartService.AddItemAsync(request, cancellationToken));

    [HttpPut("items/{userId:guid}/{productId:int}")]
    public async Task<ActionResult<CartDto>> UpdateItem(Guid userId, int productId, [FromBody] UpdateCartItemQuantityRequest request, CancellationToken cancellationToken)
    {
        var cart = await cartService.UpdateItemAsync(userId, productId, request, cancellationToken);
        return cart is null ? NotFound() : Ok(cart);
    }

    [HttpDelete("items/{userId:guid}/{productId:int}")]
    public async Task<ActionResult<CartDto>> RemoveItem(Guid userId, int productId, CancellationToken cancellationToken)
    {
        var cart = await cartService.RemoveItemAsync(userId, productId, cancellationToken);
        return cart is null ? NotFound() : Ok(cart);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Clear(Guid userId, CancellationToken cancellationToken) =>
        await cartService.ClearAsync(userId, cancellationToken) ? NoContent() : NotFound();
}

