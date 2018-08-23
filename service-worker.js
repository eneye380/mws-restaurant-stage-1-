
/**
 * Source: https://www.sitepoint.com/getting-started-with-service-workers/
 * ,https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
 */
var CACHE_VERSION = 'app-v1';
var CACHE_FILES = [
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'service-worker.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'css/styles-xx-large.css',
    'css/styles-large.css',
    'css/styles-medium.css',
    'css/styles-small.css',
    'css/styles.css',
    'index.html',
    'restaurant.html',
];
/*'/',
    
    ];*/
var idb;// = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
console.log("IDB", idb);
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(function (cache) {
                //Save data on first page load
                fetch('http://localhost:1337/restaurants').then(function (response) {
                    //console.log(response);
                    restaurants = response.clone().json();

                    return restaurants;
                }).then(function (restaurants) {

                    restaurants.forEach(restaurant => {
                        //create database and save to it
                        openDb(event.request, restaurant);

                    });
                })
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('fetch', function (event) {

    console.log('[Service Worker] Fetch', event.request.url);
    var dataUrl = 'http://localhost:1337/restaurants';
    if (event.request.url.indexOf(dataUrl) > -1) {
        event.respondWith(
            fetch(event.request).then(function (response) {

                restaurants = response.clone().json();

                return restaurants;
            }).then(function (restaurants) {

                restaurants.forEach(restaurant => {
                    //create database and save to it
                    openDb(event.request, restaurant);

                });

                return response;
            })
        );
    } else {
        event.respondWith(
            caches.open(CACHE_VERSION).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    var fetchPromise = fetch(event.request).then(function (networkResponse) {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    })
                    return response || fetchPromise;
                })
            })
        );
        /**event.respondWith(
            caches.match(event.request).then(function (res) {
                if (res) {
                    return res;
                }
                requestBackend(event);
            })
        )*/

    }
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

/**
Source:: https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open,
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
*/
const DB_NAME = 'mws-restaurants';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
const DB_STORE_NAME = 'restaurants';

var db;

// Used to keep track of which view is displayed to avoid uselessly reloading it
var current_view_pub_key;

function openDb(url, restaurant) {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
        // Better use "this" than "req" to get the result to avoid problems with
        // garbage collection.
        // db = req.result;
        db = this.result;
        console.log("openDb DONE");
        addRestaurant(url, restaurant);
    };
    req.onerror = function (evt) {
        console.error("openDb:", evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
        console.log("openDb.onupgradeneeded");
        var store = evt.currentTarget.result.createObjectStore(
            DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };
}
/**
 * Add to DB
 */
/**
   * @param {string} store_name
   * @param {string} mode either "readonly" or "readwrite"
   */
function getObjectStore(store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
}

function clearObjectStore(store_name) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function (evt) {
        console.log('clearObjStr success')
    };
    req.onerror = function (evt) {
        console.error("clearObjectStore:", evt.target.errorCode);

    };
}


function addRestaurant(url, json) {
    //console.log("addRestaurant arguments:", arguments);
    var obj = { url: url, response: json };

    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req;
    try {
        console.log('j', json);
        req = store.add(json);
    } catch (e) {
        if (e.name == 'DataCloneError')
            console.log("addRestaurant error:");
        throw e;
    }
    req.onsuccess = function (evt) {
        console.log("Insertion in DB successful");
    };
    req.onerror = function () {
        console.error("addRestaurant error", this.error);
    };
}
/**
 * Read DB
 */
