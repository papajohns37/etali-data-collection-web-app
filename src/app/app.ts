import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { CardModule } from 'primeng/card';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDrop } from '@angular/cdk/drag-drop';

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
    'World War Hulk',
    'Worldly Tutor'
  ];

  private http: HttpClient = inject(HttpClient);

  generateRandomHand() {
    this.currentHand = [];
    this.randomInt(0, this.decklist.length);
    console.log('Decklist size = ' + this.decklist.length);
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

  onBattlefieldDrop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container){
      // const x = event.dropPoint.x;
      // const y = event.dropPoint.y;
      // this.battlefield[event.previousIndex].x = x;
      // this.battlefield[event.previousIndex].y = y;
    }
    else{
      const card = event.previousContainer.data[event.previousIndex];

      const x = event.dropPoint.x;
      const y = event.dropPoint.y;

      this.battlefield.push({card, x, y});

      this.currentHand.splice(event.previousIndex, 1);
    }
  }

  onHandDrop(event: CdkDragDrop<any>) {
    if(event.previousContainer === event.container){
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else{
      const card = event.previousContainer.data[event.previousIndex];

      this.currentHand.push(card); //Try this.currentHand.splice(event.currentIndex, 0, card); for replacement
      this.battlefield.splice(event.previousIndex, 1);
    }
  }
}
