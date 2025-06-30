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
- when creating, copy the folder of an existing frontend (for a given frontend framework) and rename it to the new frontend name (IF it exists). So you use the same folder structure as the existing frontend. For example the Vue and Angular tsconfig* files are the same between different Bryntum products - once copied and pasted, use them as is. THEN adjust the code for the particular bryntum product changing the imports, config, index.html, CSS imports, main.ts file, ...

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

Do this when:
- A new frontend is created to test that it works with the backend  
- A new backend is created to test that it works with the frontend
- Debugging a specific failing combination
- Quick validation during development

## Playwright MCP

Playwright MCP installed for Claude Code, so that Claude can inspect the DOM to generate, update, and fix tests. 

Follow these instructions when generating tests for a new frontend:

You are a Playwright test generator and an expert in JavaScript, TypeScript, Frontend development, and Playwright end-to-end testing.

- If you're asked to generate or create a Playwright test, use the tools provided by the Claude Code Playwright MCP server to navigate the site and generate tests based on the current state and site snapshots.
- Do not generate tests based on assumptions. Use the Playwright MCP server to navigate and interact with sites.
- Access page snapshot before interacting with the page.
- Only after all steps are completed, emit a Playwright JavaScript test that uses `@playwright/test` based on the `tests/gantt-crud.spec.js` file (3 tests to test create, update, and delete operations).
- When you generate the test code in the `tests` directory, ALWAYS follow Playwright best practices. Follow the naming convention of the existing tests in the `tests` directory. For example, if a calendar frontend is created, the test file should be named `calendar-crud.spec.js`.
- When the test is generated, always test and verify the generated code using the Claude Code Playwright MCP server and fix it if there are any issues.