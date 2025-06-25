import express from 'express';
import cors from 'cors';
import { Task } from './models/index.js';
import sequelize from './config/database.js';
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

// Bryntum CrudManager load endpoint
app.get('/api/load', async(req, res) => {
    try {
        const tasks = await Task.findAll({ order : [['id', 'ASC']] });

        res.json({
            success   : true,
            requestId : req.headers['x-request-id'] || Date.now(),
            revision  : 1,
            tasks     : {
                rows  : tasks,
                total : tasks.length
            }
        });
    }
    catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
});

// Bryntum CrudManager sync endpoint
app.post('/api/sync', async(req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const response = {
            success   : true,
            requestId : req.body.requestId || Date.now(),
            revision  : (req.body.revision || 0) + 1,
            tasks     : { rows : [], added : [], updated : [], removed : [] }
        };

        const { tasks } = req.body;

        // Process tasks
        if (tasks) {
            // Handle added tasks - map phantom IDs to real IDs
            if (tasks.added) {
                for (const task of tasks.added) {
                    const { $PhantomId, ...taskData } = task;
                    const newTask = await Task.create(taskData, { transaction });

                    // Return both phantom ID and real ID for client mapping
                    response.tasks.rows.push({
                        $PhantomId : $PhantomId,
                        id         : newTask.id,
                        ...newTask.toJSON()
                    });
                }
            }

            // Handle updated tasks - only return updated fields if server makes changes
            if (tasks.updated) {
                for (const task of tasks.updated) {
                    await Task.update(task, {
                        where : { id : task.id },
                        transaction
                    });
                }
            }

            // Handle removed tasks
            if (tasks.removed) {
                for (const task of tasks.removed) {
                    await Task.destroy({
                        where : { id : task.id },
                        transaction
                    });
                }
            }
        }

        await transaction.commit();
        res.json(response);
    }
    catch (error) {
        await transaction.rollback();
        console.error('Error syncing data:', error);
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
});

app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
