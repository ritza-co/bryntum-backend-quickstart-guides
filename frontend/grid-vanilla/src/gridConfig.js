import { AjaxStore } from '@bryntum/grid';

const store = new AjaxStore({
    createUrl         : 'http://localhost:1337/api/create',
    readUrl           : 'http://localhost:1337/api/read',
    updateUrl         : 'http://localhost:1337/api/update',
    deleteUrl         : 'http://localhost:1337/api/delete',
    autoLoad          : true,
    autoCommit        : true,
    useRestfulMethods : true,
    httpMethods       : {
        read   : 'GET',
        create : 'POST',
        update : 'PATCH',
        delete : 'DELETE'
    }
});

export const gridConfig = {
    appendTo : 'app',
    store,
    columns  : [
        { type : 'rownumber' },
        {
            text  : 'Name',
            field : 'name',
            width : 280
        },
        {
            text  : 'City',
            field : 'city',
            width : 220
        },
        {
            text  : 'Team',
            field : 'team',
            width : 270
        },
        {
            type  : 'number',
            text  : 'Score',
            field : 'score',
            width : 100
        },
        {
            type  : 'percent',
            text  : 'Percent wins',
            field : 'percentageWins',
            width : 200
        }
    ]
};

