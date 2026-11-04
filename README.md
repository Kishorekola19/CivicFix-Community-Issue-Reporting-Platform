# CivicFix — Community Issue Reporting Platform

CivicFix is a community platform that lets residents report local civic issues, track their progress, and helps coordinators manage and resolve them.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Team](#team)


---

## Overview

Many everyday problems in a neighborhood, such as potholes, broken streetlights, garbage build-up, or water leakage, go unreported or unresolved because there is no simple way to report them and follow up. CivicFix gives citizens a single place to raise issues and see what happens next, and gives coordinators a dashboard to triage, assign, and close them.

## Features

> Features are being built incrementally through feature branches and pull requests. Update this list as modules are completed.

**Citizens**
- Register and log in securely
- Report an issue with title, description, category, and location
- Track the status of submitted issues (e.g. Reported → In Progress → Resolved)

**Coordinators / Admins**
- View and filter all reported issues
- Update issue status and add progress notes
- Manage resolution workflow

**Platform**
- Role-based authentication and authorization
- RESTful API backed by MongoDB
- Responsive React frontend

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | React                 |
| Backend    | Node.js, Express.js   |
| Database   | MongoDB               |
| Hosting    | Vercel (`vercel.json`)|

## Repository Structure

```
CivicFix-Community-Issue-Reporting-Platform/
├── client/        # React frontend application
├── server/        # Node.js + Express backend (REST API)
├── docs/          # Project planning and documentation
├── .gitignore
├── vercel.json    # Vercel deployment configuration
└── README.md
```


### 1. Clone the repository

```bash
git clone https://github.com/Kishorekola19/CivicFix-Community-Issue-Reporting-Platform.git
cd CivicFix-Community-Issue-Reporting-Platform
```

### 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev
```

The API will start on `http://localhost:5000` (or the port you configure).

### 3. Set up the frontend

Open a new terminal:

```bash
cd client
npm install
npm start
```

The app will open at `http://localhost:3000`.

## Environment Variables

Create a `.env` file inside `server/` (adjust names to match your code):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/civicfix
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
```

And, if the client needs one, inside `client/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```


## Available Scripts

**Server (`/server`)**

| Command         | Description                         |
|-----------------|-------------------------------------|
| `npm start`     | Start the server                    |
| `npm run dev`   | Start with auto-reload (nodemon)    |

**Client (`/client`)**

| Command         | Description                         |
|-----------------|-------------------------------------|
| `npm start`     | Start the development server        |
| `npm run build` | Create a production build           |
| `npm test`      | Run tests                           |

## API Overview

> Planned endpoints — update as they are implemented.

| Method | Endpoint              | Description                  | Access        |
|--------|-----------------------|------------------------------|---------------|
| POST   | `/api/auth/register`  | Register a new user          | Public        |
| POST   | `/api/auth/login`     | Log in and receive a token   | Public        |
| GET    | `/api/issues`         | List issues                  | Authenticated |
| POST   | `/api/issues`         | Report a new issue           | Citizen       |
| GET    | `/api/issues/:id`     | Get issue details            | Authenticated |
| PUT    | `/api/issues/:id`     | Update issue / status        | Coordinator   |
| DELETE | `/api/issues/:id`     | Delete an issue              | Admin         |

## Deployment
Deployment Link:http://civic-fix-community-issue-reporting-iota.vercel.app/

## Team

| Member  | Responsibility                           |
|---------|------------------------------------------|
| Bhanu   | Frontend development                     |
| Anjali  | Frontend development                     |
| Ajay    | Authentication and authorization         |
| Kishore | MongoDB and APIs                         |




