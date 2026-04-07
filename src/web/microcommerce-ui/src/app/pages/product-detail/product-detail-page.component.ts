import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogApiService } from '../../core/catalog-api.service';
import { CartApiService } from '../../core/cart-api.service';
import { InventoryApiService } from '../../core/inventory-api.service';
import { getPlaceholderImage, toProductImageSource } from '../../core/product-image.util';
import { CategoryVm, InventoryItemVm, ProductVm } from '../../core/store.models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-detail-page.component.html'
})
export class ProductDetailPageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  product: ProductVm | null = null;
  categories: CategoryVm[] = [];
  loading = true;
  statusMessage = 'Loading product details...';
  placeholderImage = getPlaceholderImage();

  readonly isLoggedIn = this.sessionService.isLoggedIn;
  readonly isAdmin = computed(() => this.sessionService.session()?.role?.toLowerCase() === 'admin');
  private readonly addedProductIds = new Set<number>();

  constructor() {
    this.catalogApi.getCategories().subscribe({
      next: (categories) => (this.categories = categories)
    });

    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('id');
      const id = rawId ? Number(rawId) : 0;
      if (!id) {
        this.loading = false;
        this.statusMessage = 'Product not found.';
        return;
      }

      this.loadProduct(id);
    });
  }

  getCategoryName(product: ProductVm | null): string {
    if (!product) {
      return 'Uncategorized';
    }

    if (product.category?.trim()) {
      return product.category;
    }

    const category = this.categories.find((item) => item.id === product.categoryId);
    return category?.name ?? (product.categoryId ? `Category ${product.categoryId}` : 'Uncategorized');
  }

  getProductImage(product: ProductVm | null): string {
    return toProductImageSource(product?.imageBase64);
  }

  isAdded(productId: number): boolean {
    return this.addedProductIds.has(productId);
  }

  addToCart(product: ProductVm): void {
    const session = this.sessionService.session();
    if (!session) {
      void this.router.navigateByUrl('/login');
      return;
    }

    if (session.role.toLowerCase() === 'admin') {
      this.toastService.info('Admin can manage products, not add them to cart.');
      return;
    }

    if (this.isAdded(product.id)) {
      this.toastService.info(`${product.name} is already in your cart.`);
      return;
    }

    this.cartApi.addItem(session.userId, product.id, product.name, 1, product.price).subscribe({
      next: () => {
        this.addedProductIds.add(product.id);
        this.toastService.success(`${product.name} added to cart.`);
      },
      error: () => this.toastService.error(`Could not add ${product.name} to cart.`)
    });
  }

  private loadProduct(productId: number): void {
    this.loading = true;

    forkJoin({
      product: this.catalogApi.getProductById(productId),
      inventory: this.inventoryApi.getInventoryItem(productId).pipe(catchError(() => of<InventoryItemVm | null>(null)))
    }).subscribe({
      next: ({ product, inventory }) => {
        this.product = inventory ? { ...product, stock: inventory.availableStock } : product;
        this.loading = false;
        this.statusMessage = 'Product details loaded.';
        this.syncCartState();
      },
      error: () => {
        this.product = null;
        this.loading = false;
        this.statusMessage = 'Could not load product details.';
      }
    });
  }

  private syncCartState(): void {
    const session = this.sessionService.session();
    if (!session || session.role.toLowerCase() === 'admin' || !this.product) {
      this.addedProductIds.clear();
      return;
    }

    this.cartApi.getCart(session.userId).subscribe({
      next: (cart) => {
        this.addedProductIds.clear();
        cart.items.forEach((item) => this.addedProductIds.add(item.productId));
      },
      error: () => {
        this.addedProductIds.clear();
      }
    });
  }
}

