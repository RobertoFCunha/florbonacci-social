import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'

import Activity from './pages/Activity'
import Discover from './pages/Discover'
import DiscoveryDetails from './pages/DiscoveryDetails'
import EditProfile from './pages/EditProfile'
import Explore from './pages/Explore'
import ForgotPassword from './pages/ForgotPassword'
import InterestsOnboarding from './pages/InterestsOnboarding'
import Login from './pages/Login'
import NewDiscovery from './pages/NewDiscovery'
import ProfileConnections from './pages/ProfileConnections'
import PublicProfile from './pages/PublicProfile'
import ResetPassword from './pages/ResetPassword'

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
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
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
          path="/discover/new"
          element={
            <ProtectedRoute>
              <NewDiscovery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover/:discoveryId"
          element={
            <ProtectedRoute>
              <DiscoveryDetails />
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
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
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