import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define(
    'Task',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        eventColor : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        description : {
            type         : DataTypes.STRING,
            allowNull    : true,
            defaultValue : null
        },
        weight : {
            type         : DataTypes.INTEGER,
            allowNull    : false,
            defaultValue : 1
        },
        status : {
            type         : DataTypes.STRING,
            allowNull    : false,
            defaultValue : 'todo'
        },
        prio : {
            type         : DataTypes.STRING,
            allowNull    : false,
            defaultValue : 'medium'
        }
    },
    {
        tableName  : 'tasks',
        timestamps : false
    }
);

export default Task;