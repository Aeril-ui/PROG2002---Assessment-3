var express = require('express');
var path = require('path');
var db = require('./event_db');

var app = express();
var PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', function (req, res) {
  res.json({
    status: 'ok',
    message: 'Charity events API is running'
  });
});

app.get('/api/categories', function (req, res) {
  db.query('SELECT id, name FROM categories ORDER BY name ASC')
    .then(function (result) {
      res.json(result[0]);
    })
    .catch(function (error) {
      res.status(500).json({ message: 'Unable to load categories' });
    });
});

app.get('/api/events/search', function (req, res) {
  var date = req.query.date;
  var location = req.query.location;
  var category = req.query.category;

  var sql =
    'SELECT e.id, e.name, c.name AS category, e.event_date, e.event_time, ' +
    'e.location, e.venue, e.ticket_price, e.image_url, e.short_description, ' +
    'e.latitude, e.longitude ' +
    'FROM events e ' +
    'INNER JOIN categories c ON e.category_id = c.id ' +
    'WHERE e.is_suspended = 0 AND e.event_date >= CURDATE()';
  var params = [];

  if (date) {
    sql = sql + ' AND e.event_date = ?';
    params.push(date);
  }

  if (location) {
    sql = sql + ' AND e.location LIKE ?';
    params.push('%' + location + '%');
  }

  if (category) {
    sql = sql + ' AND e.category_id = ?';
    params.push(category);
  }

  sql = sql + ' ORDER BY e.event_date ASC, e.event_time ASC';

  db.query(sql, params)
    .then(function (result) {
      res.json(result[0]);
    })
    .catch(function (error) {
      res.status(500).json({ message: 'Unable to search events' });
    });
});

app.get('/api/events/:id', function (req, res) {
  var eventId = req.params.id;

  var eventSql =
    'SELECT e.id, e.name, e.category_id, c.name AS category, e.event_date, e.event_time, ' +
    'e.location, e.venue, e.ticket_price, e.image_url, e.short_description, ' +
    'e.purpose, e.full_description, e.goal_amount, e.progress_amount, ' +
    'e.latitude, e.longitude, e.is_suspended, o.name AS organisation ' +
    'FROM events e ' +
    'INNER JOIN categories c ON e.category_id = c.id ' +
    'INNER JOIN organisations o ON e.organisation_id = o.id ' +
    'WHERE e.id = ?';

  var regSql =
    'SELECT id, user_name, email, phone, ticket_count, registration_date ' +
    'FROM registrations ' +
    'WHERE event_id = ? ' +
    'ORDER BY registration_date DESC';

  db.query(eventSql, [eventId])
    .then(function (eventResult) {
      var rows = eventResult[0];
      if (rows.length === 0) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }
      var eventData = rows[0];

      db.query(regSql, [eventId])
        .then(function (regResult) {
          eventData.registrations = regResult[0];
          res.json(eventData);
        })
        .catch(function () {
          eventData.registrations = [];
          res.json(eventData);
        });
    })
    .catch(function () {
      res.status(500).json({ message: 'Unable to load event' });
    });
});

app.get('/api/events', function (req, res) {
  var sql =
    'SELECT e.id, e.name, c.name AS category, e.event_date, e.event_time, ' +
    'e.location, e.venue, e.ticket_price, e.image_url, e.short_description, ' +
    'e.latitude, e.longitude ' +
    'FROM events e ' +
    'INNER JOIN categories c ON e.category_id = c.id ' +
    'WHERE e.is_suspended = 0 AND e.event_date >= CURDATE() ' +
    'ORDER BY e.event_date ASC, e.event_time ASC';

  db.query(sql)
    .then(function (result) {
      res.json(result[0]);
    })
    .catch(function () {
      res.status(500).json({ message: 'Unable to load events' });
    });
});

