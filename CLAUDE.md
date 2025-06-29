# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quickstart guides for Bryntum components (Gantt, Grid, Calendar, etc.) with various frontend frameworks (React, Vue, Angular, Vanilla) and Express backends. Demonstrates minimal CRUD implementations using Bryntum's data management patterns.

## Architecture

- **Frontend**: `frontend/` - Vite + TypeScript Bryntum projects
- **Backend**: `backend/` - backend APIs for Bryntum products which use an ORM and database
- **Data Flow**: Bryntum CrudManager/AjaxStore patterns
- **Testing**: Playwright for CRUD operations

## Development Commands

### Backend

Example for JavaScript backend:

```bash
cd backend/{backend-framework}-{database}-{bryntum-product}
npm install
npm run seed  # Populate database
npm run dev   # Start server (port 1337)
```

### Frontend  

```bash
cd frontend/{bryntum-product}-{frontend-framework}
npm install
npm run dev   # Start dev server
npm run build
```

## Code Standards

- **ESLint**: Use `eslint-config.js` 
- **Style**: 4-space indent, semicolons, single quotes - in eslint config
- **TypeScript**: Strict typing, ES Modules only
- **Frontend**: Attach to `#app` div, Poppins font, Stockholm theme
- **No inline CSS**, use package managers for libraries

## Data Patterns

### Bryntum Gantt

```ts
project: {
    loadUrl: 'http://localhost:1337/api/load',
    syncUrl: 'http://localhost:1337/api/sync',
    autoLoad: true,
    autoSync: true,
    validateResponse: true
}
```

### Bryntum Grid

```ts
const store = new AjaxStore({
    readUrl: '/api/read',
    createUrl: '/api/create',
    updateUrl: '/api/update',
    deleteUrl: '/api/delete',
});
```

### Response Format

**Load**: `{ success, requestId, revision, [storeName]: { rows, total } }`
**Sync**: Handle `added`, `updated`, `removed` with phantom IDs

## File Structure

```
frontend/[product]-[framework]/
├── src/[product]Config.ts
├── src/App.tsx
└── src/main.ts

backend/[product]-[framework]-[database]/
├── models/index.js
├── server.js
├── addExampleData.js
└── data/[product].json
```

## API Consistency

### Cross-Backend Compatibility

- **Same Product = Same API**: All backends for a Bryntum product (e.g., `gantt-express-sqlite`, `gantt-django-sqlite`) share identical:

  - API endpoints (`/api/load`, `/api/sync` for Gantt)
  - Request/response structure
  - Data models and relationships
- **Reference Implementation**: Use existing backends as templates (e.g., `express-sqlite-gantt` → `django-sqlite-gantt`)

### Cross-Frontend Compatibility

- **Same Product = Same Config**: Frontend examples for a Bryntum product use identical:

  - Data fetching patterns
  - Component configuration structure
  - Only framework-specific syntax differs (JSX vs Vue templates vs Angular)

## Development Notes

- Use data from `example-json-data/` (don't modify)
- Use ORM
- CORS enabled for local development
- Guides in `guides/` folder (super-quick, no explanations just quick step-by-step guide)
    - don't number headings
    - don't use sentence case for headings - capitalize the first letter of the heading and proper nouns
- Each frontend/backend combo is independent
- The backend dev server should run on port 1337. The frontend dev server should run on port 5173.
- for the frontend `index.html` file, set an appropriate title for the page:

```html
  <title>How to use an Angular Bryntum Grid with a backend API</title>
```

- for the frontend `styles.css` file, import the Poppins font from Google Fonts and import the appropriate Bryntum stockholm theme:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/grid/grid.stockholm.css";
```

- after frontend code is created and working, make sure the npm dependencies are installed and then add the frontend to the `combinations` array in the `tests/orchestrator.js` file so that it will be included in the tests. For example, if `gantt-angular` is created, add it to the `frontends` array in the `combinations` array where the `backend` name ends with `-gantt`. 

- after backend code is created and working, make sure the npm dependencies are installed and then add the backend to the `combinations` array in the `tests/orchestrator.js` file so that it will be included in the tests. For example, if `express-sqlite-gantt` is created, create a new object in the `combinations` array with the `backend` name `gantt-express-sqlite` and add a `frontends` array containing any gantt frontend code that has been created in the `frontend` folder such as 'gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'.

```js
    {
        backend: 'express-sqlite-gantt',
        frontends: ['gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'],
        product: 'gantt'
    },
```

## Testing Individual Combinations

To test specific combinations instead of all combinations, use the orchestrator directly with command line flags:

```bash
# Test specific frontend with all compatible backends
node tests/orchestrator.js --frontend gantt-react

# Test specific backend with all frontends
node tests/orchestrator.js --backend express-sqlite-gantt

# Test specific combination only
node tests/orchestrator.js --backend express-sqlite-gantt --frontend gantt-react

# Test all combinations for a product
node tests/orchestrator.js --product gantt
```

This is useful when:
- A new frontend is created and you want to test it immediately
- A new backend is created and you want to verify it works
- Debugging a specific failing combination
- Quick validation during development