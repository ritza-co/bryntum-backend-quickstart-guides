Goal: Generate complete, working CRUD quickstart guides for Bryntum product combinations

## Brief for code and text to generate in this repository

I want to generate multiple backend quickstart guides for Bryntum that cover four possible combinations:

- Bryntum Product (e.g. Grid)
- Back end Framework (e.g. Express)
- Database (e.g. SQLite)
- Front end Framework (e.g. React)

These should be super-quick start guides - no explanations of code, just the fastest steps to follow to get a CRUD app working with that combination of technologies.

## Requirements for each back end guide and code

### Tooling, front end, and back end

- Use modern tools. For example with Node, use ES Modules.
- Use folder structure for typical Vite app:

```
/frontend
/node_modules
/public
/src
  config
  style.css
  main.ts
index.html
package.json
vite.config.ts
```

- Add types. For example, use TypeScript NOT JavaScript.
- Use Vite for the front end.
- library imports must use a package manager, like npm. No copy and pasting of folders and files of a library.

- dont change the global namespace in the front end like this:
  
  ```ts
  declare global {
  interface Window {
    bryntum: {
      gantt: {
        Gantt: new (config: any) => any
      }
    }
  }
}
```

### Back end 

- Use an ORM that's commonly used, such as Sequelize for Node.js and Eloquent ORM for Laravel.
- Use a local SQLite file as a database.
- Create a seed script in the back end to add example data to the database, use the data in the example-json-data folder. There is a folder for each Bryntum product (e.g. gantt). Don't add extra data or change the data, or add extra data models. 

### Formatting

- use ESLint rules in the `eslint-config.js` folder so that the code formatting matches Bryntum's style.
- add gitignore files for the node_modules and other folders/files typically excluded.
- for TypeScript, add ";" to the end of statements and use the Bryntum formatting (4 spaces for intentation) as added in the `eslint-config.js` folder.

### Written guide

Add to guides folder.

- The guide should:

 1. show how to set up the created app (front end and backend) e.g. installing dependencies and seeding the database. So a user can quickly get up and running with a working example.
 2. Step by step instructions of how to make the app from scratch (front end and back end). So a user can learn how to setup a working example from scratch.
- For the `guide.md` file, make sure that there's an empty line before and after each code block.
- add space between headings and text.

Don't include how to add tests in the guide or add testing to the code.

### Front end

- attach the Bryntum product to a div with an ID of "app", as shown in this example HTML code:

```html
<body>
  <div id="app"></div>
</body>
```

- Set an appropriate title for the page in the `index.html` file:

```html
  <title>How to use an Angular Bryntum Grid with a backend API</title>
```

- Use Poppins font: import it from Google, use the appropriate Bryntum Stockholm theme, and make the Bryntum Product take up the whole screen height:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "../node_modules/@bryntum/calendar/calendar.stockholm.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}


#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
```

- don't use inline CSS styles
- For React, Angular, and Vue -> render the Bryntum wrappers. For example, the React Bryntum Gantt:

```ts
<BryntumGantt ref={gantt} {...ganttConfig} />;
```

Vue:

```ts
<template>
    <bryntum-gantt
        v-bind="ganttConfig"
    />