app.post('/api/registrations', function (req, res) {
  var eventId = req.body.event_id;
  var userName = req.body.user_name ? String(req.body.user_name).trim() : '';
  var email = req.body.email ? String(req.body.email).trim() : '';
  var phone = req.body.phone ? String(req.body.phone).trim() : '';
  var ticketCount = parseInt(req.body.ticket_count, 10);

  if (!eventId || !userName || !email || !phone || isNaN(ticketCount) || ticketCount <= 0) {
    res.status(400).json({ message: 'All fields are required and ticket count must be at least 1' });
    return;
  }

  var checkEventSql = 'SELECT id, ticket_price, is_suspended FROM events WHERE id = ?';
  db.query(checkEventSql, [eventId])
    .then(function (eventResult) {
      var events = eventResult[0];
      if (events.length === 0) {
        res.status(404).json({ message: 'Selected event does not exist' });
        return;
      }

      var targetEvent = events[0];
      if (targetEvent.is_suspended === 1) {
        res.status(400).json({ message: 'Cannot register for a suspended event' });
        return;
      }

      var checkRegSql = 'SELECT id FROM registrations WHERE event_id = ? AND email = ?';
      db.query(checkRegSql, [eventId, email])
        .then(function (existingResult) {
          if (existingResult[0].length > 0) {
            res.status(400).json({ message: 'You have already registered for this event with this email' });
            return;
          }

          var insertSql =
            'INSERT INTO registrations (event_id, user_name, email, phone, ticket_count, registration_date) ' +
            'VALUES (?, ?, ?, ?, ?, NOW())';

          db.query(insertSql, [eventId, userName, email, phone, ticketCount])
            .then(function (insertResult) {
              var addedCost = parseFloat(targetEvent.ticket_price) * ticketCount;
              var updateProgressSql =
                'UPDATE events SET progress_amount = progress_amount + ? WHERE id = ?';
              db.query(updateProgressSql, [addedCost, eventId])
                .then(function () {
                  res.status(201).json({
                    message: 'Registration successful',
                    registrationId: insertResult[0].insertId
                  });
                })
                .catch(function () {
                  res.status(201).json({
                    message: 'Registration successful',
                    registrationId: insertResult[0].insertId
                  });
                });
            })
            .catch(function () {
              res.status(500).json({ message: 'Failed to record registration' });
            });
        })
        .catch(function () {
          res.status(500).json({ message: 'Error checking previous registration' });
        });
    })
    .catch(function () {
      res.status(500).json({ message: 'Database error verifying event' });
    });
});

app.get('/api/admin/events', function (req, res) {
  var sql =
    'SELECT e.id, e.name, e.category_id, c.name AS category, e.event_date, e.event_time, ' +
    'e.location, e.venue, e.ticket_price, e.goal_amount, e.progress_amount, ' +
    'e.image_url, e.latitude, e.longitude, e.is_suspended, e.short_description, ' +
    'e.purpose, e.full_description, ' +
    'COUNT(r.id) AS registration_count ' +
    'FROM events e ' +
    'INNER JOIN categories c ON e.category_id = c.id ' +
    'LEFT JOIN registrations r ON e.id = r.event_id ' +
    'GROUP BY e.id ' +
    'ORDER BY e.event_date DESC, e.event_time DESC';

  db.query(sql)
    .then(function (result) {
      res.json(result[0]);
    })
    .catch(function () {
      res.status(500).json({ message: 'Unable to load administrative events list' });
    });
});

app.post('/api/events', function (req, res) {
  var name = req.body.name ? String(req.body.name).trim() : '';
  var categoryId = parseInt(req.body.category_id, 10);
  var organisationId = req.body.organisation_id ? parseInt(req.body.organisation_id, 10) : 1;
  var purpose = req.body.purpose ? String(req.body.purpose).trim() : '';
  var shortDescription = req.body.short_description ? String(req.body.short_description).trim() : '';
  var fullDescription = req.body.full_description ? String(req.body.full_description).trim() : '';
  var eventDate = req.body.event_date;
  var eventTime = req.body.event_time;
  var location = req.body.location ? String(req.body.location).trim() : '';
  var venue = req.body.venue ? String(req.body.venue).trim() : '';
  var ticketPrice = parseFloat(req.body.ticket_price);
  var goalAmount = parseFloat(req.body.goal_amount);
  var progressAmount = req.body.progress_amount ? parseFloat(req.body.progress_amount) : 0.00;
  var imageUrl = req.body.image_url ? String(req.body.image_url).trim() : '/images/charity-default.png';
  var latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
  var longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
  var isSuspended = req.body.is_suspended ? 1 : 0;

  if (
    !name || isNaN(categoryId) || !purpose || !shortDescription ||
    !fullDescription || !eventDate || !eventTime || !location ||
    !venue || isNaN(ticketPrice) || isNaN(goalAmount)
  ) {
    res.status(400).json({ message: 'Please fill in all required event fields properly' });
    return;
  }

  var sql =
    'INSERT INTO events (organisation_id, category_id, name, purpose, short_description, ' +
    'full_description, event_date, event_time, location, venue, ticket_price, goal_amount, ' +
    'progress_amount, image_url, latitude, longitude, is_suspended) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  var params = [
    organisationId, categoryId, name, purpose, shortDescription,
    fullDescription, eventDate, eventTime, location, venue, ticketPrice,
    goalAmount, progressAmount, imageUrl, latitude, longitude, isSuspended
  ];

  db.query(sql, params)
    .then(function (result) {
      res.status(201).json({
        message: 'Event created successfully',
        eventId: result[0].insertId
      });
    })
    .catch(function () {
      res.status(500).json({ message: 'Database error creating new event' });
    });
});

