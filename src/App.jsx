import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MaintenancePage from './MaintenancePage'
import AdminPanel from './components/AdminPanel'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MaintenancePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<MaintenancePage />} />
      </Routes>
    </BrowserRouter>
  )
}
