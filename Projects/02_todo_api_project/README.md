# Task Management API

**AI-400: Cloud-Native AI with Docker, Kubernetes & Dapr — Panaversity**
Class 1 Project | Task Management API + Skills Development

## Overview

A Task Management (Todo) API with full CRUD operations built as part of the AI-400 course. The API allows creating, reading, updating, and deleting tasks, with automatic completion time tracking and request logging middleware.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **FastAPI** | API Framework |
| **pytest** | Test-Driven Development |
| **SQLModel** | Database Design & Management |
| **Neon PostgreSQL** | Cloud Database |
| **uv** | Python Package Manager |

## API Endpoints

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| `POST` | `/todos/` | Create a new todo | 201 |
| `GET` | `/todos/` | Get all todos | 200 |
| `GET` | `/todos/{todo_id}` | Get a single todo by ID | 200 |
| `PUT` | `/todos/{todo_id}` | Update a todo | 200 |
| `DELETE` | `/todos/{todo_id}` | Delete a todo | 204 |

## Setup

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd 02_todo_api_project

# Install dependencies
uv sync
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost/todo_db
API_KEY=your-api-key
DEBUG=True
```

### Running the Server

```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

API documentation is available at http://127.0.0.1:8000/docs

### Running Tests

Tests use an in-memory SQLite database — no external database required.

```bash
# Run all tests
uv run python -m pytest test_main.py -v

# Run a single test
uv run python -m pytest test_main.py::test_create_todo -v
```

## Todo Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto-generated primary key |
| `title` | str | Task title (required) |
| `description` | str | Task description (required) |
| `creation_time` | datetime | Auto-set on creation |
| `completion_time` | datetime | Auto-set when marked complete, cleared when unmarked |
| `completion_status` | bool | Default `false` |
| `ending_note` | str | Optional note |

## Example Usage

### Create a Todo

```bash
curl -X POST http://127.0.0.1:8000/todos/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn FastAPI", "description": "Complete the API project"}'
```

### Get All Todos

```bash
curl http://127.0.0.1:8000/todos/
```

### Update a Todo

```bash
curl -X PUT http://127.0.0.1:8000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completion_status": true}'
```

### Delete a Todo

```bash
curl -X DELETE http://127.0.0.1:8000/todos/1
```

## Submission Deliverables

| # | Deliverable | Details |
|---|-------------|---------|
| 1 | Skills | 4-5 Total (3 Technical + 1-2 Daily Workflow) |
| 2 | Task Management API | Complete CRUD Implementation |
| 3 | Demo Video | 60-90 seconds screen recording |
