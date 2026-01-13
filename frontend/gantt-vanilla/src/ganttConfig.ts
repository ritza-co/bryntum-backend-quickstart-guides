import { TaskModel, type GanttConfig  } from '@bryntum/gantt';

export const ganttConfig: GanttConfig = {
    appendTo   : 'app',
    viewPreset : 'weekAndDayLetter',
    barMargin  : 10,
    project    : {
        taskStore : {
            transformFlatData : true,

            // Ensure newly created tasks are manually scheduled. The project-level
            // "startedTaskScheduling : 'Manual'" does not automatically set the
            // TaskModel field `manuallyScheduled` on new records.
            listeners : {
                add({ records }) {
                    records?.forEach(task => {
                        (task as TaskModel).manuallyScheduled = true;
                    });
                }
            }
        },
        loadUrl               : 'http://localhost:1337/api/load',
        autoLoad              : true,
        syncUrl               : 'http://localhost:1337/api/sync',
        autoSync              : true,
        validateResponse      : true,
        startedTaskScheduling : 'Manual'
    },
    columns : [
        { type : 'name', field : 'name', text : 'Name', width : 250 },
        { type : 'startdate', field : 'startDate', text : 'Start Date' },
        { type : 'enddate', field : 'endDate', text : 'End Date' },
        { type : 'duration', field : 'fullDuration', text : 'Duration' },
        { type : 'percentdone', field : 'percentDone', text : '% Done', width : 80 }
    ]
};
