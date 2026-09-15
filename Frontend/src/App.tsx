import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Profile from './pages/Profile';
import TaskDetails from './pages/TaskDetails';
import NotFound from './pages/NotFound';
import { ProtectedRoute, PublicRoute, OfflineIndicator } from './components/common';
import { WorkspaceRedirect } from './components/workspace';
import { BoardProvider, AuthProvider, NotificationProvider } from './context';

/** Wraps all routes that need authentication context */
function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/** Wraps protected workspace/board routes that require Board and Notification state */
function ProtectedAppLayout() {
  return (
    <BoardProvider>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </BoardProvider>
  );
}

function App() {
  return (
    <Router>
      <OfflineIndicator />
      <Routes>
        {/* Public routes — no auth context, no auth/me request */}
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />

        {/* Auth-aware routes — AuthProvider mounts here, triggers auth/me */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes — BoardProvider & NotificationProvider mount only here */}
          <Route element={<ProtectedAppLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <WorkspaceRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute>
                  <WorkspaceRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces/:workspaceId"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boards/:id"
              element={
                <ProtectedRoute allowGuestShareToken>
                  <BoardView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <TaskDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
