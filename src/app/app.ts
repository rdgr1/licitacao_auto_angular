import { Component, signal, effect, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs';
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
  private titleSvc = inject(Title);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.tourSvc.deveMostrar(user.tourCompleted)) {
        setTimeout(() => this.tourSvc.iniciar(), 800);
      }
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.root;
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data?.['title'] ?? 'LicitaFlow';
      })
    ).subscribe(t => this.titleSvc.setTitle(t));
  }
}
