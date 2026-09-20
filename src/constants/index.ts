export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export const VISIT_COOLDOWN_MINUTES = 30;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_DIMENSION = 4096;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const THUMBNAIL_SIZE = 400;

export const STORY_CARD_SIZES = {
  portrait: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

export const LIVE_WALL_COOLDOWN_MINUTES = 20;
export const SCREEN_HEARTBEAT_INTERVAL_SECONDS = 30;
export const SCREEN_OFFLINE_THRESHOLD_MINUTES = 5;
export const DEFAULT_SLIDE_DURATION_SECONDS = 10;
