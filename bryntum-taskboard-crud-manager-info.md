# TaskBoard stores


- [resourceStore](https://bryntum.com/products/taskboard/docs/api/TaskBoard/model/ProjectModel#config-resourceStore)	Holds a collection of resources
- [taskStore](https://bryntum.com/products/taskboard/docs/api/TaskBoard/model/ProjectModel#config-taskStore)	Holds a collection of tasks
- [assignmentStore](https://bryntum.com/products/taskboard/docs/api/TaskBoard/model/ProjectModel#config-assignmentStore)	Holds a collection of assignments

## Load request structure

The load request has a payload, which by default looks like:

```json
{
    "type"      : "load",
    "requestId" : 17228564331330
}
```

## Load response structure

The backend should return JSON similar to the one seen below:

```json
{
    "success" : true,
    tasks : {
        "rows" : [
            {
                "id"          : 11,
                "name"        : "Investigate",
                "percentDone" : 50,
                "startDate"   : "2021-02-08",
                "endDate"     : "2021-02-13",
                "duration"    : 5
            },
            {
                "id"          : 12,
                "name"        : "Assign resources",
                "percentDone" : 50,
                "startDate"   : "2021-02-08",
                "endDate"     : "2021-02-20",
                "duration"    : 10
            },
            {
                "id"          : 17,
                "name"        : "Report to management",
                "percentDone" : 0,
                "startDate"   : "2021-02-20",
                "endDate"     : "2021-02-20",
                "duration"    : 0
            }
        ]
    },

    "resources" : {
        "rows" : [
            {
                "id"   : 1,
                "name" : "Mats"
            },
            {
                "id" : 2,
                "name" : "Nickolay"
            }
        ]
    },

    "assignments" : {
        "rows" : [
            {
                "id"       : 1,
                "event"    : 11,
                "resource" : 1,
                "units"    : 80
            }
        ]
    }
}
```

## Sync request structure

Syncing includes changes for all linked stores in a single request, with sections for added, updated and removed records per store. For changes to the TaskStore and the ResourceStore a sync request might look like this:

```json
{
    "requestId" : 124,
    "type"      : "sync",
    "revision"  : 5,

    "tasks"     : {
        "added" : [
            { "$PhantomId" : "_generated5", "name" : "New task" }
        ],
        "updated" : [
            { "id" : 50, "startDate" : "2022-05-02" }
        ],
        "removed" : [
            { "id" : 9001 }
        ]
    },

    "resources"      : {
        "added" : [
            { "$PhantomId" : "_generated7", "name" : "Steven", "surname" : "Grant" }
        ]
    }
}
```

Each added record is sent should include its phantom identifier (auto-generated client side unique value used to identify the record) (by default the $PhantomId, field name is used). Please do not persist phantom record identifiers as-is on the server. That might cause collisions on the client after data reloading. It's expected that backend assigns new identifiers to added records.

Please note that by default, only changed fields and any fields configured with alwaysWrite are sent. If you want all fields to always be sent, please see writeAllFields.

## Sync response structure

The Response to a sync request should confirm that changes were applied and optionally update the client with any additional changes made on the server.

If there are no additional changes made on the server, a short sync response such as this one is enough:

```json
{
    "success"   : true,
    "requestId" : 124,
    "revision"  : 6
}
```

The success attribute is by default optional for successful calls, and if you are not using revision validation the response can be made even shorter:

```json
{
    "requestId" : 124
}
```

Whenever the server makes changes to the synced data, the new values must be part of the response. For example, when saving a new record the server provides a new value for its id, and that has to be included for the client side to use the correct id. This is a valid response to the sync request above:

```json
{
    "success"     : true,
    "requestId"   : 124,
    "revision"    : 6,

    "tasks" : {
        "rows" : [
            { "$PhantomId" : "_generated5", "id" : 543, "added_dt" : "2022-05-02T11:30:00" }
        ]
    },

    "resources" : {
        "rows" : [
            { "$PhantomId" : "_generated7", "id" : 12 }
        ],
        "removed" : [
            { "id" : 5 }
        ]
    }
}
```

For each store there are two possible sections: rows and removed.

The rows section list data changes made by the server.

If the server decides to update any other field of any record it should return an object holding a combination of the record identifier and new field values (this is shown in above snippet where server sets added_dt field value). When adding a new record the server generates an identifier for it and responds with both old phantom identifier and the new identifier. The field values will be applied to the corresponding store record on the client.

 Note that this way the server can also provide new records to the client by passing them in the rows section.
The removed section contains identifiers of records removed by the server, perhaps by another user since the last load or sync call. In the above snippet, the response includes removal of a resource with id 5, initiated by the server.