import React, { useState } from 'react';
import TacticsList from './TacticsList';
import TacticsEditor from './TacticsEditor';

const TacticsBoard = ({ user, isMobile, initialTacticId, clearInitialTactic }) => {
    return (
        <TacticsList
            user={user}
            isMobile={isMobile}
            initialTacticId={initialTacticId}
            clearInitialTactic={clearInitialTactic}
        />
    );
};

export default TacticsBoard;
