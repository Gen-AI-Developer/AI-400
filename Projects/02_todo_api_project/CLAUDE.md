# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Todo CRUD API built with FastAPI + SQLModel, backed by a Neon PostgreSQL database.

## Commands

```bash
# Run the dev server (hot reload)
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Run all tests (uses in-memory SQLite, no DB needed)
uv run python -m pytest test_main.py -v

# Run a single test
uv run python -m pytest test_main.py::test_create_todo -v
```

## Architecture

This is a single-file API (`main.py`) — no package structure. Everything lives at the project root:

- **main.py** — FastAPI app, SQLModel models (DB + request/response), all CRUD endpoints, logging middleware, DB engine setup
- **test_main.py** — pytest tests using `TestClient` with an in-memory SQLite DB (patches `main.engine` at test time)

### Key patterns

- **SQLModel dual-use**: `Todo` is both the DB table model and the base for response serialization. Separate `TodoCreate`, `TodoUpdate`, `TodoResponse` models handle request/response validation.
- **DB session via DI**: `get_session()` yields a `Session` and is injected via FastAPI's `Depends()`.
- **Completion time logic**: Setting `completion_status=True` auto-sets `completion_time`; setting it back to `False` clears it.
- **Test isolation**: Tests replace `main.engine` with a SQLite in-memory engine and create/drop tables per test via the `client` fixture.

### Endpoints

| Method | Path | Status |
|--------|------|--------|
| POST | `/todos/` | 201 |
| GET | `/todos/` | 200 |
| GET | `/todos/{todo_id}` | 200 |
| PUT | `/todos/{todo_id}` | 200 |
| DELETE | `/todos/{todo_id}` | 204 |

## Environment

- Python 3.11, managed with `uv`
- `.env` file holds `DATABASE_URL`, `API_KEY`, and `DEBUG` (loaded via `python-dotenv`)
- Production DB is Neon PostgreSQL; tests use SQLite in-memory
