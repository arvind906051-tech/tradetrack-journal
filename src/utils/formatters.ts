import { CurrencyCode } from '../types/trade';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR', showSign: boolean = false): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let formattedNumber: string;
  if (currency === 'INR') {
    formattedNumber = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else {
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (isNegative) {
    return `-${symbol}${formattedNumber}`;
  }
  if (showSign && amount > 0) {
    return `+${symbol}${formattedNumber}`;
  }
  return `${symbol}${formattedNumber}`;
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const formatted = abs.toFixed(2) + '%';
  if (isNegative) return `-${formatted}`;
  if (showSign && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatRMultiple(r: number | undefined): string {
  if (r === undefined || isNaN(r)) return '—';
  const prefix = r > 0 ? '+' : '';
  return `${prefix}${r.toFixed(2)}R`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
