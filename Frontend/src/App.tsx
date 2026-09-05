import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Profile from './pages/Profile';
import TaskDetails from './pages/TaskDetails';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { WorkspaceRedirect } from './components/workspace';
import { BoardProvider, AuthProvider } from './context';

function App() {
  return (
    <Router>
      <AuthProvider>
        <BoardProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                <ProtectedRoute>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BoardProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
