import { Pipe, PipeTransform } from '@angular/core';

export type ScoreRange = 'cold' | 'warm' | 'hot';

export interface ScoreBadge {
  label: string;
  range: ScoreRange;
  color: string;
}

@Pipe({
  name: 'scoreBadge',
  standalone: true
})
export class ScoreBadgePipe implements PipeTransform {
  transform(score: number): ScoreBadge {
    if (score >= 70) {
      return { label: 'Quente', range: 'hot', color: 'var(--color-score-hot)' };
    } else if (score >= 40) {
      return { label: 'Morno', range: 'warm', color: 'var(--color-score-warm)' };
    } else {
      return { label: 'Frio', range: 'cold', color: 'var(--color-score-cold)' };
    }
  }
}
