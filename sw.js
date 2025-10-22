// ClinicalCanvas Service Worker for Performance Optimization
// Version 1.0.0

const CACHE_NAME = 'clinicalcanvas-v1.0.0';
const STATIC_CACHE = 'clinicalcanvas-static-v1.0.0';
const DYNAMIC_CACHE = 'clinicalcanvas-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/app.html',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/api/health.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kalam:wght@300;400;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external API calls (except fonts)
    if (url.origin !== location.origin && !url.hostname.includes('fonts.googleapis.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', request.url);
                    return cachedResponse;
                }
                
                console.log('Service Worker: Fetching from network', request.url);
                return fetch(request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache dynamic content
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed', error);
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from ClinicalCanvas',
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/icon.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon.svg'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('ClinicalCanvas EHR', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/app.html')
        );
    }
});

// Background sync function
async function doBackgroundSync() {
    try {
        // Sync any pending data when connection is restored
        console.log('Service Worker: Performing background sync');
        
        // This would sync any offline data
        // For now, just log the sync
        console.log('Service Worker: Background sync completed');
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Performance monitoring
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
        console.log('Service Worker: Performance metric received', event.data.metric);
        
        // Store performance metrics for analysis
        const metrics = {
            timestamp: Date.now(),
            metric: event.data.metric,
            value: event.data.value
        };
        
        // Store in IndexedDB for later analysis
        storePerformanceMetric(metrics);
    }
});

// Store performance metrics in IndexedDB
async function storePerformanceMetric(metric) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['performance'], 'readwrite');
        const store = transaction.objectStore('performance');
        await store.add(metric);
    } catch (error) {
        console.error('Service Worker: Failed to store performance metric', error);
    }
}

// Open IndexedDB for performance metrics
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClinicalCanvasMetrics', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('performance')) {
                db.createObjectStore('performance', { keyPath: 'timestamp' });
            }
        };
    });
}