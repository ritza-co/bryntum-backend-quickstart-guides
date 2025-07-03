import { AjaxStore, Grid, StringHelper } from '@bryntum/grid';
import '../css/app.css';

const store = new AjaxStore({
    createUrl  : '/api/create',
    readUrl    : '/api/read',
    updateUrl  : '/api/update/',
    deleteUrl  : '/api/delete',
    autoLoad   : true,
    autoCommit : true,

    useRestfulMethods : true,
    httpMethods       : {
        read   : 'GET',
        create : 'POST',
        update : 'PATCH',
        delete : 'DELETE'
    },
    listeners : {
        beforeRequest : (event) => {
            if (event.action === 'update') {
                const updatedItem = event.body.data[0];
                const itemId = updatedItem.id;
                delete updatedItem.id;
                event.body = updatedItem;
                event.url += `${itemId}`;
            }
        },
        change : (event) => {
            // A record has been moved, persist the new order of all records
            if (event.action === 'move') {
                const orderedData = event.source.records.map((record, index) => ({
                    id          : record.id,
                    parentIndex : index
                }));

                fetch('/api/bulk-update-order', {
                    method  : 'POST',
                    headers : {
                        'Content-Type' : 'application/json'
                    },
                    body : JSON.stringify(orderedData)
                });
            }
        }
    }
});

let newPlayerCount = 0;

const grid = new Grid({
    appendTo : 'app',
    features : {
        filter     : true,
        stripe     : true,
        summary    : true,
        rowReorder : {
            showGrip : true
        }
    },

    tbar : [
        {
            type  : 'buttongroup',
            items : [
                {
                    type     : 'button',
                    ref      : 'addButton',
                    color    : 'b-green',
                    icon     : 'b-fa-plus-circle',
                    margin   : '0 8 0 0',
                    text     : 'Add',
                    tooltip  : 'Adds a new row (at bottom)',
                    onAction : () => {
                        const counter = ++newPlayerCount,
                            added = grid.store.add({
                                name : `New player ${counter}`
                            });

                        grid.selectedRecord = added[0];
                    }
                },
                {
                    type     : 'button',
                    ref      : 'removeButton',
                    color    : 'b-red',
                    icon     : 'b-fa b-fa-trash',
                    text     : 'Remove',
                    tooltip  : 'Removes selected record(s)',
                    onAction : () => {
                        const selected = grid.selectedRecords;
                        if (selected && selected.length) {
                            const store = grid.store,
                                nextRecord = store.getNext(selected[selected.length - 1]),
                                prevRecord = store.getPrev(selected[0]);

                            store.remove(selected);
                            grid.selectedRecord = nextRecord || prevRecord;
                        }
                    }
                }
            ]
        },
        {
            type     : 'button',
            ref      : 'removeAll',
            text     : 'Remove all filters',
            margin   : '0 5',
            onAction : () => store.clearFilters()
        },
        {
            type        : 'button',
            ref         : 'readOnlyButton',
            text        : 'Read-only',
            tooltip     : 'Toggles read-only mode on grid',
            toggleable  : true,
            icon        : 'b-fa-square',
            pressedIcon : 'b-fa-check-square',
            onToggle    : ({ pressed }) => {
                addButton.disabled = grid.readOnly = pressed;
                removeButton.disabled = pressed || !grid.selectedRecords.length;
            }
        },
        {
            type       : 'button',
            text       : 'Sum selected rows',
            margin     : '0 auto',
            toggleable : true,
            onToggle   : 'up.onSelectToggle'
        }
    ],

    store,
    columns : [
        { type : 'rownumber' },
        {
            text   : 'Name (custom filter: whole words)',
            field  : 'name',
            width  : 280,
            editor : {
                type     : 'textfield',
                required : true
            },
            // This column has a custom filtering function that matches whole words
            filterable : ({ value, record }) =>
                Boolean(record.name.match(new RegExp(`${value}\\b`, 'i'))),
            sum             : 'count',
            summaryRenderer : ({ sum }) => `Total: ${sum}`
        },
        {
            text  : 'City',
            field : 'city',
            width : 220,
            sum   : (result, current, index) => {
                if (index === 0) {
                    result = {};
                }

                const city = current.city;
                if (!Object.prototype.hasOwnProperty.call(result, city)) {
                    result[city] = 1;
                }
                else {
                    ++result[city];
                }

                return result;
            },
            summaryRenderer : ({ sum }) => {
                let value = 0,
                    mostPopularCity = '';

                Object.keys(sum).forEach((key) => {
                    if (value < sum[key]) {
                        value = sum[key];
                        mostPopularCity = key;
                    }
                });

                return StringHelper.xss`Most entries: ${mostPopularCity} (${value})`;
            }
        },
        {
            text  : 'Team',
            field : 'team',
            width : 270,
            sum   : (result, current, index) => {
                if (index === 0) {
                    result = {};
                }

                const team = current.team;
                if (!Object.prototype.hasOwnProperty.call(result, team)) {
                    result[team] = 1;
                }
                else {
                    ++result[team];
                }

                return result;
            },
            summaryRenderer : ({ sum }) => {
                let value = 0,
                    mostPopularTeam = '';

                Object.keys(sum).forEach((key) => {
                    if (value < sum[key]) {
                        value = sum[key];
                        mostPopularTeam = key;
                    }
                });

                return StringHelper.xss`Most entries: ${mostPopularTeam} (${value})`;
            }
        },
        {
            type      : 'number',
            text      : 'Score',
            field     : 'score',
            width     : 100,
            // Using built in summary calculations
            summaries : [
                { sum : 'min', label : 'Min' },
                { sum : 'max', label : 'Max' }
            ]
        },
        {
            type   : 'percent',
            text   : 'Percent wins',
            field  : 'percentageWins',
            width  : 200,
            editor : {
                type : 'number',
                min  : 0,
                max  : 100
            },
            sum             : 'average',
            summaryRenderer : ({ sum }) => `Average: ${Math.round(sum)}%`
        }
    ],
    onSelectToggle() {
        this.features.summary.selectedOnly = !this.features.summary.selectedOnly;
    }
});

const { addButton, removeButton } = grid.widgetMap;