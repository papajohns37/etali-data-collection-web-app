import { Directive, ElementRef, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardImageCacheService } from '../../services/card-image-cache.service';

/**
 * Directive for loading card images with caching support.
 * 
 * Usage:
 *   <img [cachedSrc]="cardName" [alt]="cardName" />
 * 
 * This directive will:
 * 1. Check IndexedDB cache for the image
 * 2. Load from cache if available and not expired
 * 3. Fetch from Scryfall API on cache miss
 * 4. Automatically cache fetched images
 * 5. Handle errors gracefully with fallback
 * 6. Automatically reload when card name changes
 */
@Directive({
  selector: 'img[cachedSrc]',
  standalone: true
})
export class CachedImageDirective implements OnInit, OnChanges, OnDestroy {
  private cacheService = inject(CardImageCacheService);
  private elementRef = inject(ElementRef<HTMLImageElement>);
  
  private subscription?: Subscription;
  private currentObjectUrl?: string;

  /**
   * The card name to load an image for
   */
  @Input() cachedSrc: string = '';

  ngOnInit(): void {
    this.loadImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload image when card name changes
    if (changes['cachedSrc'] && !changes['cachedSrc'].firstChange) {
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Load the image from cache or network
   */
  private loadImage(): void {
    // Clean up previous subscription and object URL
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = undefined;
    }

    if (!this.cachedSrc) {
      return;
    }

    const img = this.elementRef.nativeElement;
    
    // Set loading state
    img.style.opacity = '0.5';
    
    this.subscription = this.cacheService.getImage(this.cachedSrc).subscribe({
      next: (url) => {
        if (url) {
          // Revoke previous object URL to prevent memory leaks
          if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
          }
          
          this.currentObjectUrl = url;
          img.src = url;
          img.style.opacity = '1';
        } else {
          // Empty URL means error occurred
          this.handleError();
        }
      },
      error: (error) => {
        console.error(`Failed to load image for ${this.cachedSrc}:`, error);
        this.handleError();
      }
    });
  }

  /**
   * Handle image loading errors
   */
  private handleError(): void {
    const img = this.elementRef.nativeElement;
    img.style.opacity = '1';
    img.style.background = '#f0f0f0';
    img.style.border = '1px solid #ddd';
    
    // Set a data attribute so CSS can style it
    img.setAttribute('data-error', 'true');
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = undefined;
    }
  }
}
