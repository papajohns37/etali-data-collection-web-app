import { ChangeDetectorRef, Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

interface Decklist {
  id: number;
  name: string;
  cardNames: string[];
}

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
  existingDecklists = signal<{ id: number; name: string }[]>([]);
  selectedDecklistName = signal<string>('');

  private http: HttpClient = inject(HttpClient);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private readonly baseUrl = 'https://localhost:7194';

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
    // Only load decklists in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadExistingDecklists();
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
   * Method to get existing decklists from API
   */
  private loadExistingDecklists(): void {
    this.http.get<Decklist[]>(`${this.baseUrl}/decklists`).subscribe({
      next: (decklists) => {
        // Map API response to dropdown format
        const mappedDecklists = decklists.map(deck => ({
          id: deck.id,
          name: deck.name
        }));
        this.existingDecklists.set(mappedDecklists);
        console.log('Loaded existing decklists:', mappedDecklists);
      },
      error: (err) => {
        console.error('Failed to fetch decklists:', err);
        // Set empty array on error
        this.existingDecklists.set([]);
      }
    });
  }

  /**
   * Handler for when user selects a decklist from the dropdown
   */
  onDecklistSelected(): void {
    const selectedIdString = this.decklistSelectionForm.get('selectedDecklist')?.value;
    const selectedId = selectedIdString ? Number(selectedIdString) : null;
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

      this.http.post(`${this.baseUrl}/decklist?link=${encodeURIComponent(formData.moxfieldLink)}&name=${encodeURIComponent(formData.deckName)}`, {}).subscribe({
        next: (response) => {
          console.log('Decklist saved successfully:', response);
          
          // Reload the list of decklists from the API
          this.loadExistingDecklists();
          
          // Reset form after successful submission
          this.newDecklistForm.reset();
        },
        error: (err) => {
          console.error('Failed to save decklist:', err);
        }
      });
    }
  }
}
