import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EditaisService } from '../../../core/services/editais.service';
import { EditalResponse } from '../../../core/models/edital.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';

@Component({
  selector: 'app-edital-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    CurrencyBrPipe,
    DateBrPipe
  ],
  templateUrl: './edital-details.component.html',
  styleUrl: './edital-details.component.scss'
})
export class EditalDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private editaisService = inject(EditaisService);

  loading = signal(false);
  edital = signal<EditalResponse | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadEdital(id);
  }

  loadEdital(id: string) {
    this.loading.set(true);
    this.editaisService.getById(id).subscribe({
      next: (edital) => {
        this.edital.set(edital);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/editais']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/editais']);
  }

  openPdf() {
    if (this.edital()?.pdfUrl) {
      window.open(this.edital()!.pdfUrl, '_blank');
    }
  }

  openSource() {
    if (this.edital()?.sourceUrl) {
      window.open(this.edital()!.sourceUrl, '_blank');
    }
  }

  delete() {
    if (confirm('Deseja realmente excluir este edital?')) {
      this.editaisService.delete(this.edital()!.id).subscribe(() => {
        this.router.navigate(['/editais']);
      });
    }
  }
}
