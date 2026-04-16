import { Injectable } from '@angular/core';
import { SavedItem } from '../models/saved-item.model';

@Injectable({
  providedIn: 'root'
})
export class SavedItemsService {
  private readonly STORAGE_KEY = 'priceCompareSavedItems';

  constructor() { }

  getItems(): SavedItem[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveItem(item: SavedItem): void {
    const items = this.getItems();
    items.push(item);
    this.saveToStorage(items);
  }

  updateItem(updatedItem: SavedItem): void {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      this.saveToStorage(items);
    }
  }

  removeItem(id: string): void {
    let items = this.getItems();
    items = items.filter(item => item.id !== id);
    this.saveToStorage(items);
  }

  checkDuplicate(item: SavedItem, ignoreId?: string): SavedItem | undefined {
    const items = this.getItems();
    return items.find(i => 
      i.name.toLowerCase() === item.name.toLowerCase() &&
      i.store.toLowerCase() === item.store.toLowerCase() &&
      i.brand.toLowerCase() === item.brand.toLowerCase() &&
      i.id !== ignoreId // Useful if we are updating an existing one
    );
  }

  private saveToStorage(items: SavedItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
