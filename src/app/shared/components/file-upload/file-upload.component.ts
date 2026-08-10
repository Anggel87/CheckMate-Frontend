import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  template: `
    <div class="file-upload-field">
      <label class="file-upload" [class.is-disabled]="disabled">
        <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
        <strong>{{ title }}</strong>
        <span>{{ description }}</span>
        <small>{{ helperText() }}</small>
        <input
          #fileInput
          type="file"
          [accept]="accept"
          [multiple]="multiple"
          [disabled]="disabled"
          (change)="onFilesSelected($event)"
        />
      </label>

      @if (errorMessage()) {
        <p class="checkmate-field-error">
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          {{ errorMessage() }}
        </p>
      }

      @if (selectedFiles().length) {
        <div class="file-upload-preview" aria-label="Archivos seleccionados">
          @for (file of selectedFiles(); track file.name) {
            <article class="file-upload-preview__item">
              @if (file.previewUrl) {
                <img [src]="file.previewUrl" [alt]="file.name" />
              } @else {
                <span>
                  <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                </span>
              }
              <div>
                <strong>{{ file.name }}</strong>
                <small>{{ file.sizeLabel }}</small>
              </div>
              <button type="button" class="icon-button" aria-label="Eliminar archivo" (click)="removeFile(file.name)">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </article>
          }
        </div>
      } @else if (currentFileUrl) {
        <div class="file-upload-preview" aria-label="Archivo actual">
          <article class="file-upload-preview__item">
            <img [src]="currentFileUrl" alt="Archivo actual" />
            <div>
              <strong>Archivo actual</strong>
              <small>Puedes reemplazarlo seleccionando otro archivo.</small>
            </div>
          </article>
        </div>
      }
    </div>
  `,
})
export class FileUploadComponent {
  @Input() title = 'Selecciona un archivo';
  @Input() description = 'Arrastra o busca el archivo desde tu equipo.';
  @Input() accept = '';
  @Input() multiple = false;
  @Input() maxSizeMb = 10;
  @Input() disabled = false;
  @Input() currentFileUrl = '';
  @Output() readonly filesSelected = new EventEmitter<File[]>();
  @Output() readonly fileRemoved = new EventEmitter<void>();

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  protected readonly selectedFiles = signal<FilePreview[]>([]);
  protected readonly errorMessage = signal('');

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const acceptedFiles = this.multiple ? files : files.slice(0, 1);
    const validationError = this.validateFiles(acceptedFiles);

    if (validationError) {
      this.errorMessage.set(validationError);
      this.selectedFiles.set([]);
      this.filesSelected.emit([]);
      this.clearNativeInput();
      return;
    }

    this.errorMessage.set('');
    this.filesSelected.emit(acceptedFiles);
    this.buildPreviews(acceptedFiles);
  }

  removeFile(fileName: string): void {
    const remaining = this.selectedFiles().filter((file) => file.name !== fileName);
    this.selectedFiles.set(remaining);
    this.errorMessage.set('');

    if (!remaining.length) {
      this.clearNativeInput();
    }

    this.fileRemoved.emit();
  }

  protected helperText(): string {
    const formats = this.accept ? this.accept.replaceAll(',', ', ') : 'Imagenes o PDF';
    return `Formatos: ${formats}. Max. ${this.maxSizeMb}MB`;
  }

  private validateFiles(files: File[]): string {
    if (!files.length) {
      return '';
    }

    const maxSize = this.maxSizeMb * 1024 * 1024;
    const allowedTypes = this.accept
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);

    const oversized = files.find((file) => file.size > maxSize);

    if (oversized) {
      return `El archivo ${oversized.name} supera el limite de ${this.maxSizeMb}MB.`;
    }

    if (!allowedTypes.length) {
      return '';
    }

    const invalid = files.find((file) => !this.matchesAcceptedType(file, allowedTypes));
    return invalid ? `El archivo ${invalid.name} no tiene un formato permitido.` : '';
  }

  private matchesAcceptedType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }

      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }

      return file.type === type;
    });
  }

  private buildPreviews(files: File[]): void {
    if (!files.length) {
      this.selectedFiles.set([]);
      return;
    }

    const previews = files.map((file) => ({
      name: file.name,
      sizeLabel: this.formatSize(file.size),
      previewUrl: '',
    }));

    this.selectedFiles.set(previews);

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const next = [...this.selectedFiles()];
        const current = next[index];

        if (!current) {
          return;
        }

        next[index] = {
          ...current,
          previewUrl: typeof reader.result === 'string' ? reader.result : '',
        };
        this.selectedFiles.set(next);
      };
      reader.readAsDataURL(file);
    });
  }

  private formatSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private clearNativeInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}

interface FilePreview {
  name: string;
  sizeLabel: string;
  previewUrl: string;
}
