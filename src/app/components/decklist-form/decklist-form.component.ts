import { Component, EventEmitter, inject, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecklistService } from '../../services/decklist.service';

@Component({
  selector: 'app-decklist-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './decklist-form.component.html',
  styleUrl: './decklist-form.component.css'
})
export class DecklistFormComponent implements OnInit {
  @Output() decklistAdded = new EventEmitter<void>();
  newDecklistForm: FormGroup;

  private decklistService = inject(DecklistService);
  private platformId = inject(PLATFORM_ID);

  constructor(private fb: FormBuilder) {
    // Initialize new decklist form with validation
    this.newDecklistForm = this.fb.group({
      deckName: ['', [Validators.required, Validators.minLength(3)]],
      moxfieldLink: ['', [Validators.required, this.moxfieldUrlValidator]]
    });
  }

  ngOnInit(): void {
    // Only load decklists in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.decklistService.loadDecklists().subscribe({
        error: (err) => {
          console.error('Failed to load decklists:', err);
        }
      });
    }
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
