import { UnprocessableEntityException } from '@nestjs/common';

export function pageQuery(query: Record<string, unknown>) {
  const numeric = (key: string, fallback: number, max: number) => {
    const value = query[key];
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > max) {
      throw new UnprocessableEntityException(`Parámetro ${key} inválido.`);
    }
    return Number(value);
  };
  return { page: numeric('page', 1, 10000), pageSize: numeric('pageSize', 20, 50) };
}

export function searchQuery(value: unknown) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.trim().length > 120) throw new UnprocessableEntityException('Búsqueda inválida.');
  const search = value.trim();
  return search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
}

export function enumQuery<const T extends readonly string[]>(value: unknown, allowed: T, name: string): T[number] | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !allowed.includes(value)) throw new UnprocessableEntityException(`Filtro ${name} inválido.`);
  return value as T[number];
}
