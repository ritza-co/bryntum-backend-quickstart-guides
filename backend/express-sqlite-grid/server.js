import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import { Player } from './models/index.js';
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

app.get('/api/read', async(req, res) => {
    console.log('api/read');
    try {
        const players = await Player.findAll();

        res.send({
            success : true,
            data    : players
        });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players data could not be read.'
        });
    }
});

app.post('/api/create', async(req, res) => {
    try {
        const { data } = req.body;

        // Perform all creates in a single transaction
        const result = await sequelize.transaction(async(t) => {
            const createdPlayers = [];

            for (const item of data) {
                // eslint-disable-next-line no-unused-vars
                const { id, ...playerData } = item;
                const newPlayer = await Player.create(playerData, { transaction : t });
                createdPlayers.push(newPlayer);
            }

            return createdPlayers;
        });

        res.send({ success : true, data : result });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players could not be created'
        });
    }
});

app.patch('/api/update', async(req, res) => {
    try {
        const { data } = req.body;

        // Perform all updates in a single transaction d
        const result = await sequelize.transaction(async(t) => {
            const updatedPlayers = [];

            for (const item of data) {
                const { id, ...updateData } = item;

                // Update the player
                const [updated] = await Player.update(updateData, {
                    where       : { id : id },
                    transaction : t
                });

                if (updated) {
                    // Fetch the updated player
                    const updatedPlayer = await Player.findOne({
                        where       : { id : id },
                        transaction : t
                    });
                    updatedPlayers.push(updatedPlayer);
                }
                else {
                    throw new Error(`Player with id ${id} not found`);
                }
            }

            return updatedPlayers;
        });

        res.send({ success : true, data : result });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players could not be updated'
        });
    }
});

app.delete('/api/delete', async(req, res) => {
    try {
        const { ids } = req.body;

        // Perform the delete operations in a single transaction
        await sequelize.transaction(async(t) => {
            // Delete players whose ID is in the ids array
            await Player.destroy({
                where       : { id : ids },
                transaction : t
            });
        });

        res.send({ success : true });
    }
    catch (error) {
        console.error(error);
        const message = 'Could not delete selected player record(s)';
        res.send({
            success : false,
            message
        });
    }
});


app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});
