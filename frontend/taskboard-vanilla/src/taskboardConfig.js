export const taskboardConfig = {
    appendTo : 'app',

    // Experimental, transition moving cards using the editor
    useDomTransition : true,

    // Columns to display
    columns : [
        { id : 'todo', text : 'Todo', color : 'orange' },
        { id : 'doing', text : 'Doing', color : 'blue', tooltip : 'Items that are currently in progress' },
        { id : 'done', text : 'Done' }
    ],

    // Field used to pair a task to a column
    columnField : 'status',

    project : {
        loadUrl  : 'http://localhost:1337/api/load',
        syncUrl  : 'http://localhost:1337/api/sync',
        autoLoad : true,
        autoSync : true
    }
};
