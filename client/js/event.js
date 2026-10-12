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

function getWeatherDescription(code) {
  var c = parseInt(code, 10);
  if (c === 0) {
    return 'Clear sky';
  }
  if (c === 1 || c === 2 || c === 3) {
    return 'Mainly clear, partly cloudy, and overcast';
  }
  if (c === 45 || c === 48) {
    return 'Fog and depositing rime fog';
  }
  if (c === 51 || c === 53 || c === 55) {
    return 'Drizzle: Light, moderate, and dense';
  }
  if (c === 61 || c === 63 || c === 65) {
    return 'Rain: Light, moderate, and heavy';
  }
  if (c === 80 || c === 81 || c === 82) {
    return 'Rain showers: Light, moderate, and violent';
  }
  if (c === 95) {
    return 'Thunderstorm: Slight or moderate';
  }
  return 'Clear conditions';
}

function loadWeather(latitude, longitude, container) {
  if (!latitude || !longitude) {
    return;
  }
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' +
    latitude + '&longitude=' + longitude +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Australia%2FBrisbane';

  fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('weather-fetch-failed');
      }
      return response.json();
    })
    .then(function (data) {
      if (data && data.daily && data.daily.weather_code && data.daily.weather_code.length > 0) {
        var weatherCode = data.daily.weather_code[0];
        var maxTemp = data.daily.temperature_2m_max[0];
        var minTemp = data.daily.temperature_2m_min[0];
        var desc = getWeatherDescription(weatherCode);

        var weatherBox = document.createElement('div');
        weatherBox.className = 'weather-box';

        var weatherTitle = document.createElement('h3');
        weatherTitle.textContent = 'Expected Event Weather';

        var weatherText = document.createElement('p');
        weatherText.textContent = desc + ' · High: ' + maxTemp + '°C · Low: ' + minTemp + '°C';

        weatherBox.appendChild(weatherTitle);
        weatherBox.appendChild(weatherText);
        container.appendChild(weatherBox);
      }
    })
    .catch(function () {});
}

function renderEvent(event) {
  var title = document.createElement('h1');
  var image = document.createElement('img');
  var meta = document.createElement('p');
  var when = document.createElement('p');
  var where = document.createElement('p');
  var weatherContainer = document.createElement('div');
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
  var registerLink = document.createElement('a');
  var regSectionTitle = document.createElement('h2');
  var regListContainer = document.createElement('div');

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

  registerLink.className = 'btn btn-primary register-btn';
  registerLink.href = 'register.html?id=' + event.id;
  registerLink.textContent = 'Register for this event';

  regSectionTitle.className = 'detail-heading';
  regSectionTitle.textContent = 'Purchased Tickets & Registrations';

  if (!event.registrations || event.registrations.length === 0) {
    var emptyRegMsg = document.createElement('p');
    emptyRegMsg.className = 'status-message';
    emptyRegMsg.textContent = 'No registrations recorded for this event yet. Be the first to register!';
    regListContainer.appendChild(emptyRegMsg);
  } else {
    var table = document.createElement('table');
    table.className = 'data-table';

    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Attendee Name</th><th>Tickets</th><th>Registration Date</th></tr>';
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    var i;
    for (i = 0; i < event.registrations.length; i = i + 1) {
      var reg = event.registrations[i];
      var tr = document.createElement('tr');

      var tdName = document.createElement('td');
      tdName.textContent = reg.user_name;

      var tdTickets = document.createElement('td');
      tdTickets.textContent = reg.ticket_count;

      var tdDate = document.createElement('td');
      tdDate.textContent = formatDate(reg.registration_date);

      tr.appendChild(tdName);
      tr.appendChild(tdTickets);
      tr.appendChild(tdDate);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    regListContainer.appendChild(table);
  }

  eventDetails.appendChild(title);
  eventDetails.appendChild(image);
  eventDetails.appendChild(meta);
  eventDetails.appendChild(when);
  eventDetails.appendChild(where);
  eventDetails.appendChild(weatherContainer);
  eventDetails.appendChild(purposeTitle);
  eventDetails.appendChild(purpose);
  eventDetails.appendChild(aboutTitle);
  eventDetails.appendChild(description);
  eventDetails.appendChild(ticketTitle);
  eventDetails.appendChild(ticket);
  eventDetails.appendChild(goalTitle);
  eventDetails.appendChild(progress);
  eventDetails.appendChild(progressBar);
  eventDetails.appendChild(registerLink);
  eventDetails.appendChild(regSectionTitle);
  eventDetails.appendChild(regListContainer);

  loadWeather(event.latitude, event.longitude, weatherContainer);
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
