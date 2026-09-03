import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import Discover from './pages/Discover'
import EditProfile from './pages/EditProfile'
import InterestsOnboarding from './pages/InterestsOnboarding'
import Login from './pages/Login'
import NewDiscovery from './pages/NewDiscovery'
import ProfileConnections from './pages/ProfileConnections'
import PublicProfile from './pages/PublicProfile'

import Explore from './pages/Explore'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/interests"
          element={
            <ProtectedRoute>
              <InterestsOnboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover/new"
          element={
            <ProtectedRoute>
              <NewDiscovery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:profileId"
          element={
            <ProtectedRoute>
              <PublicProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:profileId/connections"
          element={
            <ProtectedRoute>
              <ProfileConnections />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App