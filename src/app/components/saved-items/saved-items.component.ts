import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedItemsService } from '../../services/saved-items.service';
import { SavedItem } from '../../models/saved-item.model';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-saved-items',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './saved-items.component.html',
  styleUrl: './saved-items.component.scss'
})
export class SavedItemsComponent implements OnInit {
  @Output() compareItem = new EventEmitter<SavedItem>();
  savedItems: SavedItem[] = [];
  itemToDelete: SavedItem | null = null;

  constructor(private savedItemsService: SavedItemsService) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.savedItems = this.savedItemsService.getItems().sort((a, b) => {
      const nameA = a.name ? a.name.toLowerCase() : '';
      const nameB = b.name ? b.name.toLowerCase() : '';
      return nameA.localeCompare(nameB);
    });
  }

  onClickRemove(item: SavedItem) {
    this.itemToDelete = item;
  }

  confirmDelete() {
    if (this.itemToDelete) {
      this.savedItemsService.removeItem(this.itemToDelete.id);
      this.loadItems();
      this.itemToDelete = null;
    }
  }

  cancelDelete() {
    this.itemToDelete = null;
  }

  onCompare(item: SavedItem) {
    this.compareItem.emit(item);
  }
  
  getPricePerOz(item: SavedItem): number | null {
    if (!item.price || !item.weight || item.price <= 0 || item.weight <= 0) {
      return null;
    }
    // Hardcoded factors for formatting matching app component
    const units = [
      { label: 'oz', factor: 1 },
      { label: 'lb', factor: 16 },
      { label: 'g', factor: 0.035274 },
      { label: 'kg', factor: 35.274 },
      { label: 'fl oz', factor: 1 },
      { label: 'ml', factor: 0.033814 }
    ];
    const unitMatch = units.find(u => u.label === item.unit);
    const multiplier = unitMatch ? unitMatch.factor : 1;
    const totalOz = item.weight * multiplier;
    return item.price / totalOz;
  }
}
