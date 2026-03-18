# Task Management Frontend (Angular Latest)

Frontend-only Task Management application built with latest Angular standalone architecture.

This project uses the backend API:

```ts
const API_URL = 'https://task-management-backend-lwdq.onrender.com/api/tasks';
```

## Features

- Add a new task (title required, description optional)
- View all tasks
- Edit task title, description, and status
- Toggle task status pending/completed
- Delete task
- Search tasks by title and description
- Client-side pagination
- Toast notifications for success/error events
- Responsive UI for desktop and mobile

## Modern Angular Concepts Used

- Standalone components and route configuration
- `inject()` for DI
- Signals: `signal`, `computed`, `effect`
- `linkedSignal` for derived writable signal synchronization
- `resource` for async derived task stats
- `rxResource` for API-driven reactive task loading
- `toSignal` + RxJS interop
- RxJS operators: `switchMap`, `concatMap`, `debounceTime`, `distinctUntilChanged`, `tap`, `finalize`
- Functional HTTP interceptor with `withInterceptors`
- Strict DTO-to-domain mapping and type-safe transformations

## Project Structure

```text
src/app/
	core/
		config/       # API constants
		models/       # DTO and domain models
		mappers/      # DTO <-> model conversion/type casting
		services/     # API + state orchestration
	features/
		tasks/
			components/ # Signal-based task form
			pages/      # Task list page and interactions
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development

```bash
npm start
```

Open: `http://localhost:4200`

### 3. Build production bundle

```bash
npm run build
```

Production output is generated in `dist/task-management-angular-modern`.

## Docker Deployment

### Build Docker image

```bash
docker build -t task-management-angular-modern .
```

### Run container

```bash
docker run --rm -p 8080:80 task-management-angular-modern
```

Open: `http://localhost:8080`

Docker setup includes:

- Multi-stage build for optimized image size
- Nginx static hosting
- SPA fallback routing via `try_files`

## API Integration Notes

- DTOs are defined in `src/app/core/models/task.dto.ts`
- Domain model is defined in `src/app/core/models/task.model.ts`
- Type casting and fallback safety are handled in `src/app/core/mappers/task.mapper.ts`
- API calls are centralized in `src/app/core/services/task-api.service.ts`

## Assignment Compliance

- Frontend only (no backend project created)
- Existing task functionality preserved and implemented with latest Angular patterns
- Production-level typing with DTOs, strict mode, and explicit mapping layer
