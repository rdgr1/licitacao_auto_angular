import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, '✕', { panelClass: ['toast-success'], duration: 3500 });
  }

  error(message: string): void {
    this.snackBar.open(message, '✕', { panelClass: ['toast-error'], duration: 5000 });
  }

  info(message: string): void {
    this.snackBar.open(message, '✕', { duration: 3500 });
  }
}
