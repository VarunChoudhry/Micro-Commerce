import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './home-page.component.html'
})
export class HomePageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly highlights = [
    { title: 'Customer flows', text: 'Login, cart, checkout, and order tracking live here for every user.' },
    { title: 'Admin flows', text: 'Product add/edit happens in the product modal and category CRUD in the category page.' },
    { title: 'Microservice-friendly', text: 'UI structure is separated by feature pages so API wiring stays clean later.' }
  ];

  readonly isLoggedIn = this.sessionService.isLoggedIn;
  readonly isAdmin = computed(() => this.sessionService.session()?.role?.toLowerCase() === 'admin');
  readonly placeholderImage = getPlaceholderImage();

  products: ProductVm[] = [];
  categories: CategoryVm[] = [];
  featuredCartCount = 0;
  featuredCartTotal = 0;
  statusMessage = 'Loading storefront...';
  activeCategoryId?: number;
  searchTerm = '';
  private readonly addedProductIds = new Set<number>();

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  browseCatalog(): void {
    const catalog = document.getElementById('catalog');
    catalog?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  loadProducts(categoryId?: number): void {
    this.activeCategoryId = categoryId;
    this.fetchProducts();
  }

  onSearchChange(): void {
    this.fetchProducts();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.fetchProducts();
  }

  getCategoryName(product: ProductVm): string {
    if (product.category?.trim()) {
      return product.category;
    }

    const category = this.categories.find((item) => item.id === product.categoryId);
    return category?.name ?? (product.categoryId ? `Category ${product.categoryId}` : 'Uncategorized');
  }

  getProductImage(product: ProductVm): string {
    return toProductImageSource(product.imageBase64);
  }

  isAdded(productId: number): boolean {
    return this.addedProductIds.has(productId);
  }

  openProduct(productId: number): void {
    void this.router.navigate(['/products', productId]);
  }

  onCardKeydown(event: KeyboardEvent, productId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openProduct(productId);
    }
  }

  addToCart(product: ProductVm, event?: Event): void {
    event?.stopPropagation();

    const session = this.sessionService.session();
    if (!session) {
      void this.router.navigateByUrl('/login');
      return;
    }

    if (session.role.toLowerCase() === 'admin') {
      this.statusMessage = 'Admin can manage products, not add them to cart.';
      return;
    }

    if (this.isAdded(product.id)) {
      this.statusMessage = `${product.name} is already in your cart.`;
      this.toastService.info(`${product.name} is already in your cart.`);
      return;
    }

    this.cartApi.addItem(session.userId, product.id, product.name, 1, product.price).subscribe({
      next: () => {
        this.addedProductIds.add(product.id);
        this.statusMessage = `${product.name} added to cart.`;
        this.toastService.success(`${product.name} added to cart.`);
      },
      error: () => {
        this.statusMessage = 'Could not add item to cart. Make sure CartService is running.';
        this.toastService.error(`Could not add ${product.name} to cart.`);
      }
    });
  }

  private loadCategories(): void {
    this.catalogApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.statusMessage = 'Could not load categories.';
      }
    });
  }

  private fetchProducts(): void {
    const query = this.searchTerm.trim();
    const productsRequest = query
      ? this.catalogApi.searchProducts(query)
      : this.catalogApi.getProducts(this.activeCategoryId);

    forkJoin({
      products: productsRequest,
      inventory: this.inventoryApi.getInventory().pipe(catchError(() => of<InventoryItemVm[]>([])))
    }).subscribe({
      next: ({ products, inventory }) => {
        this.products = this.mergeInventory(products, inventory);
        this.featuredCartCount = this.products.length;
        this.featuredCartTotal = this.products.reduce((sum, product) => sum + product.price, 0);
        this.statusMessage = this.products.length
          ? query ? `Showing ${this.products.length} search results.` : 'Storefront loaded.'
          : query ? `No products found for "${query}".` : 'No products available yet.';
        this.syncCartState();
      },
      error: () => {
        this.statusMessage = query
          ? 'Could not search products. Make sure CatalogService is running.'
          : 'Could not load storefront products. Make sure CatalogService is running.';
      }
    });
  }

  private mergeInventory(products: ProductVm[], inventory: InventoryItemVm[]): ProductVm[] {
    if (!inventory.length) {
      return products;
    }

    const stockByProductId = new Map(inventory.map((item) => [item.productId, item.availableStock]));
    return products.map((product) => ({
      ...product,
      stock: stockByProductId.get(product.id) ?? product.stock
    }));
  }

  private syncCartState(): void {
    const session = this.sessionService.session();
    if (!session || session.role.toLowerCase() === 'admin') {
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

