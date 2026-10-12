var eventsList = document.getElementById('events-list');
var eventsMessage = document.getElementById('events-message');

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

function showEventsMessage(text) {
  eventsMessage.textContent = text;
  eventsMessage.hidden = false;
}

function clearEventsMessage() {
  eventsMessage.textContent = '';
  eventsMessage.hidden = true;
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

function renderEvents(events) {
  var grid;
  var i;

  eventsList.innerHTML = '';

  if (events.length === 0) {
    showEventsMessage('There are no upcoming events at the moment.');
    return;
  }

  clearEventsMessage();

  grid = document.createElement('div');
  grid.className = 'event-grid';

  for (i = 0; i < events.length; i = i + 1) {
    grid.appendChild(buildEventCard(events[i]));
  }

  eventsList.appendChild(grid);
}

fetch('/api/events')
  .then(function (response) {
    if (!response.ok) {
      throw new Error('failed');
    }
    return response.json();
  })
  .then(function (events) {
    renderEvents(events);
  })
  .catch(function () {
    eventsList.innerHTML = '';
    showEventsMessage('Unable to load events. Please try again later.');
  });
