import { useRef } from 'react';
import { BryntumTaskBoard } from '@bryntum/taskboard-react';
import { taskboardConfig } from './taskboardConfig';

function App() {
    const taskboard = useRef(null);

    return (
        <BryntumTaskBoard ref={taskboard} {...taskboardConfig} />
    );
}

export default App;
