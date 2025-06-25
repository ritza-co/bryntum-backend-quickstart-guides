import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Player = sequelize.define(
    'Player',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        city : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        team : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        score : {
            type         : DataTypes.FLOAT,
            defaultValue : 0
        },
        percentageWins : {
            type         : DataTypes.FLOAT,
            defaultValue : 0,
            max          : 100
        }
    },
    {
        tableName  : 'players',
        timestamps : false
    }
);

export default Player;