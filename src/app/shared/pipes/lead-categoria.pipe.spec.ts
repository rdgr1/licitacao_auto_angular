import { LeadCategoriaPipe } from './lead-categoria.pipe';

describe('LeadCategoriaPipe', () => {
  const pipe = new LeadCategoriaPipe();

  it('mapeia VIGILÂNCIA com label e cor', () => {
    const result = pipe.transform('VIGILÂNCIA');
    expect(result.label).toBe('Vigilância');
    expect(result.hidden).toBe(false);
  });

  it('mapeia DESCARTADO com label neutro', () => {
    const result = pipe.transform('DESCARTADO');
    expect(result.label).toBe('Descartado (IA)');
    expect(result.hidden).toBe(false);
  });

  it('esconde SEM_CATEGORIA', () => {
    expect(pipe.transform('SEM_CATEGORIA').hidden).toBe(true);
  });

  it('esconde valores nulos, indefinidos ou desconhecidos', () => {
    expect(pipe.transform(null).hidden).toBe(true);
    expect(pipe.transform(undefined).hidden).toBe(true);
    expect(pipe.transform('ALGO_NAO_MAPEADO').hidden).toBe(true);
  });
});
