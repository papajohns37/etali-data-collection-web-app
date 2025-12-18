import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { CardModule } from 'primeng/card';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DragDropModule, CommonModule, CdkDrag, CdkDropList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mtg-data');
  currentHand: string[] = [''];
  battlefield: {card: string, x: number, y: number}[] = [];
  decklist = [
    '_____ Goblin',
    'Ancient Tomb',
    'Arid Mesa',
    'Autumn\'s Veil',
    'Birds of Paradise',
    'Birgi, God of Storytelling',
    'Bloodstained Mire',
    'Boseiju, Who Endures',
    'Chandra, Flameshaper',
    'Chrome Mox',
    'City of Brass',
    'City of Traitors',
    'Command Tower',
    'Copperline Gorge',
    'Cragcrown Pathway',
    'Crop Rotation',
    'Crystal Vein',
    'Cursed Mirror',
    'Deflecting Swat',
    'Desperate Ritual',
    'Devastating Onslaught',
    'Dualcaster Mage',
    'Dwarven Ruins',
    'Eldrazi Confluence',
    'Eldritch Evolution',
    'Electroduplicate',
    'Elvish Spirit Guide',
    'Emerald Charm',
    'Emrakul, the Promised End',
    'Eternal Witness',
    'Evendo Brushrazer',
    'Flare of Duplication',
    'Food Chain',
    'Forbidden Orchard',
    'Forbidden Orchard',
    'Fury',
    'Gamble',
    'Gemstone Caverns',
    'Geosurge',
    'Grim Monolith',
    'Grove of the Burnwillows',
    'Guttural Response',
    'Heat Shimmer',
    'Hellkite Courser',
    'Hunting Velociraptor',
    'Imperial Recruiter',
    'Infernal Plunge',
    'Jaxis, the Troublemaker',
    'Jeska\'s Will',
    'Karplusan Forest',
    'Lion\'s Eye Diamond',
    'Lotus Petal',
    'Mana Confluence',
    'Mana Vault',
    'Metamorphosis',
    'Misty Rainforest',
    'Molten Duplication',
    'Mountain',
    'Mox Diamond',
    'Multiversal Passage',
    'Natural State',
    'Nature\'s Claim',
    'Noxious Revival',
    'Open the Omenpaths',
    'Orcish Lumberjack',
    'Pick Your Poison',
    'Prismatic Vista',
    'Pyretic Ritual',
    'Pyroblast',
    'Pyrokinesis',
    'Ragavan, Nimble Pilferer',
    'Red Elemental Blast',
    'Rionya, Fire Dancer',
    'Rite of Flame',
    'Sandstone Needle',
    'Scalding Tarn',
    'Seething Song',
    'Simian Spirit Guide',
    'Snow-Covered Forest',
    'Snow-Covered Mountain',
    'Sol Ring',
    'Spire Garden',
    'Squee, the Immortal',
    'Starting Town',
    'Stomping Ground',
    'Strike It Rich',
    'Sylvan Tutor',
    'Taiga',
    'Thornspire Verge',
    'Tinder Wall',
    'Treasonous Ogre',
    'Twinflame',
    'Underworld Breach',
    'Veil of Summer',
    'Verdant Catacombs',
    'Wheel of Fortune',
    'Windswept Heath',
    'Wooded Foothills',
    'Worldly Tutor'
  ];

  private http: HttpClient = inject(HttpClient);

  generateRandomHand() {
    this.currentHand = [];
    this.randomInt(0, this.decklist.length);
    while (this.currentHand.length < 7) {
      const randIndex = this.randomInt(0, this.decklist.length);
      const card = this.decklist[randIndex];
      if (!this.currentHand.includes(card)) {
        this.currentHand.push(card);
      }
    }
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getImageUrl(cardName: string): string {
    const formattedName = cardName.replace(/ /g, '+').replace(/'/g, '%27').replace(/,/g, '%2C');
    return `https://api.scryfall.com/cards/named?exact=${formattedName}&format=image`;
  }

  onHandDrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.currentHand, event.previousIndex, event.currentIndex);
    }
  }

  onHandCardDragEnded(event: CdkDragEnd, card: string, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    
    if (battlefieldZone) {
      const rect = battlefieldZone.getBoundingClientRect();
      
      if (dropPoint.x >= rect.left && dropPoint.x <= rect.right &&
          dropPoint.y >= rect.top && dropPoint.y <= rect.bottom) {
        // Calculate position relative to battlefield, centering the card
        const x = dropPoint.x - rect.left - 100; // 100 = card width / 2
        const y = dropPoint.y - rect.top - 15;
        
        // Constrain within bounds
        const constrainedX = Math.max(0, Math.min(x, rect.width - 200));
        const constrainedY = Math.max(0, Math.min(y, rect.height - 280));
        
        this.battlefield.push({ card, x: constrainedX, y: constrainedY });
        this.currentHand.splice(index, 1);
      }
    }
  }

  onBattlefieldCardDragEnded(event: CdkDragEnd, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    const handZone = document.querySelector('.hand-zone');
    
    // Store original position for potential reset
    const originalX = this.battlefield[index].x;
    const originalY = this.battlefield[index].y;
    
    // Check if card was dropped back on hand zone
    if (handZone) {
      const handRect = handZone.getBoundingClientRect();
      
      if (dropPoint.x >= handRect.left && dropPoint.x <= handRect.right &&
          dropPoint.y >= handRect.top && dropPoint.y <= handRect.bottom) {
        const cardData = this.battlefield[index];
        this.currentHand.push(cardData.card);
        this.battlefield.splice(index, 1);
        return;
      }
    }
    
    // Check if card was dropped within battlefield bounds
    if (battlefieldZone) {
      const battlefieldRect = battlefieldZone.getBoundingClientRect();
      const distance = event.distance;
      
      // Calculate new position based on original position plus drag distance
      let newX = originalX + distance.x;
      let newY = originalY + distance.y;
      
      // Check if new position is within battlefield bounds
      const isWithinBounds = newX >= 0 && newX <= battlefieldRect.width - 200 &&
                             newY >= 0 && newY <= battlefieldRect.height - 280;
      
      if (isWithinBounds) {
        // Update to new position
        this.battlefield[index].x = newX;
        this.battlefield[index].y = newY;
      } else {
        // Return to original position if dropped outside battlefield
        this.battlefield[index].x = originalX;
        this.battlefield[index].y = originalY;
      }
      
      // Reset the drag position to prevent double-transform
      event.source.reset();
    }
  }
}