</template>
```

Angular:

```ts
@ViewChild('gantt') ganttComponent!: BryntumGanttComponent;
```

Give the element that the Bryntum product is attached to an ID of "app". The backend dev server should run on port 1337. The frontend dev server should run on port 5173.

### Data fetching

Here are examples of how to load and sync data:

#### Bryntum Gantt

Use the Bryntum Gantt project, which has a [Crud Manager](https://bryntum.com/products/gantt/docs/guide/Gantt/data/crud_manager_project) that simplifies loading data from and syncing data changes to the server. The Crud Manager uses the Fetch API as a transport system and JSON as the encoding format.

```ts
project    : {
    taskStore : {
        transformFlatData : true
    },
    loadUrl          : 'http://localhost:1337/api/load',
    autoLoad         : true,
    syncUrl          : 'http://localhost:1337/api/sync',
    autoSync         : true,
    // This config enables response validation and dumping of found errors to the browser console.
    // It's meant to be used as a development stage helper only so please set it to false for production.
    validateResponse : true
}
```

#### Bryntum Scheduler

Use the Bryntum Scheduler project, which has a [Crud Manager](https://bryntum.com/products/scheduler/docs/guide/Scheduler/data/crud_manager) that simplifies loading data from and syncing data changes to the server. The Crud Manager uses the Fetch API as a transport system and JSON as the encoding format.

```ts
crudManager : {
    loadUrl          : 'http://localhost:1337/api/load',
    autoLoad         : true,
    syncUrl          : 'http://localhost:1337/api/sync',
    autoSync         : true,
    // This config enables response validation and dumping of found errors to the browser console.
    // It's meant to be used as a development stage helper only so please set it to false for production systems.
    validateResponse : true
},
```

#### Bryntum Scheduler Pro

Use the Bryntum Scheduler Pro [project](https://bryntum.com/products/schedulerpro/docs/api/Scheduler/model/ProjectModel):

```ts
project: {
  calendar: "regular",
  // Configure urls used by the built-in CrudManager
  transport: {
    load: {
      url: "http://localhost:1338/api/load",
    },
    sync: {
      url: "http://localhost:1338/api/sync",
    },
  },
  autoLoad: true,
  autoSync: true,
  // This config enables response validation and dumping of found errors to the browser console.
  // It's meant to be used as a development stage helper only so please set it to false for production systems.
  validateResponse: true,
},
```

#### Bryntum Grid

Use an [AjaxStore](https://bryntum.com/products/grid/docs/api/Core/data/AjaxStore):

```ts
const store = new AjaxStore({
    createUrl  : '/api/create',
    readUrl    : '/api/read',
    updateUrl  : '/api/update/',
    deleteUrl  : '/api/ ddelete/',
    autoLoad   : true,
    autoCommit : true,

    useRestfulMethods : true,
    httpMethods       : {
        read   : 'GET',
        create : 'POST',
        update : 'PATCH',
        delete : 'DELETE'
    }
});
```

#### Bryntum Calendar

Use the [CrudManager](https://bryntum.com/products/calendar/docs/api/Calendar/data/CrudManager):

```ts
crudManager: {
  transport: {
    load: {
      url: "http://localhost:1337/load",
    },
    sync: {
      url: "http://localhost:1337/sync",
    },
  },
  autoLoad: true,
  autoSync: true,
}
```


### Bryntum components config


Add the Bryntum component's config to a separate folder and import it:

For example, with React:

```ts
<BryntumGantt ref={gantt} {...ganttConfig} />;
```

GanttConfig.ts

```ts
import { BryntumGanttProps } from "@bryntum/gantt-react";

