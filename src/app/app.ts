import { Component, signal, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TourOverlayComponent } from './features/tour/tour-overlay.component';
import { TourService } from './core/services/tour.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TourOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('licitacao_auto_angular');

  private auth = inject(AuthService);
  private tourSvc = inject(TourService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.tourSvc.deveMostrar(user.tourCompleted)) {
        setTimeout(() => this.tourSvc.iniciar(), 800);
      }
    });
  }
}
