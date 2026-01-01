import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecklistService } from '../../services/decklist.service';

@Component({
  selector: 'app-decklist-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './decklist-form.component.html',
  styleUrl: './decklist-form.component.css'
})
export class DecklistFormComponent {
  @Output() decklistAdded = new EventEmitter<void>();
  newDecklistForm: FormGroup;

  private decklistService = inject(DecklistService);
  private fb = inject(FormBuilder);

  constructor() {
    // Initialize new decklist form with validation
    this.newDecklistForm = this.fb.group({
      deckName: ['', [Validators.required, Validators.minLength(3)]],
      moxfieldLink: ['', [Validators.required, this.moxfieldUrlValidator]]
    });
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
   * Handler for submitting new decklist form
   */
  onSubmitNewDecklist(): void {
    if (this.newDecklistForm.valid) {
      const formData = this.newDecklistForm.value;
      
      console.log('New decklist form submitted:', {
        deckName: formData.deckName,
        moxfieldLink: formData.moxfieldLink
      });

      this.decklistService.addDecklist(formData.moxfieldLink, formData.deckName).subscribe({
        next: (response) => {
          console.log('Decklist saved successfully:', response);
          
          // Reset form after successful submission
          this.newDecklistForm.reset();
          
          // Emit event to close modal
          this.decklistAdded.emit();
        },
        error: (err) => {
          console.error('Failed to save decklist:', err);
        }
      });
    }
  }
}
