import { Component, EventEmitter, inject, Output, output } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecklistService } from '../../services/decklist.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-decklist-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './decklist-form.component.html',
  styleUrl: './decklist-form.component.css'
})
export class DecklistFormComponent {
  decklistAdded = output<void>();
  
  newDecklistForm: FormGroup<{
    deckName: FormControl<string>;
    moxfieldLink: FormControl<string>;
  }>;

  private decklistService = inject(DecklistService);
  private fb = inject(NonNullableFormBuilder);

  constructor() {
    // Initialize new decklist form with validation
    this.newDecklistForm = this.fb.group({
      deckName: ['', [Validators.required, Validators.minLength(3)]],
      moxfieldLink: ['', [Validators.required, this.moxfieldUrlValidator]]
    });
  }

  /**
   * Custom validator to ensure the URL is a valid Moxfield URL
   */
  private moxfieldUrlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    try {
      const url = new URL(control.value);
      if (url.hostname === 'www.moxfield.com' || url.hostname === 'moxfield.com') {
        return null;
      }
    } catch {
      // Invalid URL format
      return { invalidMoxfieldUrl: true };
    }

    return { invalidMoxfieldUrl: true };
  }

  /**
   * Handler for submitting new decklist form
   */
  onSubmitNewDecklist(): void {
    if (this.newDecklistForm.valid) {
      const formData = this.newDecklistForm.getRawValue();

      this.decklistService.addDecklist(formData.moxfieldLink, formData.deckName).subscribe({
        next: () => {
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
