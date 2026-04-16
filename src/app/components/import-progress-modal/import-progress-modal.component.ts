import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-import-progress-modal',
  standalone: true,
  templateUrl: './import-progress-modal.component.html',
  styleUrl: './import-progress-modal.component.scss'
})
export class ImportProgressModalComponent {
  @Input() current: number = 0;
  @Input() total: number = 0;
}
