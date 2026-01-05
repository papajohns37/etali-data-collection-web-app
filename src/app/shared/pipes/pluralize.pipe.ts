import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pluralizes a card type name
 * @example "Sorcery" => "Sorceries", "Creature" => "Creatures"
 */
@Pipe({
  name: 'pluralize',
  standalone: true
})
export class PluralizePipe implements PipeTransform {
  private readonly specialCases: Record<string, string> = {
    'Sorcery': 'Sorceries',
    'Conspiracy': 'Conspiracies'
  };

  transform(type: string): string {
    if (!type) {
      return '';
    }

    if (this.specialCases[type]) {
      return this.specialCases[type];
    }

    // Default: add 's'
    return type + 's';
  }
}
