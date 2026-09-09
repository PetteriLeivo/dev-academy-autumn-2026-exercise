<pre>
├── backend/
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   └── server.ts        # Main Express server entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   └── electricity_info/
│       └── dist/            # Compiled frontend production assets
└── docker-compose.yml       # Multi-container orchestration
</pre>

# Electricity Dashboard

A professional, responsive dashboard for tracking electricity data, built with React, TypeScript, Material-UI, Node.js, Express, and PostgreSQL.

## Features

- **Responsive Layouts:** Tailored desktop table view and mobile-optimized card interface.
- **Finnish Localization:** Standardized Finnish date formatting (`fmtPvm`) integrated across all views.
- **Data Controls:** Fully functional sorting, filtering, and pagination.
- **Data Visualization:** Interactive graphs powered by Recharts.
- **Robust Testing:** Automated E2E test coverage with Playwright.

## Tech Stack

- **Frontend:** React, Vite, Material-UI, Recharts
- **Backend:** Node.js, Express
- **Database:** PostgreSQL managed via Docker
- **Tools:** Adminer (database management UI), Playwright (E2E testing)

## Getting Started Locally

### Prerequisites

- Docker and Docker Compose installed on your machine.

### 1. Clone the Repository

Clone the repository and navigate into the project root:

git clone https://github.com/PetteriLeivo/dev-academy-autumn-2026-exercise.git

cd dev-academy-autumn-2026-exercise

### 2. Running with Docker Compose (Recommended)

To run the entire stack (Database, Adminer, and Backend serving the compiled Frontend) seamlessly:

1. Build and start the containers in detached mode:
   
   docker compose up -d --build

2. Open your browser and navigate to:
   - **Dashboard App:** http://localhost:3001
   - **Adminer UI:** http://localhost:8088

### 3. Running Locally (Without Docker for App Services)

If you prefer to run the backend and frontend natively for development or testing while keeping the database containerized:

1. **Start the Database:**
   docker compose up -d db adminer
   *(This starts PostgreSQL and Adminer in the background).*

2. **Start the Backend:**
   Open a terminal, navigate to the backend, install dependencies, and start it:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *(The backend server will run on `http://localhost:3001` and connect to the Docker PostgreSQL instance).*

3. **Start the Frontend:**
   Open a second terminal, navigate to the frontend, install dependencies, and start Vite:
   ```bash
   cd frontend/electricity_info
   npm install
   npm run dev
   ```
   *(The Vite dev server will typically run on `http://localhost:5173`)*


## Project Structure

- `backend/` - Express server, database connection, and frontend build serving, managed by its own Dockerfile.
- `frontend/` - React application source code.
- `docker-compose.yml` - Root orchestration file managing the PostgreSQL database, Adminer, and the backend container.

## Future Improvements

- Optional hourly drill-down view deferred to prioritize core system stability and strict delivery timeline.

## AI Usage Statement

An AI assistant (Google Gemini) was utilized during the development of this project as a technical collaborator and debugging partner. Specifically, AI was used for:
- **Troubleshooting & Debugging:** Resolving Node.js ES module scope issues (`import.meta.dirname`) and Express v5 path-to-regexp wildcard routing errors.
- **Configuration Assistance:** Structuring the production Dockerfile, multi-container Docker Compose setup, and organizing project documentation.
- **Code Refactoring:** Adapting the static file serving middleware and catch-all routing fallback.

All architectural decisions, code implementation, integration, and testing were actively reviewed, managed, and verified by the author.

## Test Automation & E2E Testing

This application features a robust End-to-End (E2E) testing suite built with **Playwright (TypeScript)**, covering core domain requirements, asynchronous data loading, localized UI elements, and interactive edge cases across Chromium, Firefox, and WebKit.

### Test Coverage Summary

The test suite validates the application's core functionality through these comprehensive scenarios:

1. **App Loading & Initialization:** Verifies the app successfully mounts and handles asynchronous data fetching states (`Ladataan...`).
2. **Data Rendering & Localization:** Validates correct rendering of Finnish-localized table headers (`Kulutus`, `Tuotanto`, `Hinta`).
3. **Negative Pricing Indicators:** Ensures hours or days with negative electricity prices are correctly handled and displayed.
4. **Pagination:** Confirms navigation controls work properly across multi-page datasets (`Sivu X / Y`).
5. **View Toggling:** Tests switching between tabular summaries and graphical or chart views.
6. **Filtering Logic:** Validates data filtering mechanisms such as isolating negative price hours.
7. **Graceful Error & Empty States:** Checks that out-of-range inputs or empty results are handled cleanly without crashing the UI.
8. **Column Sorting:** Verifies that clicking column headers interactively reorders the tabular dataset.

### Running the Test Suite on Project Root
```bash
# Install the missing root dependencies (including @playwright/test)
npm install

# Install the browser binaries if they aren't there yet
npx playwright install
# Run all E2E tests headlessly across browsers
npx playwright test

# Run tests with the interactive Playwright UI runner
npx playwright test --ui

# View the detailed HTML test report
npx playwright show-report