import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompareItem } from '../../app.component';

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
export class ItemCardComponent {
  @Input({ required: true }) item!: CompareItem;
  @Input() pricePerOz: number | null = null;
  @Input() rankInfo: RankInfo | null = null;
  @Input() rankText: string = '';
  @Input() canRemove: boolean = false;
  @Input() units: { label: string, factor: number }[] = [];

  @Output() remove = new EventEmitter<void>();

  onRemove() {
    this.remove.emit();
  }
}
