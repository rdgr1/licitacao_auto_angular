import {
  trigger, transition, style, animate,
  query, stagger, group
} from '@angular/animations';

const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(`250ms ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`150ms ${EASING}`, style({ opacity: 0 })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' }),
      stagger('30ms', [
        animate(`250ms ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: '0', overflow: 'hidden', opacity: 0 }),
    animate(`250ms ${EASING}`, style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(`150ms ${EASING}`, style({ height: '0', opacity: 0 })),
  ]),
]);

export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(4px)' }),
      animate(`250ms ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);
