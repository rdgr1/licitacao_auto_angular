import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface NestedPageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface NestedPageBody {
  content: unknown[];
  page: NestedPageMeta;
}

function isNestedPage(body: unknown): body is NestedPageBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b['content']) &&
    typeof b['page'] === 'object' &&
    b['page'] !== null &&
    typeof (b['page'] as Record<string, unknown>)['totalElements'] === 'number'
  );
}

/**
 * O backend (Spring Data, EnableSpringDataWebSupport com
 * PageSerializationMode.DIRECT) serializa Page<T> como
 * `{ content, page: { size, number, totalElements, totalPages } }`.
 * O resto do app espera esses campos soltos no nível raiz (Page<T> em
 * edital.model.ts). Achata a resposta aqui, uma vez, em vez de corrigir
 * cada serviço que consome uma lista paginada.
 */
export const pageNormalizeInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isNestedPage(event.body)) {
        const { content, page } = event.body;
        return event.clone({
          body: {
            content,
            totalElements: page.totalElements,
            totalPages: page.totalPages,
            number: page.number,
            size: page.size,
            first: page.number === 0,
            last: page.number >= page.totalPages - 1,
            empty: content.length === 0,
          },
        });
      }
      return event;
    }),
  );
};
