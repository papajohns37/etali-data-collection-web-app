import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CachedImageDirective } from './cached-image.directive';
import { CardImageCacheService } from '../../services/card-image-cache.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

@Component({
  template: '<img [cachedSrc]="cardName" alt="test card" />',
  standalone: true,
  imports: [CachedImageDirective]
})
class TestComponent {
  cardName = 'Sol Ring';
}

describe('CachedImageDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let mockCacheService: any;

  beforeEach(() => {
    mockCacheService = {
      getImage: vi.fn().mockReturnValue(of('blob:mock-url'))
    };

    TestBed.configureTestingModule({
      imports: [TestComponent, CachedImageDirective],
      providers: [
        { provide: CardImageCacheService, useValue: mockCacheService }
      ]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load image from cache service', () => {
    fixture.detectChanges();
    
    expect(mockCacheService.getImage).toHaveBeenCalledWith('Sol Ring');
    
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.src).toContain('blob:mock-url');
  });

  it('should handle loading errors', () => {
    mockCacheService.getImage = vi.fn().mockReturnValue(throwError(() => new Error('Failed to load')));
    
    fixture.detectChanges();
    
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('data-error')).toBe('true');
  });

  it('should handle empty URLs', () => {
    mockCacheService.getImage = vi.fn().mockReturnValue(of(''));
    
    fixture.detectChanges();
    
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('data-error')).toBe('true');
  });

  it('should clean up on destroy', () => {
    fixture.detectChanges();
    
    // Spy on URL.revokeObjectURL
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    
    fixture.destroy();
    
    // Should revoke the blob URL
    expect(revokeSpy).toHaveBeenCalled();
  });
});
