import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => true;

export const guestGuard: CanActivateFn = () => true;
