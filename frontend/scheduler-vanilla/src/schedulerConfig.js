export const schedulerConfig = {
    appendTo    : 'app',
    startDate   : new Date(2026, 6, 20, 6),
    endDate     : new Date(2026, 6, 20, 20),
    viewPreset  : 'hourAndDay',
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        // This config enables response validation and dumping of found errors to the browser console.
        // It's meant to be used as a development stage helper only so please set it to false for production systems.
        validateResponse : true
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
