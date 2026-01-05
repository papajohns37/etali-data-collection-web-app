/**
 * Layout and UI constants
 */
export const LAYOUT_CONSTANTS = {
  CARD_WIDTH_VIEWPORT_RATIO: 0.09,
  CARD_HEIGHT_VIEWPORT_RATIO: 0.15,
  MTG_CARD_ASPECT_RATIO: 1.4,
  CARD_GAP_PX: 10,
  DRAG_THRESHOLD_PX: 5,
} as const;

/**
 * Timing constants
 */
export const TIMING_CONSTANTS = {
  DOUBLE_CLICK_DELAY_MS: 250,
  SUCCESS_MESSAGE_DELAY_MS: 1500,
  TOAST_LIFE_MS: 3000,
  TOAST_ERROR_LIFE_MS: 5000,
} as const;

/**
 * HTTP constants
 */
export const HTTP_CONSTANTS = {
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 2,
  MAX_RETRY_DELAY_MS: 5000,
} as const;
