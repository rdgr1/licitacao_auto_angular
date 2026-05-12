import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, action = 'OK') {
    this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  error(message: string, action = 'OK') {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }

  info(message: string, action = 'OK') {
    this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['snackbar-info'],
    });
  }

  warning(message: string, action = 'OK') {
    this.snackBar.open(message, action, {
      duration: 4000,
      panelClass: ['snackbar-warning'],
    });
  }
}
