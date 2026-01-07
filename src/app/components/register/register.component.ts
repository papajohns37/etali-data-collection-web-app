import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';

/**
 * Register component for creating new users (Admin only)
 * 
 * Validates password requirements and role assignment
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    MessageModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  registerForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  // Password requirements for display
  passwordRequirements = [
    'Minimum 6 characters',
    'At least 1 uppercase letter',
    'At least 1 lowercase letter',
    'At least 1 digit',
    'At least 1 special character'
  ];

  constructor() {
    // Initialize form with validators
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      isAdmin: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator for password requirements
   */
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    
    if (!password) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { passwordRequirements: true } : null;
  }

  /**
   * Custom validator to check if password and confirmPassword match
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.value;

    this.authService.register({
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      isAdmin: formValue.isAdmin
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'User Registered',
          detail: `User ${response.email} has been registered as ${response.role}`,
          life: 5000
        });
        
        // Reset form after successful registration
        this.registerForm.reset({ isAdmin: false });
      },
      error: (error) => {
        this.isLoading.set(false);
        
        if (error.status === 403) {
          this.errorMessage.set('Access denied. Only administrators can register new users.');
        } else if (error.status === 400) {
          this.errorMessage.set(error.error?.message || 'Invalid registration data. Please check your input.');
        } else if (error.status === 0) {
          this.errorMessage.set('Unable to connect to server. Please try again later.');
        } else {
          this.errorMessage.set('An error occurred during registration. Please try again.');
        }
      }
    });
  }

  /**
   * Check if a form field has an error and has been touched
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Check if form has a specific error
   */
  hasFormError(errorType: string): boolean {
    return this.registerForm.hasError(errorType);
  }

  /**
   * Mark all fields in form as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navigate back to home
   */
  cancel(): void {
    this.router.navigate(['/']);
  }
}
