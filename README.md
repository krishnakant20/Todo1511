# Todo

A responsive weekly task planner built as one full-stack Next.js app. The App Router serves the UI and REST API; Mongoose stores tasks in MongoDB Atlas or a local MongoDB instance.

## Requirements

- Node.js 20.9 or newer
- npm
- MongoDB Atlas or a local MongoDB instance

## Run locally

1. Install the project dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` in the project root and set `MONGODB_URI`. For Atlas, create a database user, add your development IP under **Network Access**, and copy the connection string. Replace its username, password, and database name. Do not commit `.env.local`.

3. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The API health check is at [http://localhost:3000/api/health](http://localhost:3000/api/health).

The frontend and backend are served by the same Next.js process on port `3000`; API routes use the same origin under `/api`. There is no separate backend port.

## Features

- Create, edit, delete, search, and complete tasks
- Set a title, optional description, date, start and end times, and priority
- Browse tasks by day or by Monday–Sunday week
- See each week's open and completed counts
- REST API served on the same origin as the UI

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks?search=term` | List tasks, optionally search title and description |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get a task |
| `PATCH` | `/api/tasks/:id` | Update task fields or status |
| `DELETE` | `/api/tasks/:id` | Delete a task |

Task status is `in_progress` or `completed`; priority is `low`, `medium`, or `high`. Start and end times are stored as UTC instants and displayed in the browser's local time zone. Existing tasks without an end time display a one-hour duration.
