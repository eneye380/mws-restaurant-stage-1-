/**
 * Source: https://www.sitepoint.com/getting-started-with-service-workers/
 * ,https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
 */
var CACHE_VERSION = 'app-v1';
var CACHE_FILES = [
    '/mws-restaurant-stage-1-/',
        '/mws-restaurant-stage-1-/https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        '/mws-restaurant-stage-1-/js/dbhelper.js',
        '/mws-restaurant-stage-1-/js/main.js',
        '/mws-restaurant-stage-1-/js/restaurant_info.js',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    '/mws-restaurant-stage-1-/css/styles-xx-large.css',
    '/mws-restaurant-stage-1-/css/styles-large.css',
    '/mws-restaurant-stage-1-/css/styles-medium.css',
    '/mws-restaurant-stage-1-/css/styles-small.css',
    '/mws-restaurant-stage-1-/css/styles.css',
        '/mws-restaurant-stage-1-/data/restaurants.json',
    '/mws-restaurant-stage-1-/index.html',
    '/mws-restaurant-stage-1-/restaurant.html'
];
/*'/',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'css/styles-xx-large.css',
    'css/styles-large.css',
    'css/styles-medium.css',
    'css/styles-small.css',
    'css/styles.css',
    'data/restaurants.json',
    'index.html',
    'restaurant.html',
    ];*/
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('fetch', function (event) {
    console.log("URL: " + event.request.url);
    /*if (event.request.url.indexOf('https://api.tiles.mapbox.com/v4/') == 0) {
        event.respondWith(
            // Handle Maps API requests in a generic fashion,
            // by returning a Promise that resolves to a Response.
            function () {
                console.log("newURL: " + event.request.url);
                return fetch(event.request.url);
            }
        );
    } else {*/
        event.respondWith(
            caches.match(event.request).then(function (res) {
                if (res) {
                    return res;
                }
                requestBackend(event);
            })
        )
/*}*/
});

function requestBackend(event) {
    var url = event.request.clone();
    return fetch(url).then(function (res) {
        //if not a valid response send the error
        if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
        }

        var response = res.clone();
        //Add to cache
        caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, response);
        });

        return res;
    })
}

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key, i) {
                if (key !== CACHE_VERSION) {
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});
