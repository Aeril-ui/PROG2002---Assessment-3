var searchForm = document.getElementById('search-form');
var dateInput = document.getElementById('date');
var locationInput = document.getElementById('location');
var categorySelect = document.getElementById('category');
var clearButton = document.getElementById('clear-filters');
var formMessage = document.getElementById('form-message');
var searchResults = document.getElementById('search-results');
var searchMessage = document.getElementById('search-message');

function formatDate(dateString) {
  var text = String(dateString);
  var year = text.substring(0, 4);
  var month = text.substring(5, 7);
  var day = text.substring(8, 10);
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var monthName = monthNames[parseInt(month, 10) - 1];
  return day + ' ' + monthName + ' ' + year;
}

function formatTime(timeString) {
  return timeString.substring(0, 5);
}

function formatTicketPrice(price) {
  if (parseFloat(price) === 0) {
    return 'Free';
  }
  return '$' + parseFloat(price).toFixed(2);
}

function showFormMessage(text) {
  formMessage.textContent = text;
  formMessage.hidden = false;
}

function clearFormMessage() {
  formMessage.textContent = '';
  formMessage.hidden = true;
}

function showSearchMessage(text) {
  searchMessage.textContent = text;
  searchMessage.hidden = false;
}

function clearSearchMessage() {
  searchMessage.textContent = '';
  searchMessage.hidden = true;
}

function resetFilters() {
  dateInput.value = '';
  locationInput.value = '';
  categorySelect.value = '';
  searchResults.innerHTML = '';
  clearFormMessage();
  clearSearchMessage();
}

function fillCategoryOptions(categories) {
  var i;
  var option;

  categorySelect.innerHTML = '';

  option = document.createElement('option');
  option.value = '';
  option.textContent = 'All categories';
  categorySelect.appendChild(option);

  for (i = 0; i < categories.length; i = i + 1) {
    option = document.createElement('option');
    option.value = categories[i].id;
    option.textContent = categories[i].name;
    categorySelect.appendChild(option);
  }
}

function buildEventCard(event) {
  var card = document.createElement('article');
  card.className = 'event-card';

  var image = document.createElement('img');
  image.className = 'event-card-image';
  image.src = event.image_url;
  image.alt = event.name;

  var body = document.createElement('div');
  body.className = 'event-card-body';

  var title = document.createElement('h3');
  var titleLink = document.createElement('a');
  titleLink.href = 'event.html?id=' + event.id;
  titleLink.textContent = event.name;
  title.appendChild(titleLink);

  var category = document.createElement('p');
  category.className = 'event-meta';
  category.textContent = event.category;

  var when = document.createElement('p');
  when.className = 'event-meta';
  when.textContent = formatDate(event.event_date) + ' at ' + formatTime(event.event_time);

  var where = document.createElement('p');
  where.className = 'event-meta';
  where.textContent = event.location + ' · ' + event.venue;

  var summary = document.createElement('p');
  summary.textContent = event.short_description;

  var price = document.createElement('p');
  price.className = 'event-price';
  price.textContent = 'Ticket: ' + formatTicketPrice(event.ticket_price);

  var detailsLink = document.createElement('a');
  detailsLink.className = 'event-link';
  detailsLink.href = 'event.html?id=' + event.id;
  detailsLink.textContent = 'View event details';

  body.appendChild(title);
  body.appendChild(category);
  body.appendChild(when);
  body.appendChild(where);
  body.appendChild(summary);
  body.appendChild(price);
  body.appendChild(detailsLink);

  card.appendChild(image);
  card.appendChild(body);

  return card;
}

function renderSearchResults(events) {
  var grid;
  var i;

  searchResults.innerHTML = '';

  if (events.length === 0) {
    showSearchMessage('No events match your search. Try different filters.');
    return;
  }

  clearSearchMessage();

  grid = document.createElement('div');
  grid.className = 'event-grid';

  for (i = 0; i < events.length; i = i + 1) {
    grid.appendChild(buildEventCard(events[i]));
  }

  searchResults.appendChild(grid);
}

function buildSearchUrl() {
  var url = '/api/events/search';
  var hasFilter = false;
  var date = dateInput.value;
  var location = locationInput.value;
  var category = categorySelect.value;

  if (date) {
    url = url + '?date=' + encodeURIComponent(date);
    hasFilter = true;
  }

  if (location) {
    if (hasFilter) {
      url = url + '&location=' + encodeURIComponent(location);
    } else {
      url = url + '?location=' + encodeURIComponent(location);
      hasFilter = true;
    }
  }

  if (category) {
    if (hasFilter) {
      url = url + '&category=' + encodeURIComponent(category);
    } else {
      url = url + '?category=' + encodeURIComponent(category);
    }
  }

  return url;
}

fetch('/api/categories')
  .then(function (response) {
    if (!response.ok) {
      throw new Error('failed');
    }
    return response.json();
  })
  .then(function (categories) {
    fillCategoryOptions(categories);
    clearFormMessage();
  })
  .catch(function () {
    showFormMessage('Unable to load categories. Please refresh the page.');
  });

clearButton.addEventListener('click', function () {
  resetFilters();
});

searchForm.addEventListener('submit', function (event) {
  event.preventDefault();
  clearSearchMessage();
  searchResults.innerHTML = '';

  fetch(buildSearchUrl())
    .then(function (response) {
      if (!response.ok) {
        throw new Error('failed');
      }
      return response.json();
    })
    .then(function (events) {
      renderSearchResults(events);
    })
    .catch(function () {
      showSearchMessage('Unable to search events. Please try again later.');
    });
});
