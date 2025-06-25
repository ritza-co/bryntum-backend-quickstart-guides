import { useRef } from 'react';
import { BryntumGrid } from '@bryntum/grid-react';
import { gridConfig } from './gridConfig';

function App() {
    const grid = useRef(null);

    return (
        <BryntumGrid ref={grid} {...gridConfig} />
    );
}

export default App;
