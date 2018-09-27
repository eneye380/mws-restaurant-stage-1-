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

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
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
  fetchReviewsForRestaurant();
}

/**
 * Get reviews for current restaurant.
 */
fetchReviewsForRestaurant = (restaurant = self.restaurant) => {
  const id = restaurant.id;
  const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
  fetch(url)
    .then(response => response.json())
    .then(reviews => self.reviews = reviews)
    .catch(e => console.error(e));

  // fill reviews
  fillReviewsHTML();
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
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

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
  date.innerHTML = review.date;
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
    return true;
  }
}

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