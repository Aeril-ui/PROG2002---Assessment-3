var eventsTableBody = document.getElementById('events-table-body');
var adminMessage = document.getElementById('admin-message');
var formPanel = document.getElementById('form-panel');
var formHeading = document.getElementById('form-heading');
var eventForm = document.getElementById('event-form');
var openCreateBtn = document.getElementById('open-create-btn');
var cancelFormBtn = document.getElementById('cancel-form-btn');
var eventCategorySelect = document.getElementById('event-category');
var regSection = document.getElementById('event-registrations-section');
var regContainer = document.getElementById('registrations-table-container');

var inputId = document.getElementById('event-id');
var inputName = document.getElementById('event-name');
var inputCategory = document.getElementById('event-category');
var inputDate = document.getElementById('event-date');
var inputTime = document.getElementById('event-time');
var inputLocation = document.getElementById('event-location');
var inputVenue = document.getElementById('event-venue');
var inputPrice = document.getElementById('event-price');
var inputGoal = document.getElementById('event-goal');
var inputLat = document.getElementById('event-lat');
var inputLng = document.getElementById('event-lng');
var inputImage = document.getElementById('event-image');
var inputPurpose = document.getElementById('event-purpose');
var inputShortDesc = document.getElementById('event-short-desc');
var inputFullDesc = document.getElementById('event-full-desc');
var inputSuspended = document.getElementById('event-suspended');

function showAdminMessage(text, isError) {
  adminMessage.textContent = text;
  adminMessage.hidden = false;
  if (isError) {
    adminMessage.className = 'status-message status-error';
  } else {
    adminMessage.className = 'status-message status-success';
  }
}

function clearAdminMessage() {
  adminMessage.textContent = '';
  adminMessage.hidden = true;
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

function formatRawDate(dateString) {
  var text = String(dateString);
  return text.substring(0, 10);
}

function formatRawTime(timeString) {
  var text = String(timeString);
  if (text.length >= 5) {
    return text.substring(0, 5);
  }
  return text;
}

function formatMoney(val) {
  var num = parseFloat(val);
  if (isNaN(num)) {
    return '$0.00';
  }
  return '$' + num.toFixed(2);
}

function loadCategories() {
  fetch('/api/categories')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('failed');
      }
      return response.json();
    })
    .then(function (categories) {
      eventCategorySelect.innerHTML = '<option value="">Select category</option>';
      var i;
      for (i = 0; i < categories.length; i = i + 1) {
        var opt = document.createElement('option');
        opt.value = categories[i].id;
        opt.textContent = categories[i].name;
        eventCategorySelect.appendChild(opt);
      }
    })
    .catch(function () {});
}

function renderEventsTable(events) {
  eventsTableBody.innerHTML = '';
  if (!events || events.length === 0) {
    eventsTableBody.innerHTML = '<tr><td colspan="10">No events found in the database.</td></tr>';
    return;
  }

  var today = new Date().toISOString().substring(0, 10);
  var i;
  for (i = 0; i < events.length; i = i + 1) {
    var item = events[i];
    var tr = document.createElement('tr');

    var eventDateStr = formatRawDate(item.event_date);
    var statusBadge;
    if (item.is_suspended === 1) {
      statusBadge = '<span class="badge badge-suspended">Suspended</span>';
    } else if (eventDateStr < today) {
      statusBadge = '<span class="badge badge-past">Past</span>';
    } else {
      statusBadge = '<span class="badge badge-active">Active</span>';
    }

    var tdId = document.createElement('td');
    tdId.textContent = item.id;

    var tdName = document.createElement('td');
    tdName.innerHTML = '<strong>' + item.name + '</strong>';

    var tdCat = document.createElement('td');
    tdCat.textContent = item.category;

    var tdWhen = document.createElement('td');
    tdWhen.textContent = formatDate(item.event_date) + ' ' + formatRawTime(item.event_time);

    var tdWhere = document.createElement('td');
    tdWhere.textContent = item.location + ' · ' + item.venue;

    var tdPrice = document.createElement('td');
    tdPrice.textContent = parseFloat(item.ticket_price) === 0 ? 'Free' : formatMoney(item.ticket_price);

    var tdGoal = document.createElement('td');
    tdGoal.textContent = formatMoney(item.progress_amount) + ' / ' + formatMoney(item.goal_amount);

    var tdStatus = document.createElement('td');
    tdStatus.innerHTML = statusBadge;

    var tdRegs = document.createElement('td');
    tdRegs.textContent = item.registration_count;

    var tdActions = document.createElement('td');
    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-sm btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('data-id', item.id);
    editBtn.addEventListener('click', function () {
      var id = this.getAttribute('data-id');
      loadEventForEdit(id);
    });

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('data-id', item.id);
    delBtn.setAttribute('data-name', item.name);
    delBtn.addEventListener('click', function () {
      var id = this.getAttribute('data-id');
      var name = this.getAttribute('data-name');
      handleDeleteEvent(id, name);
    });

    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdCat);
    tr.appendChild(tdWhen);
    tr.appendChild(tdWhere);
    tr.appendChild(tdPrice);
    tr.appendChild(tdGoal);
    tr.appendChild(tdStatus);
    tr.appendChild(tdRegs);
    tr.appendChild(tdActions);

    eventsTableBody.appendChild(tr);
  }
}

