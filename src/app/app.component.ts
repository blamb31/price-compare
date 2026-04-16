import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ItemCardComponent } from './components/item-card/item-card.component';
import { CompareItem } from './models/compare-item.model';
import { SavedItem } from './models/saved-item.model';
import { SaveModalComponent } from './components/save-modal/save-modal.component';
import { SavedItemsComponent } from './components/saved-items/saved-items.component';
import { SavedItemsService } from './services/saved-items.service';
import { DuplicateModalComponent } from './components/duplicate-modal/duplicate-modal.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, ItemCardComponent, SaveModalComponent, SavedItemsComponent, DuplicateModalComponent, ConfirmModalComponent, UpdateModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Price Compare';
  
  units = [
    { label: 'oz', factor: 1 },
    { label: 'lb', factor: 16 },
    { label: 'g', factor: 0.035274 },
    { label: 'kg', factor: 35.274 },
    { label: 'fl oz', factor: 1 },
    { label: 'ml', factor: 0.033814 }
  ];

  activeTab: 'compare' | 'saved' = 'compare';
  itemBeingSaved: CompareItem | null = null;
  duplicateResolutionData: { savedItem: SavedItem, existingItem: SavedItem } | null = null;
  showResetConfirm: boolean = false;
  showUpdateModal: boolean = false;
  
  constructor(
    private savedItemsService: SavedItemsService,
    private swUpdate: SwUpdate
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        this.showUpdateModal = true;
      });
    }
  }

  ngOnInit() {}

  items: CompareItem[] = [
    this.createEmptyItem(),
    this.createEmptyItem()
  ];

  createEmptyItem(): CompareItem {
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      brand: '',
      price: null,
      weight: null,
      unit: 'oz'
    };
  }

  getPricePerOz(item: CompareItem): number | null {
    if (!item.price || !item.weight || item.price <= 0 || item.weight <= 0) {
      return null;
    }
    const unitMatch = this.units.find(u => u.label === item.unit);
    const multiplier = unitMatch ? unitMatch.factor : 1;
    const totalOz = item.weight * multiplier;
    return item.price / totalOz;
  }

  get rankedItemIds(): string[] {
    return this.items
      .map(item => ({ id: item.id, pricePerOz: this.getPricePerOz(item) }))
      .filter(item => item.pricePerOz !== null)
      .sort((a, b) => a.pricePerOz! - b.pricePerOz!)
      .map(item => item.id);
  }

  getItemRankInfo(itemId: string): { rank: number, total: number, isMostExpensive: boolean } | null {
    const ids = this.rankedItemIds;
    const index = ids.indexOf(itemId);
    if (index === -1 || ids.length < 2) return null;
    return {
      rank: index + 1,
      total: ids.length,
      isMostExpensive: index === ids.length - 1
    };
  }

  getRankText(rankInfo: { rank: number, total: number, isMostExpensive: boolean }): string {
    if (rankInfo.rank === 1) return 'BEST VALUE';
    if (rankInfo.isMostExpensive) return 'MOST EXPENSIVE';
    if (rankInfo.rank === 2) return '2ND BEST';
    if (rankInfo.rank === 3) return '3RD BEST';
    return `${rankInfo.rank}TH BEST`;
  }

  addItem() {
    if (this.items.length < 6) {
      this.items.push(this.createEmptyItem());
    }
  }

  resetItems() {
    // Only prompt if there is data to clear
    const hasData = this.items.some(item => item.price !== null || item.weight !== null || item.name !== '' || item.brand !== '');
    if (hasData) {
      this.showResetConfirm = true;
    } else {
      this.doReset();
    }
  }

  doReset() {
    this.items = [this.createEmptyItem(), this.createEmptyItem()];
    this.showResetConfirm = false;
  }

  cancelReset() {
    this.showResetConfirm = false;
  }

  removeItem(index: number) {
    if (this.items.length > 2) {
      this.items.splice(index, 1);
    }
  }

  setTab(tab: 'compare' | 'saved') {
    this.activeTab = tab;
  }

  onSaveRequested(item: CompareItem) {
    this.itemBeingSaved = item;
  }

  onModalCancel() {
    this.itemBeingSaved = null;
  }

  onModalSave(savedItem: SavedItem) {
    const existing = this.savedItemsService.checkDuplicate(savedItem);
    
    if (existing) {
      this.duplicateResolutionData = { savedItem, existingItem: existing };
    } else {
      // not a duplicate, generate new ID so it is distinct from compare pool
      this.savedItemsService.saveItem({ ...savedItem, id: Math.random().toString(36).substring(2, 9) });
    }

    this.itemBeingSaved = null;
  }

  onDuplicateCancel() {
    this.duplicateResolutionData = null;
  }

  onDuplicateAdd() {
    if (this.duplicateResolutionData) {
      this.savedItemsService.saveItem({ 
        ...this.duplicateResolutionData.savedItem, 
        id: Math.random().toString(36).substring(2, 9) 
      });
      this.duplicateResolutionData = null;
    }
  }

  onDuplicateReplace() {
    if (this.duplicateResolutionData) {
      this.savedItemsService.updateItem({ 
        ...this.duplicateResolutionData.savedItem, 
        id: this.duplicateResolutionData.existingItem.id 
      });
      this.duplicateResolutionData = null;
    }
  }

  onCompareSavedItem(savedItem: SavedItem) {
    this.items = [
      { 
        id: Math.random().toString(36).substring(2, 9),
        name: savedItem.name,
        brand: savedItem.brand,
        price: savedItem.price,
        weight: savedItem.weight,
        unit: savedItem.unit
      },
      this.createEmptyItem()
    ];
    this.setTab('compare');
  }

  tryReload() {
    window.location.reload();
  }

  dismissUpdate() {
    this.showUpdateModal = false;
  }
}
