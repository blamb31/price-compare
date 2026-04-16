import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompareItem } from '../../models/compare-item.model';

export interface RankInfo {
  rank: number;
  total: number;
  isMostExpensive: boolean;
}

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss'
})
export class ItemCardComponent implements AfterViewInit {
  @Input({ required: true }) item!: CompareItem;
  @Input() pricePerOz: number | null = null;
  @Input() rankInfo: RankInfo | null = null;
  @Input() rankText: string = '';
  @Input() canRemove: boolean = false;
  @Input() units: { label: string, factor: number }[] = [];

  @Output() remove = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<CompareItem>();

  @ViewChild('priceInput') priceInput?: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.priceInput && this.item.price !== null && !isNaN(this.item.price)) {
        this.priceInput.nativeElement.value = (Math.round(this.item.price * 100) / 100).toFixed(2);
      }
    });
  }

  onRemove() {
    this.remove.emit();
  }

  onSaveRequested() {
    this.saveRequested.emit(this.item);
  }

  onPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const parts = input.value.split('.');
    
    // Check if it has more than 2 decimal places and truncate
    if (parts.length > 1 && parts[1].length > 2) {
      input.value = parts[0] + '.' + parts[1].slice(0, 2);
      if (input.value !== '') {
        this.item.price = Number(input.value);
      }
    }
  }

  onPriceBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.item.price !== null && !isNaN(this.item.price)) {
      // Round to 2 decimal places and explicitly append trailing zeros using DOM manipulation
      input.value = (Math.round(this.item.price * 100) / 100).toFixed(2);
      this.item.price = Number(input.value);
    }
  }
}
