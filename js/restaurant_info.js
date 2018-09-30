let restaurant;
let reviews;
var newMap;
var idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

//opens modal
document.getElementById("openModalBtn").addEventListener('click', () => {
  fillRestaurantId();
  document.getElementById('id01').style.display = 'block';
  console.log("opening modal!!!");
});
//closes modal
document.getElementById("closeModalBtn").addEventListener('click', () => {
  document.getElementById('id01').style.display = 'none';
  console.log("closing modal!!!");
});
/*document.getElementById("review-submit").addEventListener('click', () => {
  postReview();
  console.log("submitting!!!");
});*/
const DB_NAME1 = 'mws-reviews';
const DB_VERSION1 = 1; // Use a long long for this value (don't use a float)
const DB_STORE_NAME1 = 'review';
var db1;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  //create database before page renders
  var req1 = indexedDB.open(DB_NAME1, DB_VERSION1);
  req1.onsuccess = function (evt) {
    db1 = this.result;
    //db = evt.target.result;
    var transaction1 = db1.transaction(DB_STORE_NAME1, 'readwrite');
    var objectStore1 = transaction1.objectStore(DB_STORE_NAME1);
    console.log("Restaurant Info openDb1 DONE");
    initMap();
  };
  req1.onupgradeneeded = function (evt) {
    console.log("Restaurant Info openDb1.onupgradeneeded");
    var store1 = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME1, {
        keyPath: 'id',
        autoIncrement: true
      });
  };
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    console.log("ID::", id);
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */

fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  //appended .jpg
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '.jpg';
  // alt attribute
  image.alt = "Photo of " + restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
  // fetch reviews
  console.log(':: Reviewss');
  //fetchReviewsForRestaurant();
  fillReviewsHTML();
}

/**
 * Get reviews for current restaurant.
 */
fetchReviewsForRestaurant = (restaurant, callback) => {
  const id = restaurant.id;
  console.log("CB", id);
  const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
  fetch(url)
    .then(response => response.json())
    .then(reviews => callback(null, reviews))
    .catch(e => callback(e, null));

  // fill reviews
  console.log('1 Reviewss');
  //fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  console.log('fillReviewsHTML 2 Reviewss');
  fetchReviewsForRestaurant(self.restaurant, (error, reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
    console.log('fillReviewsHTML 3 Reviewss');
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.createdAt;
  console.log("createReviewHTML Date :: ", review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add new review to webpage
 */
addNewReviewToWebpage = (review) => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  console.log("addNewReviewToWebpage");
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

//Project 3

/**
 * Set restaurant_id field
 */
fillRestaurantId = (restaurant = self.restaurant) => {
  document.getElementById("restaurant_id").value = restaurant.id;
}

/**
 * Modal js
 * Source: https://www.w3schools.com/howto/howto_css_signup_form.asp
 */
// Get the modal
var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}



/**
 * 
 * To store user review
 * 
Source:: https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open,
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
*/

// Used to keep track of which view is displayed to avoid uselessly reloading it
var current_view_pub_key;

function createDb(a, b, c, d) {
  console.log("createDb ...");
  var req = indexedDB.open(DB_NAME1);
  req.onsuccess = function (evt) {
    db1 = this.result;
    console.log("createDb DONE");
    setReview(a, b, c, d);
  };
  req.onerror = function (evt) {
    console.error("createDb:", evt.target.errorCode);
  };
  /* req.onupgradeneeded = function (evt) {
     console.log("createDb.onupgradeneeded");
     var store = evt.currentTarget.result.createObjectStore(
       DB_STORE_NAME, {
         keyPath: 'id',
         autoIncrement: true
       });
   };*/
}

function setReview(a, b, c, d) {
  //console.log("addRestaurant arguments:", arguments);
  var obj = {
    restaurant_id: a,
    name: b,
    rating: c,
    comments: d
  };

  //var store = getObjectStore(DB_STORE_NAME1, 'readwrite');
  var tx = db1.transaction(DB_STORE_NAME1, 'readwrite');
  var store = tx.objectStore(DB_STORE_NAME1);
  var req;
  try {
    console.log('o', obj);
    req = store.add(obj);
  } catch (e) {
    if (e.name == 'DataCloneError')
      console.log("setReview error:");
    throw e;
  }
  req.onsuccess = function (evt) {
    console.log("setReview, Insertion in DB successful");
  };
  req.onerror = function () {
    console.error("setReview error", this.error);
  };
}


//post review
postReview = () => {
  var a = document.forms["Form"]["restaurant_id"].value;
  var b = document.forms["Form"]["name"].value;
  var c = document.forms["Form"]["rating"].value;
  var d = document.forms["Form"]["comments"].value;

  console.log("Restaurant_id :: ", a);
  console.log("Name :: ", b);
  console.log("Rating :: ", c);
  console.log("Comments :: ", d);


  if (a == null || a == "", b == null || b == "", c == null || c == "", d == null || d == "") {
    console.log('false');
    return false;
  } else {
    console.log('true');
    localStorage.restaurant_id = a;
    localStorage.name = b;
    localStorage.rating = c;
    localStorage.comments = d;
    navigator.serviceWorker.controller.postMessage(getReviewObject());
    createDb(a, b, c, d);
    return true;
  }
}

function getReviewObject() {
  var obj = {
    restaurant_id: localStorage.restaurant_id,
    name: localStorage.name,
    rating: localStorage.rating,
    comments: localStorage.comments
  };

  console.log("getReviewObject");
  var currentdate = new Date();
  var datetime = "" + currentdate.getFullYear() + "-" +
    (currentdate.getMonth() + 1) + "-" +
    currentdate.getDate() + "  " +
    currentdate.getHours() + ":" +
    currentdate.getMinutes() + ":" +
    currentdate.getSeconds();
  obj.createdAt = datetime;
  addNewReviewToWebpage(obj);
  return obj;
}

/**
 * Add to DB
 */
/**
 * @param {string} store_name
 * @param {string} mode either "readonly" or "readwrite"
 */
function getObjectStore(store_name, mode) {
  var tx = db1.transaction(store_name, mode);
  return tx.objectStore(store_name);
}

function clearObjectStore(store_name) {
  var store = getObjectStore(DB_STORE_NAME1, 'readwrite');
  var req = store.clear();
  req.onsuccess = function (evt) {
    console.log('clearObjStr success')
  };
  req.onerror = function (evt) {
    console.error("clearObjectStore:", evt.target.errorCode);

  };
}

window.addEventListener('message', event => {
  console.log(event)
}, false);

// start service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then(function () {
      console.log('Service Worker Registered');
    });
}

// Then later, request a one-off sync:
navigator.serviceWorker.ready.then(function (swRegistration) {
  document.getElementById("review-submit").addEventListener('click', () => {
    if (postReview()) {
      swRegistration.sync.register('postReview').then(function () {
        document.getElementById("review-hint").innerHTML = "";
        //send message to service worker
        //navigator.serviceWorker.controller.postMessage(getReviewObject());
        console.log('Sync Registered');
      });
    } else {
      document.getElementById("review-hint").innerText = "Please Fill All Required Field";
    }
  });

});

function send_message_to_sw(msg) {
  navigator.serviceWorker.controller.postMessage("Client 1 says '" + msg + "'");
}