import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../core/catalog-api.service';
import { CategoryVm } from '../../core/store.models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-page.component.html'
})
export class CategoriesPageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);

  readonly session = this.sessionService.session;
  readonly isAdmin = computed(() => this.session()?.role?.toLowerCase() === 'admin');

  categories: CategoryVm[] = [];
  statusMessage = 'Loading categories...';
  showCategoryModal = false;
  showDeleteModal = false;
  deleteCandidate: CategoryVm | null = null;

  categoryForm = {
    id: 0,
    name: ''
  };

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    this.catalogApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.statusMessage = categories.length ? 'Categories loaded.' : 'No categories yet.';
      },
      error: () => {
        this.statusMessage = 'Could not load categories. Make sure CatalogService is running.';
      }
    });
  }

  openAddModal(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.resetCategoryForm();
    this.showCategoryModal = true;
  }

  openEditModal(category: CategoryVm): void {
    if (!this.isAdmin()) {
      return;
    }

    this.categoryForm = { ...category };
    this.showCategoryModal = true;
    this.statusMessage = `Editing ${category.name}.`;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  submitCategory(): void {
    if (!this.isAdmin()) {
      this.statusMessage = 'Only admin can manage categories.';
      return;
    }

    const name = this.categoryForm.name.trim();
    if (!name) {
      this.statusMessage = 'Please enter category name.';
      return;
    }

    const request = this.categoryForm.id
      ? this.catalogApi.updateCategory(this.categoryForm.id, name)
      : this.catalogApi.createCategory(name);

    request.subscribe({
      next: () => {
        const isUpdate = this.categoryForm.id !== 0;
        this.statusMessage = isUpdate ? 'Category updated.' : 'Category added.';
        this.toastService.success(isUpdate ? 'Category updated successfully.' : 'Category added successfully.');
        this.showCategoryModal = false;
        this.resetCategoryForm();
        this.loadCategories();
      },
      error: () => {
        this.statusMessage = 'Category save failed.';
        this.toastService.error('Category save failed.');
      }
    });
  }

  requestDeleteCategory(category: CategoryVm): void {
    if (!this.isAdmin()) {
      this.statusMessage = 'Only admin can delete categories.';
      return;
    }

    this.deleteCandidate = category;
    this.showDeleteModal = true;
  }

  cancelDeleteCategory(): void {
    this.showDeleteModal = false;
    this.deleteCandidate = null;
  }

  confirmDeleteCategory(): void {
    const category = this.deleteCandidate;
    if (!category) {
      return;
    }

    this.catalogApi.deleteCategory(category.id).subscribe({
      next: () => {
        if (this.categoryForm.id === category.id) {
          this.resetCategoryForm();
          this.showCategoryModal = false;
        }
        this.statusMessage = 'Category deleted.';
        this.toastService.success('Category deleted successfully.');
        this.cancelDeleteCategory();
        this.loadCategories();
      },
      error: () => {
        this.statusMessage = 'Category delete failed. Remove mapped products first.';
        this.toastService.error('Category delete failed.');
      }
    });
  }

  resetCategoryForm(): void {
    this.categoryForm = { id: 0, name: '' };
  }
}