function loadAdminEvents() {
  fetch('/api/admin/events')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('failed');
      }
      return response.json();
    })
    .then(function (events) {
      renderEventsTable(events);
    })
    .catch(function () {
      eventsTableBody.innerHTML = '<tr><td colspan="10">Unable to load events from the server.</td></tr>';
      showAdminMessage('Failed to load events list.', true);
    });
}

function resetForm() {
  inputId.value = '';
  inputName.value = '';
  inputCategory.value = '';
  inputDate.value = '';
  inputTime.value = '';
  inputLocation.value = '';
  inputVenue.value = '';
  inputPrice.value = '0.00';
  inputGoal.value = '1000.00';
  inputLat.value = '';
  inputLng.value = '';
  inputImage.value = '/images/charity-default.png';
  inputPurpose.value = '';
  inputShortDesc.value = '';
  inputFullDesc.value = '';
  inputSuspended.checked = false;
  regSection.hidden = true;
  regContainer.innerHTML = '';
}

openCreateBtn.addEventListener('click', function () {
  resetForm();
  formHeading.textContent = 'Create New Charity Event';
  formPanel.hidden = false;
  formPanel.scrollIntoView({ behavior: 'smooth' });
});

cancelFormBtn.addEventListener('click', function () {
  formPanel.hidden = true;
  resetForm();
});

function loadEventForEdit(id) {
  clearAdminMessage();
  fetch('/api/events/' + id)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('not-found');
      }
      return response.json();
    })
    .then(function (event) {
      resetForm();
      formHeading.textContent = 'Edit Charity Event (ID: ' + event.id + ')';
      inputId.value = event.id;
      inputName.value = event.name;
      inputCategory.value = event.category_id;
      inputDate.value = formatRawDate(event.event_date);
      inputTime.value = formatRawTime(event.event_time);
      inputLocation.value = event.location;
      inputVenue.value = event.venue;
      inputPrice.value = parseFloat(event.ticket_price).toFixed(2);
      inputGoal.value = parseFloat(event.goal_amount).toFixed(2);
      inputLat.value = event.latitude ? event.latitude : '';
      inputLng.value = event.longitude ? event.longitude : '';
      inputImage.value = event.image_url;
      inputPurpose.value = event.purpose;
      inputShortDesc.value = event.short_description;
      inputFullDesc.value = event.full_description;
      inputSuspended.checked = event.is_suspended === 1;

      regSection.hidden = false;
      if (!event.registrations || event.registrations.length === 0) {
        regContainer.innerHTML = '<p>No registrations recorded yet for this event.</p>';
      } else {
        var table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML =
          '<thead><tr><th>Attendee Name</th><th>Email</th><th>Phone</th><th>Tickets</th><th>Date</th></tr></thead><tbody></tbody>';
        var tbody = table.querySelector('tbody');
        var i;
        for (i = 0; i < event.registrations.length; i = i + 1) {
          var r = event.registrations[i];
          var row = document.createElement('tr');
          row.innerHTML =
            '<td>' + r.user_name + '</td>' +
            '<td>' + r.email + '</td>' +
            '<td>' + r.phone + '</td>' +
            '<td>' + r.ticket_count + '</td>' +
            '<td>' + formatDate(r.registration_date) + '</td>';
          tbody.appendChild(row);
        }
        regContainer.innerHTML = '';
        regContainer.appendChild(table);
      }

      formPanel.hidden = false;
      formPanel.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(function () {
      showAdminMessage('Failed to load event details for editing.', true);
    });
}

function handleDeleteEvent(id, name) {
  clearAdminMessage();
  var confirmed = confirm('Are you sure you want to delete event: "' + name + '" (ID: ' + id + ')?');
  if (!confirmed) {
    return;
  }

  fetch('/api/events/' + id, {
    method: 'DELETE'
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return {
          ok: response.ok,
          status: response.status,
          body: data
        };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        var msg = result.body && result.body.message ? result.body.message : 'Failed to delete event.';
        alert('Action Blocked: ' + msg);
        showAdminMessage(msg, true);
        return;
      }

      showAdminMessage('Event deleted successfully.', false);
      if (inputId.value === String(id)) {
        formPanel.hidden = true;
        resetForm();
      }
      loadAdminEvents();
    })
    .catch(function () {
      alert('Unable to process event deletion. Please try again.');
      showAdminMessage('Error deleting event.', true);
    });
}

eventForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearAdminMessage();

  var nameVal = inputName.value.trim();
  var catVal = parseInt(inputCategory.value, 10);
  var dateVal = inputDate.value;
  var timeVal = inputTime.value;
  var locVal = inputLocation.value.trim();
  var venueVal = inputVenue.value.trim();
  var priceVal = parseFloat(inputPrice.value);
  var goalVal = parseFloat(inputGoal.value);
  var purposeVal = inputPurpose.value.trim();
  var shortVal = inputShortDesc.value.trim();
  var fullVal = inputFullDesc.value.trim();
  var imageVal = inputImage.value.trim() || '/images/charity-default.png';
  var latVal = inputLat.value ? parseFloat(inputLat.value) : null;
  var lngVal = inputLng.value ? parseFloat(inputLng.value) : null;
  var isSuspendedVal = inputSuspended.checked ? 1 : 0;
  var currentId = inputId.value;

  if (
    !nameVal || isNaN(catVal) || !dateVal || !timeVal ||
    !locVal || !venueVal || isNaN(priceVal) || isNaN(goalVal) ||
    !purposeVal || !shortVal || !fullVal
  ) {
    alert('Please fill in all required fields before saving.');
    return;
  }

  if (priceVal < 0 || goalVal < 0) {
    alert('Ticket price and goal amount must be 0 or greater.');
    return;
  }

  var payload = {
    name: nameVal,
    category_id: catVal,
    organisation_id: 1,
    purpose: purposeVal,
    short_description: shortVal,
    full_description: fullVal,
    event_date: dateVal,
    event_time: timeVal,
    location: locVal,
    venue: venueVal,
    ticket_price: priceVal,
    goal_amount: goalVal,
    image_url: imageVal,
    latitude: latVal,
    longitude: lngVal,
    is_suspended: isSuspendedVal
  };

  var targetUrl = currentId ? '/api/events/' + currentId : '/api/events';
  var targetMethod = currentId ? 'PUT' : 'POST';

  fetch(targetUrl, {
    method: targetMethod,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return {
          ok: response.ok,
          body: data
        };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        var err = result.body && result.body.message ? result.body.message : 'Failed to save event.';
        alert(err);
        showAdminMessage(err, true);
        return;
      }

      showAdminMessage(currentId ? 'Event updated successfully.' : 'New event created successfully.', false);
      formPanel.hidden = true;
      resetForm();
      loadAdminEvents();
    })
    .catch(function () {
      alert('Unable to save event. Please check server connection.');
      showAdminMessage('Failed to communicate with server.', true);
    });
});

loadCategories();
loadAdminEvents();
