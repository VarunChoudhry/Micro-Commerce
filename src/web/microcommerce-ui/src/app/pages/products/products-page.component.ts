import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogApiService } from '../../core/catalog-api.service';
import { CartApiService } from '../../core/cart-api.service';
import { InventoryApiService } from '../../core/inventory-api.service';
import { CategoryVm, InventoryItemVm, ProductVm } from '../../core/store.models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { getPlaceholderImage, toProductImageSource } from '../../core/product-image.util';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './products-page.component.html'
})
export class ProductsPageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  categories: CategoryVm[] = [];
  products: ProductVm[] = [];
  statusMessage = 'Loading products...';
  activeCategoryId?: number;
  focusedProductId?: number;
  showProductModal = false;
  showDeleteModal = false;
  deleteCandidate: ProductVm | null = null;
  isProcessingImage = false;
  imagePreviewUrl = '';
  placeholderImage = getPlaceholderImage();
  searchTerm = '';

  productForm = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
    imageBase64: ''
  };

  readonly isLoggedIn = this.sessionService.isLoggedIn;
  readonly isAdmin = computed(() => this.sessionService.session()?.role?.toLowerCase() === 'admin');
  private readonly addedProductIds = new Set<number>();

  constructor() {
    this.loadCategories();
    this.loadProducts();
    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('id');
      const id = rawId ? Number(rawId) : undefined;
      this.focusedProductId = id;
      if (id) {
        queueMicrotask(() => {
          const element = document.getElementById(`product-${id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    });
  }

  loadCategories(): void {
    this.catalogApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        if (!this.productForm.categoryId && categories.length) {
          this.productForm.categoryId = categories[0].id;
        }
      },
      error: () => {
        this.statusMessage = 'Could not load categories.';
      }
    });
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
    return this.toImageSource(product.imageBase64);
  }

  getFormImagePreview(): string {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }

    return this.toImageSource(this.productForm.imageBase64);
  }

  openAddModal(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.resetProductForm();
    this.showProductModal = true;
  }

  openEditModal(product: ProductVm): void {
    if (!this.isAdmin()) {
      return;
    }

    this.releaseImagePreview();
    this.productForm = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId ?? this.categories[0]?.id ?? 0,
      imageBase64: product.imageBase64 ?? ''
    };
    this.showProductModal = true;
    this.statusMessage = `Editing ${product.name}.`;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.releaseImagePreview();
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.releaseImagePreview();
    this.imagePreviewUrl = URL.createObjectURL(file);
    this.isProcessingImage = true;
    this.statusMessage = 'Optimizing image...';

    try {
      this.productForm.imageBase64 = await this.resizeImage(file);
      this.statusMessage = 'Image ready.';
    } catch {
      this.productForm.imageBase64 = '';
      this.releaseImagePreview();
      this.statusMessage = 'Could not process image.';
      this.toastService.error('Could not process image.');
    } finally {
      this.isProcessingImage = false;
      input.value = '';
    }
  }

  clearSelectedImage(): void {
    this.productForm.imageBase64 = '';
    this.releaseImagePreview();
  }

  saveProduct(): void {
    if (!this.isAdmin()) {
      this.statusMessage = 'Only admin can manage products.';
      return;
    }

    if (this.isProcessingImage) {
      this.statusMessage = 'Please wait for image processing to finish.';
      return;
    }

    const payload = {
      name: this.productForm.name.trim(),
      description: this.productForm.description.trim(),
      price: Number(this.productForm.price),
      stock: Number(this.productForm.stock),
      categoryId: Number(this.productForm.categoryId),
      imageBase64: this.productForm.imageBase64.trim() || undefined
    };

    if (!payload.name || !payload.description || !payload.categoryId) {
      this.statusMessage = 'Please fill all product fields.';
      return;
    }

    const request = this.productForm.id
      ? this.catalogApi.updateProduct(this.productForm.id, payload)
      : this.catalogApi.createProduct(payload);

    request.subscribe({
      next: () => {
        const isUpdate = this.productForm.id !== 0;
        this.statusMessage = isUpdate ? 'Product updated.' : 'Product added.';
        this.toastService.success(isUpdate ? 'Product updated successfully.' : 'Product added successfully.');
        this.showProductModal = false;
        this.resetProductForm();
        this.releaseImagePreview();
        this.fetchProducts();
      },
      error: () => {
        this.statusMessage = 'Product save failed. Check CatalogService.';
        this.toastService.error('Product save failed.');
      }
    });
  }

  requestDeleteProduct(product: ProductVm): void {
    if (!this.isAdmin()) {
      this.statusMessage = 'Only admin can delete products.';
      return;
    }

    this.deleteCandidate = product;
    this.showDeleteModal = true;
  }

  cancelDeleteProduct(): void {
    this.showDeleteModal = false;
    this.deleteCandidate = null;
  }

  confirmDeleteProduct(): void {
    const product = this.deleteCandidate;
    if (!product) {
      return;
    }

    this.catalogApi.deleteProduct(product.id).subscribe({
      next: () => {
        if (this.productForm.id === product.id) {
          this.resetProductForm();
          this.showProductModal = false;
          this.releaseImagePreview();
        }
        this.statusMessage = `${product.name} deleted.`;
        this.toastService.success(`${product.name} deleted successfully.`);
        this.cancelDeleteProduct();
        this.fetchProducts();
      },
      error: () => {
        this.statusMessage = 'Product delete failed. Check CatalogService.';
        this.toastService.error('Product delete failed.');
      }
    });
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

  openProduct(productId: number): void {
    void this.router.navigate(['/products', productId]);
  }

  onCardKeydown(event: KeyboardEvent, productId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openProduct(productId);
    }
  }

  trackByProductId(_: number, product: ProductVm): number {
    return product.id;
  }

  isFocused(product: ProductVm): boolean {
    return this.focusedProductId === product.id;
  }

  isAdded(productId: number): boolean {
    return this.addedProductIds.has(productId);
  }

  resetProductForm(): void {
    this.productForm = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: this.categories[0]?.id ?? 0,
      imageBase64: ''
    };
    this.releaseImagePreview();
    this.isProcessingImage = false;
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
        this.statusMessage = this.products.length
          ? query ? `Showing ${this.products.length} search results.` : 'Products loaded.'
          : query ? `No products found for "${query}".` : 'No products available yet.';
        this.syncCartState();
      },
      error: () => {
        this.statusMessage = query
          ? 'Could not search products. Make sure CatalogService is running.'
          : 'Could not load products. Make sure CatalogService is running.';
      }
    });
  }

  private toImageSource(imageBase64?: string): string {
    return toProductImageSource(imageBase64);
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

  private async resizeImage(file: File): Promise<string> {
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await this.loadImage(imageUrl);
      const maxWidth = 960;
      const maxHeight = 960;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas not supported');
      }

      context.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.78);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = url;
    });
  }

  private releaseImagePreview(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = '';
    }
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

