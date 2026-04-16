import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-update-modal',
  standalone: true,
  templateUrl: './update-modal.component.html',
  styleUrl: './update-modal.component.scss'
})
export class UpdateModalComponent {
  @Output() reload = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  onReload() {
    this.reload.emit();
  }

  onDismiss() {
    this.dismiss.emit();
  }
}
