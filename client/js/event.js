var eventDetails = document.getElementById('event-details');
var eventMessage = document.getElementById('event-message');

function getEventIdFromUrl() {
  var search = window.location.search;
  var parts;
  var i;
  var pair;

  if (search.charAt(0) === '?') {
    search = search.substring(1);
  }

  if (search === '') {
    return null;
  }

  parts = search.split('&');
  for (i = 0; i < parts.length; i = i + 1) {
    pair = parts[i].split('=');
    if (pair[0] === 'id') {
      return pair[1];
    }
  }

  return null;
}

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
  return String(timeString).substring(0, 5);
}

function formatTicketPrice(price) {
  if (parseFloat(price) === 0) {
    return 'Free';
  }
  return '$' + parseFloat(price).toFixed(2);
}

function formatMoney(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

function showEventMessage(text) {
  eventMessage.textContent = text;
  eventMessage.hidden = false;
}

function renderEvent(event) {
  var title = document.createElement('h1');
  var image = document.createElement('img');
  var meta = document.createElement('p');
  var when = document.createElement('p');
  var where = document.createElement('p');
  var purposeTitle = document.createElement('h2');
  var purpose = document.createElement('p');
  var aboutTitle = document.createElement('h2');
  var description = document.createElement('p');
  var ticketTitle = document.createElement('h2');
  var ticket = document.createElement('p');
  var goalTitle = document.createElement('h2');
  var progress = document.createElement('p');
  var progressBar = document.createElement('div');
  var progressFill = document.createElement('div');
  var registerButton = document.createElement('button');

  var goal = parseFloat(event.goal_amount);
  var raised = parseFloat(event.progress_amount);
  var percent = 0;

  eventDetails.innerHTML = '';

  title.className = 'page-title';
  title.textContent = event.name;

  image.className = 'event-detail-image';
  image.src = event.image_url;
  image.alt = event.name;

  meta.className = 'event-meta';
  meta.textContent = event.category + ' · ' + event.organisation;

  when.className = 'event-meta';
  when.textContent = formatDate(event.event_date) + ' at ' + formatTime(event.event_time);

  where.className = 'event-meta';
  where.textContent = event.location + ' · ' + event.venue;

  purposeTitle.className = 'detail-heading';
  purposeTitle.textContent = 'Purpose';
  purpose.textContent = event.purpose;

  aboutTitle.className = 'detail-heading';
  aboutTitle.textContent = 'About this event';
  description.textContent = event.full_description;

  ticketTitle.className = 'detail-heading';
  ticketTitle.textContent = 'Ticket';
  ticket.textContent = formatTicketPrice(event.ticket_price);

  goalTitle.className = 'detail-heading';
  goalTitle.textContent = 'Fundraising progress';
  progress.textContent = formatMoney(event.progress_amount) + ' raised of ' + formatMoney(event.goal_amount) + ' goal';

  if (goal > 0) {
    percent = (raised / goal) * 100;
    if (percent > 100) {
      percent = 100;
    }
  }

  progressBar.className = 'progress-bar';
  progressFill.className = 'progress-fill';
  progressFill.style.width = percent + '%';
  progressBar.appendChild(progressFill);

  registerButton.type = 'button';
  registerButton.className = 'btn btn-primary register-btn';
  registerButton.textContent = 'Register';
  registerButton.addEventListener('click', function () {
    alert('This feature is currently under construction.');
  });

  eventDetails.appendChild(title);
  eventDetails.appendChild(image);
  eventDetails.appendChild(meta);
  eventDetails.appendChild(when);
  eventDetails.appendChild(where);
  eventDetails.appendChild(purposeTitle);
  eventDetails.appendChild(purpose);
  eventDetails.appendChild(aboutTitle);
  eventDetails.appendChild(description);
  eventDetails.appendChild(ticketTitle);
  eventDetails.appendChild(ticket);
  eventDetails.appendChild(goalTitle);
  eventDetails.appendChild(progress);
  eventDetails.appendChild(progressBar);
  eventDetails.appendChild(registerButton);
}

var eventId = getEventIdFromUrl();

if (!eventId) {
  showEventMessage('No event was selected. Please choose an event from the home or search page.');
} else {
  fetch('/api/events/' + eventId)
    .then(function (response) {
      if (response.status === 404) {
        throw new Error('not-found');
      }
      if (!response.ok) {
        throw new Error('failed');
      }
      return response.json();
    })
    .then(function (event) {
      renderEvent(event);
    })
    .catch(function (error) {
      eventDetails.innerHTML = '';
      if (error.message === 'not-found') {
        showEventMessage('That event could not be found.');
      } else {
        showEventMessage('Unable to load this event. Please try again later.');
      }
    });
}
