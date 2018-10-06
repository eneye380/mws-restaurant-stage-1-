let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];
idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

if (navigator.onLine) {
  console.log("navigator.onLine - ONLINE");
} else {
  console.log("navigator.onLine - OFFLINE");
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  /**
Source:: https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open,
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
*/
  const DB_NAME = 'mws-restaurants';
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)
  const DB_STORE_NAME = 'restaurants';
  var db;
  //create database before page renders
  var req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = function (evt) {
    db = this.result;
    //db = evt.target.result;
    var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    var objectStore = transaction.objectStore(DB_STORE_NAME);
    console.log("openDb DONE");
    initMap(); // added 
    fetchNeighborhoods();
    fetchCuisines();

  };
  req.onupgradeneeded = function (evt) {
    console.log("openDb.onupgradeneeded");
    var store = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true
      });
  };

});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      saveNeighborhoods(); //save to local storage
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      saveCuisines() //save to local storage
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });

}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZW5leWUiLCJhIjoiY2prbGZmNG12MHBuZTN3bWd0NzdjeWQ2dyJ9.AJhl0s5h1Ek0JhgmxFG58A',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
  saveRestaurants(); //save to local storage
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  //alert('1');
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  //appended .jpg
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '.jpg';
  // alt attribute
  image.alt = "Photo of " + restaurant.name;
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)
  console.log("restaurant.is_favorite", restaurant.is_favorite);
  //added
  const like = document.createElement('button');
  like.innerHTML = 'like';
  if (restaurant.is_favorite === "true") {
    like.setAttribute("class", "like");
    like.setAttribute("style", "background-color: #4CAF50");
  } else {
    like.setAttribute("class", "dislike");
    like.setAttribute("style", "background-color: maroon");
  }
  //like.setAttribute("id", "like");
  like.setAttribute("name", restaurant.id);
  like.setAttribute("type", "button");
  //like.setAttribute("class", "dislike");

  // like.setAttribute("style", "margin-left: 10px");
  //var like = document.getElementById("like");
  like.addEventListener("click", (event) => {
    event.preventDefault();
    //unfavorite
    var id = like.getAttribute("name");
    console.log('{like} name - ', id)
    if (like.classList.contains('like')) {
      console.log("I dislike");
      var url = `http://localhost:1337/restaurants/${id}/?is_favorite=false`;
      //using a put request
      putRequest(url, {
          user: 'Dan'
        })
        .then(data => {
          console.log(data);
          updateReviewDb(data.id, data.is_favorite);
        }) // Result from the `response.json()` call
        .catch(error => console.error(error));
      like.setAttribute("style", "background-color: maroon");
      like.innerHTML = 'like';
      like.classList.remove('like');
      like.classList.add('dislike');
    } else {
      //favorite
      console.log("I like");

      var url = `http://localhost:1337/restaurants/${id}/?is_favorite=true`;
      //using a put request
      putRequest(url, {
          user: 'Dan'
        })
        .then(data => {
          console.log(data);
          updateReviewDb(data.id, data.is_favorite);
        }) // Result from the `response.json()` call
        .catch(error => console.error(error));

      like.setAttribute("style", "background-color: #4CAF50");
      like.classList.remove('dislike');
      like.classList.add('like');
    }

  });
  li.append(like);

  return li
}

//Source: https://gist.github.com/justsml/529d0b1ddc5249095ff4b890aad5e801
function putRequest(url, data) {
  return fetch(url, {
      credentials: 'same-origin', // 'include', default: 'omit'
      method: 'PUT', // 'GET', 'PUT', 'DELETE', etc.
      body: JSON.stringify(data), // Coordinate the body type with 'Content-Type'
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
    })
    .then(response => response.json())
}

/**
 * Updates the is_favorite field in the indexedDb
 * @param {String} restaurant_id 
 * @param {String} is_fav 
 */
function updateReviewDb(restaurant_id, is_fav) {
  const DB_NAME = 'mws-restaurants';
  const DB_STORE_NAME = 'restaurants';
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)

  /**
   * Check if data exist in database
   */
  var request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = function (event) {
    alert("Why didn't you allow my web app to use IndexedDB?!");
  };
  request.onsuccess = function (event) {
    var db = event.target.result;

    var transaction = db.transaction(DB_STORE_NAME, 'readwrite');
    var objectStore = transaction.objectStore(DB_STORE_NAME);

    objectStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.id === restaurant_id) {
          const updateData = cursor.value;

          updateData.is_favorite = is_fav;
          const request = cursor.update(updateData);
          request.onsuccess = function () {
            console.log(`Restaurant ${restaurant_id} Updated Successfull!!!`);
          };
        }
        cursor.continue();
      } else {
        console.log('Entries displayed.');
      }
    };
  }

}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

saveRestaurants = () => {
  // var restaurants = JSON.stringify(restaurants);
  //localStorage.restaurants = self.restaurants;
};
saveCuisines = () => {
  //var cuisines = JSON.stringify(cuisines);
  //localStorage.cuisines = self.cuisines;
};
saveNeighborhoods = () => {
  //  var neighbourhoods = JSON.stringify(neighborhoods);
  //localStorage.neighbourhoods = self.neighborhoods;
};

/**
 * Added: Install MWS
 * Source:: https://developers.google.com/web/fundamentals/app-install-banners/
 */
let deferredPrompt;
var btnAdd = document.getElementById('prompt');
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can add to home screen
  btnAdd.style.display = 'block';
});

btnAdd.addEventListener('click', (e) => {
  // hide our user interface that shows our A2HS button
  btnAdd.style.display = 'none';
  // Show the prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice
    .then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
});



// start service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then(function () {
      console.log('Service Worker Registered');
    });
}
// Register your service worker:
//navigator.serviceWorker.register('/sw.js');

// Then later, request a one-off sync:
navigator.serviceWorker.ready.then(function (swRegistration) {
  return swRegistration.sync.register('myFirstSync');
});