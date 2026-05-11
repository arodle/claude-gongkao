import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { KnowledgeMap } from './components/knowledge-map/KnowledgeMap'
import { PracticeModes } from './components/practice/PracticeModes'
import { AnswerInterface } from './components/practice/AnswerInterface'
import { ExamReview } from './components/reports/ExamReview'
import { PSTrendChart } from './components/reports/PSTrendChart'
import { RadarChart } from './components/reports/RadarChart'
import { GameMap } from './components/reports/GameMap'
import { DataManagement } from './components/user-center/DataManagement'

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<KnowledgeMap />} />
            <Route path="/practice" element={<PracticeModes />} />
            <Route path="/practice/:mode" element={<AnswerInterface />} />
            <Route path="/reports/exam/:id" element={<ExamReview />} />
            <Route path="/reports/trend" element={<PSTrendChart />} />
            <Route path="/reports/radar" element={<RadarChart />} />
            <Route path="/reports/game-map" element={<GameMap />} />
            <Route path="/user-center" element={<DataManagement />} />
          </Routes>
        </AppShell>
      </AppProvider>
    </HashRouter>
  )
}

export default App
