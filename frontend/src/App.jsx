import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminLayout from './components/common/AdminLayout'
import Home from './pages/Home'
import ProjectsList from './pages/ProjectsList'
import ProjectDetail from './pages/ProjectDetail'
import Stories from './pages/Stories'
import NotFound from './pages/NotFound'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ProjectManage from './pages/admin/ProjectManage'
import StockManage from './pages/admin/StockManage'
import DonationManage from './pages/admin/DonationManage'
import AchievementManage from './pages/admin/AchievementManage'
import LoveStoryManage from './pages/admin/LoveStoryManage'
import LoveWallManage from './pages/admin/LoveWallManage'
import MediaLibrary from './pages/admin/MediaLibrary'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Public */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/projects" element={<><Navbar /><ProjectsList /><Footer /></>} />
          <Route path="/projects/:id" element={<><Navbar /><ProjectDetail /><Footer /></>} />
          <Route path="/stories" element={<><Navbar /><Stories /><Footer /></>} />
          <Route path="/admin/login" element={<Login />} />
          
          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectManage />} />
            <Route path="stock" element={<StockManage />} />
            <Route path="donations" element={<DonationManage />} />
            <Route path="achievements" element={<AchievementManage />} />
            <Route path="love-stories" element={<LoveStoryManage />} />
            <Route path="love-wall" element={<LoveWallManage />} />
            <Route path="media-library" element={<MediaLibrary />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
