import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Assignment = sequelize.define(
    'Assignment',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        eventId : {
            type       : DataTypes.INTEGER,
            allowNull  : false,
            references : {
                model : 'events',
                key   : 'id'
            },
            onDelete : 'CASCADE' // Ensures that deleting an 'event' will delete related 'assignments'
        },
        resourceId : {
            type       : DataTypes.INTEGER,
            allowNull  : false,
            references : {
                model : 'resources',
                key   : 'id'
            },
            onDelete : 'CASCADE' // This will delete all assignments referencing the resource when it's deleted
        }
    },
    {
        tableName  : 'assignments',
        timestamps : false,
        indexes    : [
            {
                fields : ['eventId']
            },
            {
                fields : ['resourceId']
            }
        ]
    }
);

export default Assignment;