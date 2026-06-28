import type { DateValidation } from '../../dto/form.dto';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidIsoDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

function earlierDate(a: string, b: string): string {
  return a <= b ? a : b;
}

export function getEffectiveDateBounds(
  validation?: DateValidation,
  today = formatLocalDate(new Date()),
): { min?: string; max?: string } {
  let min = validation?.minDate;
  let max = validation?.maxDate;

  if (validation?.onlyFuture) {
    min = min ? laterDate(min, today) : today;
  }

  if (validation?.onlyPast) {
    max = max ? earlierDate(max, today) : today;
  }

  return { min, max };
}

export function assertValidDateAnswer(
  value: string,
  validation?: DateValidation,
): void {
  if (validation?.onlyFuture && validation?.onlyPast) {
    throw new Error('Invalid date field configuration.');
  }

  if (!isValidIsoDateString(value)) {
    throw new Error('Invalid date format.');
  }

  const { min, max } = getEffectiveDateBounds(validation);

  if (min && value < min) {
    throw new Error(`Date must be on or after ${min}.`);
  }

  if (max && value > max) {
    throw new Error(`Date must be on or before ${max}.`);
  }
}
