import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompareItem } from '../../models/compare-item.model';
import { SavedItem } from '../../models/saved-item.model';

@Component({
  selector: 'app-save-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './save-modal.component.html',
  styleUrl: './save-modal.component.scss'
})
export class SaveModalComponent implements OnInit {
  @Input() item!: CompareItem;
  @Output() save = new EventEmitter<SavedItem>();
  @Output() cancel = new EventEmitter<void>();

  ngOnInit() {
    if (this.item) {
      if (this.item.name) this.name = this.item.name;
      if (this.item.brand) this.brand = this.item.brand;
    }
  }

  name: string = '';
  store: string = '';
  brand: string = '';
  
  // Gets today's date in YYYY-MM-DD
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  date: string = this.todayDate;

  onSave() {
    if (!this.name || !this.store) {
      return; // Basic validation
    }

    const savedItem: SavedItem = {
      ...this.item,
      name: this.name,
      store: this.store,
      brand: this.brand,
      date: this.date,
      // If we are replacing the ID to keep them separate from active compare items:
      // (Optional: for now we can just retain the id)
    };

    this.save.emit(savedItem);
  }

  onCancel() {
    this.cancel.emit();
  }
}
