import React, { useState } from 'react';
import TacticsList from './TacticsList';
import TacticsEditor from './TacticsEditor';

const TacticsBoard = ({ user, isMobile }) => {
    const [selectedTactic, setSelectedTactic] = useState(null);

    if (selectedTactic) {
        return (
            <TacticsEditor
                user={user}
                isMobile={isMobile}
                tacticId={selectedTactic.id}
                initialData={selectedTactic}
                onBack={() => setSelectedTactic(null)}
            />
        );
    }

    return (
        <TacticsList
            user={user}
            isMobile={isMobile}
            onSelectTactic={setSelectedTactic}
        />
    );
};

export default TacticsBoard;
