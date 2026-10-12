var summaryTitle = document.getElementById('summary-title');
var summaryMeta = document.getElementById('summary-meta');
var summaryLocation = document.getElementById('summary-location');
var summaryPrice = document.getElementById('summary-price');
var registrationForm = document.getElementById('registration-form');
var registrationMessage = document.getElementById('registration-message');
var regName = document.getElementById('reg-name');
var regEmail = document.getElementById('reg-email');
var regPhone = document.getElementById('reg-phone');
var regTickets = document.getElementById('reg-tickets');
var totalCostAmount = document.getElementById('total-cost-amount');
var cancelLink = document.getElementById('cancel-link');
var currentTicketPrice = 0;

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

function showMessage(text, isError) {
  registrationMessage.textContent = text;
  registrationMessage.hidden = false;
  if (isError) {
    registrationMessage.className = 'status-message status-error';
  } else {
    registrationMessage.className = 'status-message status-success';
  }
}

function updateTotalCost() {
  var count = parseInt(regTickets.value, 10);
  if (isNaN(count) || count < 1) {
    count = 1;
  }
  var total = currentTicketPrice * count;
  if (total === 0) {
    totalCostAmount.textContent = 'Free';
  } else {
    totalCostAmount.textContent = '$' + total.toFixed(2);
  }
}

regTickets.addEventListener('input', updateTotalCost);

var eventId = getEventIdFromUrl();

if (!eventId) {
  showMessage('No event was selected. Please choose an event to register.', true);
  document.getElementById('event-summary-panel').hidden = true;
  document.getElementById('registration-form-panel').hidden = true;
} else {
  fetch('/api/events/' + eventId)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('not-found');
      }
      return response.json();
    })
    .then(function (event) {
      if (event.is_suspended === 1) {
        showMessage('This event has been suspended. Registrations are currently disabled.', true);
        document.getElementById('registration-form-panel').hidden = true;
        return;
      }

      currentTicketPrice = parseFloat(event.ticket_price);
      summaryTitle.textContent = event.name;
      summaryMeta.textContent = event.category + ' · ' + formatDate(event.event_date) + ' at ' + formatTime(event.event_time);
      summaryLocation.textContent = event.venue + ', ' + event.location;
      summaryPrice.textContent = 'Ticket Price: ' + (currentTicketPrice === 0 ? 'Free' : '$' + currentTicketPrice.toFixed(2));
      cancelLink.href = 'event.html?id=' + event.id;
      updateTotalCost();
    })
    .catch(function () {
      showMessage('Could not load event information. Please try again later.', true);
      document.getElementById('registration-form-panel').hidden = true;
    });
}

registrationForm.addEventListener('submit', function (e) {
  e.preventDefault();

  var nameVal = regName.value.trim();
  var emailVal = regEmail.value.trim();
  var phoneVal = regPhone.value.trim();
  var ticketsVal = parseInt(regTickets.value, 10);

  if (!nameVal) {
    alert('Please enter your full name.');
    regName.focus();
    return;
  }

  if (!emailVal || emailVal.indexOf('@') === -1 || emailVal.indexOf('.') === -1) {
    alert('Please enter a valid email address.');
    regEmail.focus();
    return;
  }

  if (!phoneVal) {
    alert('Please enter your contact phone number.');
    regPhone.focus();
    return;
  }

  if (isNaN(ticketsVal) || ticketsVal < 1) {
    alert('Please enter a valid number of tickets (at least 1).');
    regTickets.focus();
    return;
  }

  var payload = {
    event_id: eventId,
    user_name: nameVal,
    email: emailVal,
    phone: phoneVal,
    ticket_count: ticketsVal
  };

  fetch('/api/registrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return {
          status: response.status,
          ok: response.ok,
          body: data
        };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        var errorMsg = result.body && result.body.message ? result.body.message : 'Registration failed. Please try again.';
        alert(errorMsg);
        showMessage(errorMsg, true);
        return;
      }

      var formPanel = document.getElementById('registration-form-panel');
      formPanel.innerHTML =
        '<div class="confirmation-card">' +
        '<h2>Registration Confirmed!</h2>' +
        '<p>Thank you, <strong>' + nameVal + '</strong>. Your registration for <strong>' + summaryTitle.textContent + '</strong> has been recorded.</p>' +
        '<p>Tickets reserved: <strong>' + ticketsVal + '</strong></p>' +
        '<p>A confirmation email has been sent to <strong>' + emailVal + '</strong>.</p>' +
        '<div class="form-actions" style="margin-top: 1.5rem;">' +
        '<a href="event.html?id=' + eventId + '" class="btn btn-primary">Return to Event Page</a>' +
        '<a href="index.html" class="btn btn-secondary">Home</a>' +
        '</div>' +
        '</div>';
      showMessage('Registration submitted successfully!', false);
    })
    .catch(function () {
      alert('Unable to submit registration. Please check your connection and try again.');
      showMessage('Unable to submit registration. Please try again.', true);
    });
});