app.put('/api/events/:id', function (req, res) {
  var eventId = req.params.id;
  var name = req.body.name ? String(req.body.name).trim() : '';
  var categoryId = parseInt(req.body.category_id, 10);
  var purpose = req.body.purpose ? String(req.body.purpose).trim() : '';
  var shortDescription = req.body.short_description ? String(req.body.short_description).trim() : '';
  var fullDescription = req.body.full_description ? String(req.body.full_description).trim() : '';
  var eventDate = req.body.event_date;
  var eventTime = req.body.event_time;
  var location = req.body.location ? String(req.body.location).trim() : '';
  var venue = req.body.venue ? String(req.body.venue).trim() : '';
  var ticketPrice = parseFloat(req.body.ticket_price);
  var goalAmount = parseFloat(req.body.goal_amount);
  var imageUrl = req.body.image_url ? String(req.body.image_url).trim() : '/images/charity-default.png';
  var latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
  var longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
  var isSuspended = req.body.is_suspended ? 1 : 0;

  if (
    !name || isNaN(categoryId) || !purpose || !shortDescription ||
    !fullDescription || !eventDate || !eventTime || !location ||
    !venue || isNaN(ticketPrice) || isNaN(goalAmount)
  ) {
    res.status(400).json({ message: 'Please fill in all required event fields properly' });
    return;
  }

  var sql =
    'UPDATE events SET category_id = ?, name = ?, purpose = ?, short_description = ?, ' +
    'full_description = ?, event_date = ?, event_time = ?, location = ?, venue = ?, ' +
    'ticket_price = ?, goal_amount = ?, image_url = ?, latitude = ?, longitude = ?, ' +
    'is_suspended = ? WHERE id = ?';

  var params = [
    categoryId, name, purpose, shortDescription, fullDescription,
    eventDate, eventTime, location, venue, ticketPrice, goalAmount,
    imageUrl, latitude, longitude, isSuspended, eventId
  ];

  db.query(sql, params)
    .then(function (result) {
      if (result[0].affectedRows === 0) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }
      res.json({ message: 'Event updated successfully' });
    })
    .catch(function () {
      res.status(500).json({ message: 'Database error updating event' });
    });
});

app.delete('/api/events/:id', function (req, res) {
  var eventId = req.params.id;

  var checkRegistrationsSql =
    'SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?';

  db.query(checkRegistrationsSql, [eventId])
    .then(function (checkResult) {
      var totalRegistrations = checkResult[0][0].total;

      if (totalRegistrations > 0) {
        res.status(400).json({
          message: 'Cannot delete event because it has existing registrations'
        });
        return;
      }

      var deleteSql = 'DELETE FROM events WHERE id = ?';
      db.query(deleteSql, [eventId])
        .then(function (deleteResult) {
          if (deleteResult[0].affectedRows === 0) {
            res.status(404).json({ message: 'Event not found' });
            return;
          }
          res.json({ message: 'Event deleted successfully' });
        })
        .catch(function () {
          res.status(500).json({ message: 'Database error deleting event' });
        });
    })
    .catch(function () {
      res.status(500).json({ message: 'Database error checking registrations' });
    });
});

app.use(express.static(path.join(__dirname, '../client')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

app.listen(PORT, function () {
  console.log('Server running at http://localhost:' + PORT);
});
