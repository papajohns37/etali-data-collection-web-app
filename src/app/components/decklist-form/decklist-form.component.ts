import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-decklist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './decklist-form.component.html',
  styleUrl: './decklist-form.component.css'
})
export class DecklistFormComponent implements OnInit {
  decklistSelectionForm: FormGroup;
  newDecklistForm: FormGroup;
  existingDecklists = signal<{ id: string; name: string }[]>([]);
  selectedDecklistName = signal<string>('');

  constructor(private fb: FormBuilder) {
    // Initialize dropdown form
    this.decklistSelectionForm = this.fb.group({
      selectedDecklist: ['']
    });

    // Initialize new decklist form with validation
    this.newDecklistForm = this.fb.group({
      deckName: ['', [Validators.required, Validators.minLength(3)]],
      moxfieldLink: ['', [Validators.required, this.moxfieldUrlValidator]]
    });
  }

  ngOnInit(): void {
    this.loadExistingDecklists();
  }

  /**
   * Custom validator to ensure the URL contains "moxfield.com"
   */
  private moxfieldUrlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const url = control.value.toLowerCase();
    if (url.includes('moxfield.com')) {
      return null;
    }

    return { invalidMoxfieldUrl: true };
  }

  /**
   * Method to get existing decklists - will be implemented later
   * Currently returns mock data
   */
  private loadExistingDecklists(): void {
    // TODO: Replace with actual API call to fetch decklists
    this.existingDecklists.set(this.getExistingDecklists());
    console.log('Loaded existing decklists:', this.existingDecklists());
  }

  /**
   * Gets list of existing decklists
   * This will be replaced with actual data fetching later
   */
  getExistingDecklists(): { id: string; name: string }[] {
    console.log('getExistingDecklists() called - placeholder for future implementation');
    
    // Mock data for now
    return [
      { id: '1', name: 'Etali Deck v1' },
      { id: '2', name: 'Etali Deck v2' },
      { id: '3', name: 'Etali Aggro' },
      { id: '4', name: 'Etali Control' }
    ];
  }

  /**
   * Handler for when user selects a decklist from the dropdown
   */
  onDecklistSelected(): void {
    const selectedId = this.decklistSelectionForm.get('selectedDecklist')?.value;
    const selectedDecklist = this.existingDecklists().find(deck => deck.id === selectedId);
    const deckName = selectedDecklist?.name || 'None';
    
    this.selectedDecklistName.set(deckName);
    console.log('Selected decklist name:', deckName);
    
    // TODO: Implement actual decklist loading logic
  }

  /**
   * Handler for submitting new decklist form
   */
  onSubmitNewDecklist(): void {
    if (this.newDecklistForm.valid) {
      const formData = this.newDecklistForm.value;
      
      console.log('New decklist form submitted:', {
        deckName: formData.deckName,
        moxfieldLink: formData.moxfieldLink
      });
      
      // TODO: Implement actual submission logic to backend
      // For now, add the new deck to the existing list
      const newDeck = {
        id: (this.existingDecklists().length + 1).toString(),
        name: formData.deckName
      };
      this.existingDecklists.update(decks => [...decks, newDeck]);
      console.log('Updated decklists:', this.existingDecklists());
      
      // Reset form after submission
      this.newDecklistForm.reset();
    } else {
      console.log('Form is invalid, cannot submit');
    }
  }
}
