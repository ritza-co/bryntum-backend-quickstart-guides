import { BryntumSchedulerProProps } from '@bryntum/schedulerpro-react';

export const schedulerProConfig: BryntumSchedulerProProps = {
    startDate  : new Date(2025, 9, 20, 6),
    endDate    : new Date(2025, 9, 20, 20),
    viewPreset : 'hourAndDay',
    // A Project holds the data and the calculation engine for Scheduler Pro. It also acts as a CrudManager, allowing loading data into all stores at once
    project    : {
        autoLoad  : true,
        autoSync  : true,
        transport : {
            load : {
                url : 'http://localhost:1337/api/load'
            },
            sync : {
                url : 'http://localhost:1337/api/sync'
            }
        }
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
