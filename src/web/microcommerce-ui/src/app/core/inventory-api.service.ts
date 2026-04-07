import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { InventoryItemVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  getInventory(): Observable<InventoryItemVm[]> {
    return this.http.get<InventoryItemVm[]>(`${apiConfig.inventoryBaseUrl}`);
  }

  getInventoryItem(productId: number): Observable<InventoryItemVm> {
    return this.http.get<InventoryItemVm>(`${apiConfig.inventoryBaseUrl}/${productId}`);
  }

  reserve(productId: number, quantity: number): Observable<InventoryItemVm> {
    return this.http.post<InventoryItemVm>(`${apiConfig.inventoryBaseUrl}/reserve`, { productId, quantity });
  }
}