export const ganttConfig : BryntumGanttProps = {
    columns    : [{ type : 'name', field : 'name', width : 250 }],
    viewPreset : 'weekAndDayLetter',
    barMargin  : 10,

    project : {
        transport : {
            load : {
                url : 'data.json'
            }
        },
        autoLoad           : true,
        // Automatically introduces a `startnoearlier` constraint for tasks that (a) have no predecessors, (b) do not use
        // constraints and (c) aren't `manuallyScheduled`
        autoSetConstraints : true
    }
};
```

### Crud manager

#### load response structure:

Example for Gantt:

```json
{
    "success"     : true,
    "requestId"   : 123,
    "revision"    : 5,

    "events"       : {
        "rows" : [
            { "id" : 65, "name" : "Meeting", "startDate" : "2024-02-05T10:00:00.000Z", "endDate" : "2024-02-05T11:30:00.000Z" },
            { "id" : 9000, "name" : "Lunch", "startDate" : "2024-02-05T11:30:00.000Z", "endDate" : "2024-02-05T12:30:00.000Z" },
            { "id" : 9001, "name" : "Conference", "startDate" : "2024-02-05T13:00:00.000Z", "endDate" : "2024-02-05T17:00:00.000Z" }
        ],
        "total" : 5
    },

    "resources"      : {
        "rows" : [
            { "id" : 1, "name" : "Leo" },
            { "id" : 2, "name" : "James Fenimore" },
            { "id" : 3, "name" :  "Kate" }
        ],
        "total" : 3
    },

    "assignments"      : {
        "rows" : [
            { "id" : 1, "eventId" : 65, "resourceId" : 2, "assignedDT" : "2024-02-06T07:47:33.345Z" },
            { "id" : 2, "eventId" : 65, "resourceId" : 3, "assignedDT" : "2024-02-06T07:47:38.123Z" },
            { "id" : 3, "eventId" : 9000, "resourceId" : 1, "assignedDT" : "2024-02-06T09:37:33.445Z" },
            { "id" : 4, "eventId" : 9000, "resourceId" : 3, "assignedDT" : "2024-02-06T09:37:59.999Z" },
            { "id" : 5, "eventId" : 9001, "resourceId" : 1, "assignedDT" : "2024-02-06T15:17:33.001Z" },
            { "id" : 6, "eventId" : 9001, "resourceId" : 2, "assignedDT" : "2024-02-06T15:17:34.002Z" }
        ],
        "total" : 6
    }
}
```

#### Sync request structure

Example for Gantt:

```json
{
    "requestId" : 124,
    "type"      : "sync",
    "revision"  : 5,

    "events"     : {
        "updated" : [
            { "id" : 65, "name" : "Meeting - Conference planning", "endDate" : "2024-02-05T12:30:00.000Z" }
        ],
        "removed" : [
            { "id" : 9000 }
        ]
    },

    "assignments"      : {
        "added"   : [
          { "$PhantomId" : "assignment-321", "resourceId" :  3, "eventId" :  9001 }
        ],
        "removed" : [
            { "id" : 3 },
            { "id" : 4 }
        ]
    }
}
```

In the above example:

The `requestId` property is the unique request identifier. The
`type` property is the request type: sync or load (sync in this case since we are persisting data).
The `revision` property is the current server revision stamp the client has.
For each store, the request has three sections: added, updated and removed under which the corresponding records are placed. The presence of each section is optional depending on the presence of such type of modifications.

Each added record is sent including its phantom identifier (auto-generated client side unique value used to identify the record) (by default the `$PhantomId`, field name is used).

> Note: Please do not persist phantom record identifiers on the server. That might cause collisions on the client after data reloading. It's expected that backend assigns new identifiers to added records.

Each updated record data includes its identifier plus the updated field values.

And finally for removed records, only their identifiers are transferred (also remove linked assignments).

Please note that by default, only changed fields and any fields configured with `alwaysWrite` are sent. If you want all fields to always be sent, please see `writeAllFields`.

#### Sync response structure

The Response to the sync request basically has two objectives:

- To confirm that certain changes were applied
- To update the client with any changes that were made by the server

Crud Manager supports two response formats: short and full sync responses. The short format is enabled by default. Toggling the formats can be done by setting `supportShortSyncResponse` config.

Whenever the server makes changes to the synced data, the new values must be part of the response. For example when saving an added record the server provides new identifier value for the record and it has to be responded.

Here's an example response:

```json
{
    "success"     : true,
    "requestId"   : 124,
    "revision"    : 6,

    "assignments" : {
        "rows" : [
            { "$PhantomId" : "assignment-321", "id" : 17, "assignedDT" : "2024-02-15T08:47:33.345Z" }
        ],
        "removed" : [
            { "id" : 12 },
            { "id" : 13 }
        ]
    },

    "events" : {
      "removed" : [
        { "id" : 10001 }
      ]
    }
}
```

For each store there are two sections: rows and removed.

The rows section list data changes made by the server. As the bare minimum, for each added record sent from the client, the server should return the record phantom identifier and its "real" identifier assigned by the database. If the server decides to update any other fields of any record it should return an object holding a combination of the record identifier and new field values. The field values will be applied to the corresponding store record on the client. Note that this way the server can also provide new records to the client by passing them in the rows section.

The removed section contains identifiers of records removed by the server. 

Example Express backend for Gantt:

```ts
import bodyParser from "body-parser";
import express from "express";
import path from "path";
import { Dependency, Task } from "./models/index.js";

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "/node_modules/@bryntum/gantt")));

app.use(bodyParser.json());

app.get("/load", async (req, res) => {
  try {
    const tasksPromise = Task.findAll();
    const dependenciesPromise = Dependency.findAll();
    const [tasks, dependencies] = await Promise.all([
      tasksPromise,
      dependenciesPromise,
    ]);

    res.send({
      success: true,
      tasks: {
        rows: tasks,
      },
      dependencies: {
        rows: dependencies,
      },
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Tasks and dependencies could not be loaded",
    });
  }
});

