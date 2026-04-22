import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import BackOfficePage from './pages/modules/BackOfficePage';
import FrontOfficePage from './pages/modules/FrontOfficePage';
import SupplyChainPage from './pages/modules/SupplyChainPage';
import OperationsPage from './pages/modules/OperationsPage';
import GovernancePage from './pages/modules/GovernancePage';
import Layout from './components/Layout/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="builder" element={<Builder />} />
          <Route path="builder/:pageId" element={<Builder />} />
          <Route path="backoffice" element={<BackOfficePage />} />
          <Route path="frontoffice" element={<FrontOfficePage />} />
          <Route path="supplychain" element={<SupplyChainPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="governance" element={<GovernancePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
