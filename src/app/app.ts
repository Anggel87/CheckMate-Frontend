import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading.service';
import { DialogContainerComponent } from './shared/feedback/components/dialog-container/dialog-container.component';
import { ToastContainerComponent } from './shared/feedback/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogContainerComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('CheckMate-Frontend');
  protected readonly loadingService = inject(LoadingService);
}