app.post("/sync", async function (req, res) {
  const { requestId, tasks, dependencies } = req.body;
  try {
    const response = { requestId, success: true };
    // if task changes are passed
    if (tasks) {
      const rows = await applyTableChanges("tasks", tasks);
      // if got some new data to update client
      if (rows) {
        response.tasks = { rows };
      }
    }
    // if dependency changes are passed
    if (dependencies) {
      const rows = await applyTableChanges("dependencies", dependencies);
      // if got some new data to update client
      if (rows) {
        response.dependencies = { rows };
      }
    }
    res.send(response);
  } catch (error) {
    res.send({
      requestId,
      success: false,
      message: "There was an error syncing the data changes",
    });
  }
});

async function applyTableChanges(table, changes) {
  let rows;
  if (changes.added) {
    rows = await createOperation(changes.added, table);
  }
  if (changes.updated) {
    await updateOperation(changes.updated, table);
  }
  if (changes.removed) {
    await deleteOperation(changes.removed, table);
  }
  // if got some new data to update client
  return rows;
}

function createOperation(added, table) {
  return Promise.all(
    added.map(async (record) => {
      const { $PhantomId, ...data } = record;

      let result;
      if (table === "tasks") {
        result = await Task.create(data);
      }
      if (table === "dependencies") {
        result = await Dependency.create(data);
      }
      // Report to the client that the record identifier has been changed
      return { $PhantomId, id: result.id };
    })
  );
}

function updateOperation(updated, table) {
  return Promise.all(
    updated.map(({ $PhantomId, id, ...data }) => {
      if (table === "tasks") {
        return Task.update(data, { where: { id } }).then(() => ({
          $PhantomId,
          id,
        }));
      }
      if (table === "dependencies") {
        return Dependency.update(data, { where: { id } }).then(() => ({
          $PhantomId,
          id,
        }));
      }
    })
  );
}

function deleteOperation(deleted, table) {
  // Extract all ids from the deleted records array
  const ids = deleted.map(({ id }) => id);

  if (table === "tasks") {
    return Task.destroy({
      where: {
        id: ids,
      },
    });
  }
  if (table === "dependencies") {
    return Dependency.destroy({
      where: {
        id: ids,
      },
    });
  }
}
 
// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### Existing guides to use as a guideline

There are some existing guides that are not minimial super quick guides - they have extra features such as row reordering that are not needed for a minimal CRUD app:

- Bryntum Gantt: https://bryntum.com/products/gantt/docs/guide/Gantt/integration/backends/express/
- Bryntum Scheduler: https://bryntum.com/products/scheduler/docs/guide/Scheduler/integration/backends/express/guide
- Bryntum Scheduler Pro: none
- Bryntum Grid: https://bryntum.com/products/grid/docs/guide/Grid/integration/backends/express/guide
- Bryntum Calendar: None
- Bryntum Task Board: None

The documentation for each product also have the following guides:

- Working with data
- JavaScript integration
- Angular integration
- Vue integration
- React integration


## Steps to take

- Build the example front end in the frontend folder, e.g. frontend/gantt-react
- Build the example backend in the backend folder: e.g. backend/gantt-express-sqlite 
- Run the application for manual testing
- Write the super-quick start guide in a guides folder. 
  - don't number headings
  - don't use sentence case for headings - capitalize the first letter of the heading and proper nouns

- after frontend code is created and working, make sure the npm dependencies are installed and then add the frontend to the `combinations` array in the `tests/orchestrator.js` file so that it will be included in the tests. For example, if `gantt-angular` is created, add it to the `frontends` array in the `combinations` array where the `backend` name ends with `-gantt`. 

- after backend code is created and working, make sure the npm dependencies are installed and then add the backend to the `combinations` array in the `tests/orchestrator.js` file so that it will be included in the tests. For example, if `express-sqlite-gantt` is created, create a new object in the `combinations` array with the `backend` name `gantt-express-sqlite` and add a `frontends` array containing any gantt frontend code that has been created in the `frontend` folder such as 'gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'.

```js
    {
        backend: 'express-sqlite-gantt',
        frontends: ['gantt-angular', 'gantt-react', 'gantt-vanilla', 'gantt-vue'],
        product: 'gantt'
    },
```