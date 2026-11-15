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

## Deploy to Netlify

This repository is configured for Netlify with `netlify.toml`. Netlify's Next.js adapter supports the App Router and API route handlers, so the UI and backend deploy together. No separate API site or CORS configuration is required.

1. Push the repository to GitHub.
2. In Netlify, choose **Add new site** → **Import an existing project**, connect GitHub, and select `krishnakant20/TodoReactNative`.
3. Use the repository root as the base directory. Netlify should use the build command `npm run build` from `netlify.toml`; leave the publish directory on automatic detection rather than setting it to `public` or `out`.
4. In the site's environment variable settings, add `MONGODB_URI` and paste your MongoDB Atlas connection string. Set it for the Production deploy context (and Deploy Previews only if you want previews to use a database). Do not use a `NEXT_PUBLIC_` prefix or commit the URI.
5. In MongoDB Atlas **Network Access**, ensure Netlify's functions can reach the cluster. Netlify's function egress addresses can vary; for a free setup, Atlas may require `0.0.0.0/0` (allow access from anywhere). If you use that setting, protect the cluster with a strong database-user password and grant that user only `readWrite` access to this app's database.
6. Start the deploy. After it succeeds, open your Netlify site URL and check `<your-site-url>/api/health`; it should return `{"status":"ok","database":"connected"}`.

The app currently has no authentication, so a public deployment lets visitors access and change the same shared tasks. Don't store sensitive or private tasks until authentication and per-user access are added. Check Netlify's current free-plan usage limits for Functions and builds.

## Scope

Tasks are shared among app users; authentication and per-user access control are not part of this assignment. API/database errors are shown in the UI rather than silently saving tasks locally.
