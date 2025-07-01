import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Dependency = sequelize.define(
    'Dependency',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        from : {
            type         : DataTypes.INTEGER,
            defaultValue : null,
            references   : {
                model : 'events',
                key   : 'id'
            },
            onDelete : 'CASCADE' // Ensures that deleting an 'event' will delete related 'dependencies'
        },
        to : {
            type         : DataTypes.INTEGER,
            defaultValue : null,
            references   : {
                model : 'events',
                key   : 'id'
            },
            onDelete : 'CASCADE'
        },
        fromSide : {
            type         : DataTypes.STRING,
            defaultValue : 'right',
            validate     : {
                isIn : [['top', 'left', 'bottom', 'right', 'start', 'end']]
            }
        },
        toSide : {
            type         : DataTypes.STRING,
            defaultValue : 'left',
            validate     : {
                isIn : [['top', 'left', 'bottom', 'right', 'start', 'end']]
            }
        },
        cls : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        lag : {
            type         : DataTypes.FLOAT,
            defaultValue : 0
        },
        lagUnit : {
            type         : DataTypes.STRING,
            defaultValue : 'day'
        }
    },
    {
        tableName  : 'dependencies',
        timestamps : false,
        indexes    : [
            {
                fields : ['from']
            },
            {
                fields : ['to']
            }
        ]
    }
);

export default Dependency;