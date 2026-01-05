import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generates a Scryfall image URL for a card name
 * @example "Sol Ring" => "https://api.scryfall.com/cards/named?exact=Sol+Ring&format=image"
 */
@Pipe({
  name: 'cardImageUrl',
  standalone: true
})
export class CardImageUrlPipe implements PipeTransform {
  transform(cardName: string): string {
    if (!cardName) {
      return '';
    }
    
    const formattedName = cardName
      .replace(/ /g, '+')
      .replace(/'/g, '%27')
      .replace(/,/g, '%2C');
    
    return `https://api.scryfall.com/cards/named?exact=${formattedName}&format=image`;
  }
}
