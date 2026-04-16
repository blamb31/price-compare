import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedItemsService } from '../../services/saved-items.service';
import { SavedItem } from '../../models/saved-item.model';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { DuplicateModalComponent } from '../duplicate-modal/duplicate-modal.component';
import { ImportProgressModalComponent } from '../import-progress-modal/import-progress-modal.component';

@Component({
  selector: 'app-saved-items',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, DuplicateModalComponent, ImportProgressModalComponent],
  templateUrl: './saved-items.component.html',
  styleUrl: './saved-items.component.scss'
})
export class SavedItemsComponent implements OnInit {
  @Output() compareItem = new EventEmitter<SavedItem>();
  savedItems: SavedItem[] = [];
  itemToDelete: SavedItem | null = null;

  isImporting: boolean = false;
  importTotal: number = 0;
  importCurrent: number = 0;
  importSkipped: number = 0;
  importAdded: number = 0;
  importQueue: SavedItem[] = [];
  duplicateResolutionData: { importedItem: SavedItem, existingItem: SavedItem } | null = null;
  importSummary: string | null = null;

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

  exportAll() {
    if (this.savedItems.length === 0) return;
    this.savedItemsService.exportData(this.savedItems, 'price-compare-all.json');
  }

  exportItem(item: SavedItem) {
    this.savedItemsService.exportData([item], `price-compare-${item.name.replace(/\s+/g, '-').toLowerCase()}.json`);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const text = await file.text();
    input.value = '';

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        this.startImportQueue(parsed);
      }
    } catch (e) {
      console.error(e);
      window.alert('Failed to parse JSON.');
    }
  }

  startImportQueue(items: any[]) {
    this.importQueue = items.filter(i => i.name && i.price !== undefined && i.weight !== undefined);
    this.importTotal = this.importQueue.length;
    this.importCurrent = 0;
    this.importSkipped = 0;
    this.importAdded = 0;
    this.isImporting = true;
    this.processNextImport();
  }

  processNextImport() {
    if (this.importQueue.length === 0) {
      this.isImporting = false;
      this.loadItems();
      this.importSummary = `Import Complete!<br><br>Imported: ${this.importAdded}<br>Skipped (Duplicates): ${this.importSkipped}`;
      return;
    }

    const currentItem = this.importQueue.shift()!;
    this.importCurrent++;

    const duplicate = this.savedItemsService.checkDuplicate(currentItem);
    if (duplicate) {
      this.duplicateResolutionData = { importedItem: currentItem, existingItem: duplicate };
    } else {
      currentItem.id = Math.random().toString(36).substring(2, 9);
      this.savedItemsService.saveItem(currentItem as SavedItem);
      this.importAdded++;
      setTimeout(() => this.processNextImport(), 20); // Small delay for progress bar animation
    }
  }

  onDuplicateCancel() {
    this.importSkipped++;
    this.duplicateResolutionData = null;
    setTimeout(() => this.processNextImport(), 200); // Wait for modal to disappear before next iteration
  }

  onDuplicateAdd() {
    if (this.duplicateResolutionData) {
      const item = this.duplicateResolutionData.importedItem;
      item.id = Math.random().toString(36).substring(2, 9);
      this.savedItemsService.saveItem(item);
      this.importAdded++;
    }
    this.duplicateResolutionData = null;
    setTimeout(() => this.processNextImport(), 200);
  }

  onDuplicateReplace() {
    if (this.duplicateResolutionData) {
      const existingId = this.duplicateResolutionData.existingItem.id;
      const item = this.duplicateResolutionData.importedItem;
      item.id = existingId;
      this.savedItemsService.updateItem(item);
      this.importAdded++;
    }
    this.duplicateResolutionData = null;
    setTimeout(() => this.processNextImport(), 200);
  }

  closeImportSummary() {
    this.importSummary = null;
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
