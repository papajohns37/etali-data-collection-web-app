import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a decimal value as a percentage string
 * @example 0.5625 => "56.3%"
 */
@Pipe({
  name: 'percentage',
  standalone: true
})
export class PercentagePipe implements PipeTransform {
  transform(value: number | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    return `${(value * 100).toFixed(decimals)}%`;
  }
}
