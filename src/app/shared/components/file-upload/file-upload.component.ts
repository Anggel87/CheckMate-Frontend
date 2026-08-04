import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  template: `
    <label class="file-upload">
      <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
      <input type="file" [accept]="accept" [multiple]="multiple" (change)="onFilesSelected($event)" />
    </label>
  `,
})
export class FileUploadComponent {
  @Input() title = 'Selecciona un archivo';
  @Input() description = 'Arrastra o busca el archivo desde tu equipo.';
  @Input() accept = '';
  @Input() multiple = false;
  @Output() readonly filesSelected = new EventEmitter<File[]>();

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filesSelected.emit(Array.from(input.files ?? []));
  }
}
