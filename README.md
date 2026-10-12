# Harbour Light Community Fund - Charity Events System (PROG2002)

A web application for the Harbour Light Community Fund to list, search, and display charity events.

---

## Project Structure

```text
PROG2002---Assessment-3/
├── api/
│   ├── sql/
│   │   └── charityevents_db.sql    # Database schema & seed data
│   ├── .env                        # Environment configuration
│   ├── .env.example                # Example environment variables
│   ├── event_db.js                 # MySQL database connection pool
│   ├── package.json                # API dependencies & scripts
│   └── server.js                   # Express server & static asset host
├── client/
│   ├── css/
│   │   └── style.css               # Main styling
│   ├── images/
│   │   └── charity-default.png     # Default event cover image
│   ├── js/
│   │   ├── home.js                 # Home page event list logic
│   │   ├── search.js               # Event search & filter logic
│   │   └── event.js                # Event details view logic
│   ├── index.html                  # Home page
│   ├── search.html                 # Search & filter page
│   └── event.html                  # Single event details page
├── package.json                    # Root package helper scripts
└── README.md
```

---

## Prerequisites

- **Node.js**: v14+ (v18 or v20 LTS recommended)
- **MySQL / MariaDB**: Running with access to import the provided SQL file

---

## Database Setup

1. Ensure MySQL is running on `localhost:3306`.
2. Import the database schema and sample data:
   ```bash
   mysql -u root -p < api/sql/charityevents_db.sql
   ```
3. Update `api/.env` if your database user, password, or port differ:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=charityevents_db
   DB_PORT=3306
   ```

---

## Installation & Running

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Run the Application
From the root directory:
```bash
npm start
```
Or from the `api/` directory:
```bash
cd api
node server.js
```

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.
- **Home**: `http://localhost:3000/index.html`
- **Search**: `http://localhost:3000/search.html`
- **Event Details**: `http://localhost:3000/event.html?id=1`
- **API Health**: `http://localhost:3000/api/health`
