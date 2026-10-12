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

app.use(express.static(path.join(__dirname, '../client')));

app.listen(PORT, function () {
  console.log('Server running at http://localhost:' + PORT);
});
