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

app.get('/api/events', function (req, res) {
  var sql =
    'SELECT e.id, e.name, c.name AS category, e.event_date, e.event_time, ' +
    'e.location, e.venue, e.ticket_price, e.image_url, e.short_description ' +
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

app.use(express.static(path.join(__dirname, '../client')));

app.listen(PORT, function () {
  console.log('Server running at http://localhost:' + PORT);
});
