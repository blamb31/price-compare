import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ItemCardComponent } from './components/item-card/item-card.component';

export interface CompareItem {
  id: string;
  price: number | null;
  weight: number | null;
  unit: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, ItemCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Price Compare';
  
  units = [
    { label: 'oz', factor: 1 },
    { label: 'lb', factor: 16 },
    { label: 'g', factor: 0.035274 },
    { label: 'kg', factor: 35.274 },
    { label: 'fl oz', factor: 1 },
    { label: 'ml', factor: 0.033814 }
  ];

  items: CompareItem[] = [
    this.createEmptyItem(),
    this.createEmptyItem()
  ];

  createEmptyItem(): CompareItem {
    return {
      id: Math.random().toString(36).substring(2, 9),
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

  removeItem(index: number) {
    if (this.items.length > 2) {
      this.items.splice(index, 1);
    }
  }
}
