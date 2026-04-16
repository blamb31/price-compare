import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-duplicate-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './duplicate-modal.component.html',
  styleUrl: './duplicate-modal.component.scss'
})
export class DuplicateModalComponent {
  @Input() itemName: string = '';
  @Input() storeName: string = '';
  @Input() cancelText: string = 'Cancel';
  
  @Output() cancel = new EventEmitter<void>();
  @Output() addDuplicate = new EventEmitter<void>();
  @Output() replace = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  onAddDuplicate() {
    this.addDuplicate.emit();
  }

  onReplace() {
    this.replace.emit();
  }
}
