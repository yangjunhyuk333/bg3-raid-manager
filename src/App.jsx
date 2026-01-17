import { useState } from 'react'
import './index.css'

function App() {
  return (
    <div className="app-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="glass-panel" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
          발더스 게이트 3 파티 관리자
        </h1>
        <p>파티 관리, 일정 조율, 세이브 분석을 위한 올인원 도구</p>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <section className="glass-panel">
          <h2>💬 파티 채팅</h2>
          <p>파티원들과 실시간으로 소통하세요.</p>
        </section>

        <section className="glass-panel">
          <h2>📅 레이드 일정</h2>
          <p>최적의 레이드 시간을 투표하고 정하세요.</p>
        </section>

        <section className="glass-panel">
          <h2>📂 세이브 분석</h2>
          <p>세이브 파일을 업로드하여 진행 상황을 확인하세요.</p>
        </section>
      </main>
    </div>
  )
}

export default App
