import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import { Assignment, Task, Resource } from './models/index.js';
import process from 'process';

const app = express();
const PORT = process.env.PORT || 1337;

app.use(cors(
    {
        origin : 'http://localhost:5173'
    }
));

app.use(express.json());

const initializeDatabase = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Unable to connect to database:', error);
    }
};

app.get('/api/load', async(req, res) => {
    try {
        const assignmentsPromise = Assignment.findAll();
        const tasksPromise = Task.findAll();
        const resourcesPromise = Resource.findAll();
        const [assignments, tasks, resources] = await Promise.all([
            assignmentsPromise,
            tasksPromise,
            resourcesPromise
        ]);
        res
            .send({
                assignments : { rows : assignments },
                tasks       : { rows : tasks },
                resources   : { rows : resources }
            })
            .status(200);
    }
    catch (error) {
        console.error({ error });
        res.send({
            success : false,
            message :
        'There was an error loading the assignments, tasks, and resources data.'
        });
    }
});

app.post('/api/sync', async function(req, res) {
    const { requestId, assignments, tasks, resources } = req.body;

    const taskMapping = {};

    try {
        const response = { requestId, success : true };

        if (resources) {
            const rows = await applyTableChanges('resources', resources);
            // if new data to update client
            if (rows) {
                response.resources = { rows };
            }
        }

        if (tasks) {
            const rows = await applyTableChanges('tasks', tasks);
            if (rows) {
                if (tasks?.added) {
                    rows.forEach((row) => {
                        taskMapping[row.$PhantomId] = row.id;
                    });
                }
                response.tasks = { rows };
            }
        }

        if (assignments) {
            if (tasks && tasks?.added) {
                assignments.added.forEach((assignment) => {
                    assignment.event = taskMapping[assignment.event];
                });
            }
            const rows = await applyTableChanges('assignments', assignments);
            if (rows) {
                response.assignments = { rows };
            }
        }

        res.send(response);
    }
    catch (error) {
        console.error({ error });
        res.send({
            requestId,
            success : false,
            message : 'There was an error syncing the data changes.'
        });
    }
});


app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
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
        added.map(async(record) => {
            const { $PhantomId, ...data } = record;
            let id;
            // Insert record into the table.rows array
            if (table === 'assignments') {
                const assignment = await Assignment.create(data);
                id = assignment.id;
            }
            if (table === 'tasks') {
                const task = await Task.create(data);
                id = task.id;
            }
            if (table === 'resources') {
                const resource = await Resource.create(data);
                id = resource.id;
            }
            // report to the client that we changed the record identifier
            return { $PhantomId, id };
        })
    );
}

function updateOperation(updated, table) {
    return Promise.all(
        updated.map(async({ id, ...data }) => {
            if (table === 'assignments') {
                await Assignment.update(data, { where : { id } });
            }
            if (table === 'tasks') {
                await Task.update(data, { where : { id } });
            }
            if (table === 'resources') {
                await Resource.update(data, { where : { id } });
            }
        })
    );
}

function deleteOperation(deleted, table) {
    return Promise.all(
        deleted.map(async({ id }) => {
            if (table === 'assignments') {
                await Assignment.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'tasks') {
                await Task.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'resources') {
                await Resource.destroy({
                    where : {
                        id : id
                    }
                });
            }
        })
    );
}