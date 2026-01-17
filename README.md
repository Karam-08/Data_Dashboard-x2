# Data Dashboard Demo

This project is a small JavaScript dashboard that demonstrates:
- Fetching data from external APIs
- Handling errors, retries, and timeouts
- Comparing Promise-based logic vs Async/Await logic

The dashboard loads users, posts, and comments, then combines them into a simple UI.

---

## How to Run

1. Download or clone the project files:
   - index.html
   - script.js
   - (optional) styles.css

2. Open index.html in a web browser.
   - No build step or server is required.
   - A modern browser with fetch support is recommended.

3. The dashboard loads automatically on page open.
   - Use the Load Dashboard or Refresh buttons to reload.
   - Toggle between Promise Mode and Async/Await Mode using the checkbox.

---

## API Endpoints Used

All data is fetched from JSONPlaceholder:

- Users: https://jsonplaceholder.typicode.com/users
- Posts: https://jsonplaceholder.typicode.com/posts
- Comments: https://jsonplaceholder.typicode.com/comments

---

## Promise Mode

Promise Mode uses Promise chaining.

### Flow

1. loadDashboardPromise() is called.
2. Requests run in parallel via Promise.allSettled().
3. Each request:
   - Enforces a timeout
   - Retries automatically on failure
4. Results are processed even if some requests fail.
5. Partial success is supported (e.g., comments fail but users/posts load).

### Why Promise Mode

- Demonstrates classic Promise patterns
- Shows explicit .then(), .catch(), .finally() usage

---

## Async/Await Mode

Async/Await Mode uses async functions.

### Flow

1. loadDashboardAsync() is called.
2. Requests run concurrently using await Promise.allSettled().
3. try/catch/finally manages success and errors.
4. Rendering logic matches Promise Mode but is easier to read.

### Why Async/Await Mode

- Cleaner syntax
- Easier error handling
- Recommended for modern JavaScript

---

## Error Handling

The dashboard supports:
- Timeouts
- Retries
- Server and client errors
- Invalid JSON
- Partial failures

These features mimic real-world API behavior.

---

## Purpose

This project is intended as a learning demo for asynchronous JavaScript patterns.
