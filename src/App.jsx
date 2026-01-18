import React from 'react'
import Layout from './components/layout/Layout'
import TacticsEditor from './features/tactics/TacticsEditor'
import './index.css'

function App() {
  const params = new URLSearchParams(window.location.search);
  const tacticId = params.get('tacticId');
  const user = JSON.parse(localStorage.getItem('bg3_user_profile') || 'null');

  if (tacticId && user) {
    return (
      <TacticsEditor
        user={user}
        tacticId={tacticId}
        initialData={{ title: "Loading...", elements: [] }}
        onBack={() => window.close()}
        isMobile={window.innerWidth < 768}
        isStandalone={true}
      />
    );
  }

  return (
    <Layout />
  )
}

export default App
