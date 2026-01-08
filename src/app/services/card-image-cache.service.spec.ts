import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CardImageCacheService } from './card-image-cache.service';
import { vi } from 'vitest';

describe('CardImageCacheService', () => {
  let service: CardImageCacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CardImageCacheService]
    });
    service = TestBed.inject(CardImageCacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Clear IndexedDB after each test
    service.clearCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and cache an image on cache miss', async () => {
    const cardName = 'Sol Ring';
    const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });

    const promise = new Promise<void>((resolve) => {
      service.getImage(cardName).subscribe({
        next: (url) => {
          expect(url).toBeTruthy();
          expect(url.startsWith('blob:')).toBe(true);
          resolve();
        }
      });
    });

    const req = httpMock.expectOne(request => 
      request.url.includes('scryfall.com') && request.url.includes('Sol+Ring')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);

    await promise;
  });

  it('should return cached image on subsequent requests', async () => {
    const cardName = 'Lightning Bolt';
    const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });

    // First request - should hit network
    service.getImage(cardName).subscribe();
    const req1 = httpMock.expectOne(request => request.url.includes('Lightning+Bolt'));
    req1.flush(mockBlob);

    // Wait a bit for cache to be written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request - should use cache (no HTTP request)
    service.getImage(cardName).subscribe({
      next: (url) => {
        expect(url).toBeTruthy();
      }
    });

    // Verify no additional HTTP requests were made
    httpMock.expectNone(request => request.url.includes('Lightning+Bolt'));
  });

  it('should handle errors gracefully', async () => {
    const cardName = 'Invalid Card';

    const promise = new Promise<void>((resolve) => {
      service.getImage(cardName).subscribe({
        next: (url) => {
          // Should return empty string on error
          expect(url).toBe('');
          resolve();
        }
      });
    });

    const req = httpMock.expectOne(request => request.url.includes('Invalid+Card'));
    req.error(new ProgressEvent('error'));

    await promise;
  });

  it('should clear cache', async () => {
    await service.clearCache();
    const stats = await service.getCacheStats();
    expect(stats.count).toBe(0);
    expect(stats.totalSize).toBe(0);
  });

  it('should get cache statistics', async () => {
    const stats = await service.getCacheStats();
    expect(stats).toBeDefined();
    expect(stats.count).toBeGreaterThanOrEqual(0);
    expect(stats.totalSize).toBeGreaterThanOrEqual(0);
  });

  it('should preload multiple images', async () => {
    const cardNames = ['Sol Ring', 'Command Tower', 'Lightning Bolt'];
    const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });

    const promise = new Promise<void>((resolve) => {
      service.preloadImages(cardNames).subscribe({
        next: () => {
          resolve();
        }
      });
    });

    // Expect 3 HTTP requests
    cardNames.forEach(() => {
      const req = httpMock.expectOne(request => request.url.includes('scryfall.com'));
      req.flush(mockBlob);
    });

    await promise;
  });

  it('should handle empty card name', async () => {
    const promise = new Promise<void>((resolve) => {
      service.getImage('').subscribe({
        error: (error) => {
          expect(error.message).toBe('Card name is required');
          resolve();
        }
      });
    });

    await promise;
  });
});
