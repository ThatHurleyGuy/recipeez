# Recipeez

A private recipe manager and meal-planning app backed by SQLite.

## Features

- Browse, search, add, and edit recipes.
- First-run import of the existing root-level Markdown recipes.
- Import recipes from a URL using schema.org JSON-LD first, with an optional OpenAI-compatible LLM fallback.
- Create ad hoc meal plans, add recipes, aggregate ingredients, select needed items, and send them to Vikunja.

## Running

```bash
npm install
npm run dev
```

The app runs on port `4040` by default.

For a production-mode local run:

```bash
npm run build
npm start
```

`npm start` runs the generated standalone Next server on `127.0.0.1:4040` by default. Override the bind address when needed:

```bash
PORT=4041 HOSTNAME=localhost npm start
```

Docker still binds to `0.0.0.0` inside the container.

## Docker

Create a local environment file if you need optional integrations:

```bash
cp .env.example .env
```

Build and run the production image:

```bash
docker compose up --build -d
```

The app listens on `http://localhost:4040`. SQLite data is stored in the named Docker volume `recipeez-data`, which avoids host bind-mount permission issues with the non-root container user.

Useful operations:

```bash
docker compose logs -f recipeez
docker compose ps
docker compose down
```

## Dependency Updates

Renovate is configured in `renovate.json` for npm, Dockerfile, and Compose updates. Enable the Renovate GitHub app for this repository, or run Renovate from your own automation with the repository root as its working directory.

Patch and minor npm/container updates are grouped and marked for automerge after checks pass. Major updates require approval from the Renovate dependency dashboard.

## Configuration

```env
# SQLite location; defaults to ./data/recipeez.db
DATABASE_PATH=/app/data/recipeez.db

# Set false to prevent first-run Markdown import
AUTO_IMPORT_MARKDOWN=true

# Optional URL import fallback
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=...
LLM_MODEL=gpt-4.1-mini

# Vikunja shopping-list sync
VIKUNJA_URL=https://vikunja.example.com
VIKUNJA_API_TOKEN=...
VIKUNJA_PROJECT_ID=123
```

SQLite is the source of truth once the app starts. Existing Markdown recipes are imported only when the database is empty.
