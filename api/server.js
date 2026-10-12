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

app.use(express.static(path.join(__dirname, '../client')));

app.listen(PORT, function () {
  console.log('Server running at http://localhost:' + PORT);
});
