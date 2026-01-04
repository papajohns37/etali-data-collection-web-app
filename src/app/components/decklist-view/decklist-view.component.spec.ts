import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecklistViewComponent } from './decklist-view.component';
import { DecklistService } from '../../services/decklist.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('DecklistViewComponent', () => {
  let component: DecklistViewComponent;
  let fixture: ComponentFixture<DecklistViewComponent>;
  let mockDecklistService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockDecklistService = {
      decklists: signal([
        {
          id: 1,
          name: 'Test Deck',
          cards: [
            { name: 'Sol Ring', type: 'Artifact' },
            { name: 'Command Tower', type: 'Land' },
            { name: 'Lightning Bolt', type: 'Instant' },
            { name: 'Wrath of God', type: 'Sorcery' },
            { name: 'Llanowar Elves', type: 'Creature — Elf Druid' }
          ],
          moxfieldUrl: 'https://moxfield.com/decks/test',
          createdAt: new Date('2024-01-15')
        }
      ]),
      loadDecklists: vi.fn().mockReturnValue(of([]))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DecklistViewComponent],
      providers: [
        { provide: DecklistService, useValue: mockDecklistService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? '1' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DecklistViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('getPrimaryType', () => {
    it('should extract primary type from simple type line', () => {
      const result = (component as any).getPrimaryType('Artifact');
      expect(result).toBe('Artifact');
    });

    it('should extract primary type from compound type line', () => {
      const result = (component as any).getPrimaryType('Artifact Creature — Golem');
      expect(result).toBe('Artifact');
    });

    it('should skip supertypes and extract main type', () => {
      const result = (component as any).getPrimaryType('Legendary Creature — Dragon');
      expect(result).toBe('Creature');
    });

    it('should handle basic lands', () => {
      const result = (component as any).getPrimaryType('Basic Land — Forest');
      expect(result).toBe('Land');
    });

    it('should handle snow permanents', () => {
      const result = (component as any).getPrimaryType('Snow Artifact');
      expect(result).toBe('Artifact');
    });
  });

  describe('pluralize', () => {
    it('should pluralize regular types by adding s', () => {
      expect(component.pluralize('Artifact')).toBe('Artifacts');
      expect(component.pluralize('Creature')).toBe('Creatures');
      expect(component.pluralize('Land')).toBe('Lands');
    });

    it('should handle special pluralization for Sorcery', () => {
      expect(component.pluralize('Sorcery')).toBe('Sorceries');
    });

    it('should handle special pluralization for Conspiracy', () => {
      expect(component.pluralize('Conspiracy')).toBe('Conspiracies');
    });
  });

  describe('cardGroups', () => {
    it('should group cards by primary type', () => {
      const groups = component.cardGroups();
      
      expect(groups.length).toBeGreaterThan(0);
      
      const artifactGroup = groups.find(g => g.type === 'Artifact');
      expect(artifactGroup).toBeDefined();
      expect(artifactGroup?.cards.some(c => c.name === 'Sol Ring')).toBe(true);
    });

    it('should sort cards alphabetically within groups', () => {
      const decklist = {
        id: 1,
        name: 'Test Deck',
        cards: [
          { name: 'Zebra', type: 'Creature' },
          { name: 'Apple', type: 'Creature' },
          { name: 'Banana', type: 'Creature' }
        ],
        createdAt: new Date('2024-01-15')
      };
      component.decklist.set(decklist);
      fixture.detectChanges();
      
      const groups = component.cardGroups();
      const creatureGroup = groups.find(g => g.type === 'Creature');
      
      expect(creatureGroup?.cards[0].name).toBe('Apple');
      expect(creatureGroup?.cards[1].name).toBe('Banana');
      expect(creatureGroup?.cards[2].name).toBe('Zebra');
    });

    it('should prioritize types according to TYPE_PRIORITY', () => {
      const groups = component.cardGroups();
      const typeOrder = groups.map(g => g.type);
      
      const landIndex = typeOrder.indexOf('Land');
      const instantIndex = typeOrder.indexOf('Instant');
      
      // Land should come before Instant in priority order
      if (landIndex !== -1 && instantIndex !== -1) {
        expect(landIndex).toBeLessThan(instantIndex);
      }
    });
  });

  describe('totalCards', () => {
    it('should calculate total card count', () => {
      const total = component.totalCards();
      expect(total).toBe(5);
    });

    it('should return 0 when no decklist is loaded', () => {
      component.decklist.set(null);
      const total = component.totalCards();
      expect(total).toBe(0);
    });
  });

  describe('formattedDate', () => {
    it('should format date in long format', () => {
      const formatted = component.formattedDate();
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
    });

    it('should return empty string when no date', () => {
      const decklist = {
        id: 1,
        name: 'Test Deck',
        cards: [],
        createdAt: null as any
      };
      component.decklist.set(decklist);
      fixture.detectChanges();
      
      const formatted = component.formattedDate();
      expect(formatted).toBe('');
    });
  });

  describe('toggleViewMode', () => {
    it('should toggle from text to image', () => {
      component.viewMode.set('text');
      component.toggleViewMode();
      expect(component.viewMode()).toBe('image');
    });

    it('should toggle from image to text', () => {
      component.viewMode.set('image');
      component.toggleViewMode();
      expect(component.viewMode()).toBe('text');
    });
  });

  describe('mouse tracking for card preview', () => {
    it('should set hovered card and mouse position', () => {
      const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent;
      
      component.onCardHover('Sol Ring', mockEvent);
      
      expect(component.hoveredCard()).toBe('Sol Ring');
      expect(component.mouseX()).toBe(100);
      expect(component.mouseY()).toBe(200);
    });

    it('should update mouse position on move', () => {
      const mockEvent = { clientX: 150, clientY: 250 } as MouseEvent;
      
      component.onCardMouseMove(mockEvent);
      
      expect(component.mouseX()).toBe(150);
      expect(component.mouseY()).toBe(250);
    });

    it('should clear hovered card on leave', () => {
      component.hoveredCard.set('Sol Ring');
      component.onCardLeave();
      expect(component.hoveredCard()).toBeNull();
    });
  });
});
