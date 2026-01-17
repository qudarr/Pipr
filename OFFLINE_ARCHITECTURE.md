# Offline-First Architecture

This application implements an offline-first architecture that makes it ultra-fast and works seamlessly even without an internet connection.

## Key Features

### 1. **Instant Local Data Access**
- All data is cached in IndexedDB (with localStorage fallback)
- Pages load instantly from cache, then update from server in background
- No loading spinners for cached data

### 2. **Optimistic Updates**
- Changes appear instantly in the UI
- Updates are queued and synced to server in background
- Works perfectly offline with automatic retry when connection returns

### 3. **Progressive Web App (PWA)**
- Installable on iPhone home screen
- Runs in standalone mode like a native app
- Service worker provides offline support
- Fast startup time

### 4. **Background Sync**
- Automatic background synchronization every 30 seconds when online
- Failed operations retry up to 5 times
- Connection status indicator shows offline/syncing state

## How It Works

### Cache-First Strategy
```
User Action → Update Cache → Show in UI → Queue for Server → Background Sync
```

1. User adds a feed
2. Feed is saved to IndexedDB immediately
3. UI updates instantly
4. Operation queued for server sync
5. Background sync processes queue when online

### Data Flow
```
┌─────────────┐
│   UI Layer  │
└──────┬──────┘
       │
┌──────▼──────────────┐
│   Hooks Layer       │
│ - useFeeds()        │
│ - useBabies()       │
│ - useUser()         │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Cache Layer        │
│ - IndexedDB         │
│ - localStorage      │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Sync Manager       │
│ - Queue ops         │
│ - Retry logic       │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  API Layer          │
│ - POST /api/feeds   │
│ - GET /api/feeds    │
└─────────────────────┘
```

## Technical Implementation

### IndexedDB Cache (`src/lib/cache.ts`)
- Stores feeds, babies, user data, and sync queue
- Falls back to localStorage if IndexedDB unavailable
- Provides simple get/put/delete interface

### Sync Manager (`src/lib/sync.ts`)
- Monitors online/offline status
- Processes sync queue periodically
- Retries failed operations
- Notifies UI of sync status

### Optimistic Updates (`src/lib/hooks.ts`)
- `createFeed()` - Instant feed creation
- `updateFeed()` - Instant feed updates
- `deleteFeed()` - Instant feed deletion

### Service Worker (`public/sw.js`)
- Caches static assets
- Network-first for API calls with cache fallback
- Provides offline page support

## PWA Installation

### iOS (iPhone/iPad)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App runs in standalone mode

### Android
1. Open app in Chrome
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home screen"

## Performance Benefits

- **Initial Load**: Data from cache = instant display
- **Subsequent Loads**: Always instant from cache
- **Add Feed**: Instant UI update, background sync
- **Offline**: Full functionality, syncs when online
- **Network Errors**: Graceful fallback to cache

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet

Fallback to localStorage ensures compatibility even in restricted environments.

## Development

### Clear Cache
```javascript
// In browser console
import { cache } from './src/lib/cache';
await cache.clearAll();
```

### Monitor Sync Queue
```javascript
// In browser console
import { cache } from './src/lib/cache';
const queue = await cache.getSyncQueue();
console.log('Pending operations:', queue);
```

### Check Connection Status
The connection status indicator automatically shows:
- Yellow badge when offline
- Blue spinning badge when syncing
- Hidden when online and idle

## Future Enhancements

- [ ] Push notifications for family updates
- [ ] Background sync API for better reliability
- [ ] Periodic background sync (when supported)
- [ ] Conflict resolution for concurrent edits
- [ ] Export/import data functionality
