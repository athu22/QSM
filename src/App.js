import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { POProvider } from './contexts/POContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PurchaseTeamDashboard from './components/PurchaseTeamDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import VendorDashboard from './components/VendorDashboard';
import GateSecurityDashboard from './components/GateSecurityDashboard';
import SampleDeptDashboard from './components/SampleDeptDashboard';
import QCDashboard from './components/QCDashboard';
import WeighbridgeDashboard from './components/WeighbridgeDashboard';
import UnloadingDashboard from './components/UnloadingDashboard';
import AccountsDashboard from './components/AccountsDashboard';
import Unauthorized from './components/Unauthorized';
import AdminSetup from './components/AdminSetup';
import FirebaseTest from './components/FirebaseTest';
import FirebaseStatus from './components/FirebaseStatus';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <POProvider>
            <Router>
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Setup route for system configuration */}
            <Route path="/setup" element={<AdminSetup />} />
            
            {/* Firebase test route for debugging */}
            <Route path="/firebase-test" element={<FirebaseTest />} />
            
            {/* Firebase status route for debugging */}
            <Route path="/firebase-status" element={<FirebaseStatus />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Purchase Team Routes */}
            <Route 
              path="/purchase-team" 
              element={
                <ProtectedRoute allowedRoles={['Purchase Team']}>
                  <PurchaseTeamDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Manager Routes */}
            <Route 
              path="/manager" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Vendor Routes */}
            <Route 
              path="/vendor" 
              element={
                <ProtectedRoute allowedRoles={['Vendor']}>
                  <VendorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Gate Security Routes */}
            <Route 
              path="/gate-security" 
              element={
                <ProtectedRoute allowedRoles={['Gate Security']}>
                  <GateSecurityDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Sample Department Routes */}
            <Route 
              path="/sample-dept" 
              element={
                <ProtectedRoute allowedRoles={['Sample Dept']}>
                  <SampleDeptDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* QC Department Routes */}
            <Route 
              path="/qc-dept" 
              element={
                <ProtectedRoute allowedRoles={['QC Dept']}>
                  <QCDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Weighbridge Routes */}
            <Route 
              path="/weighbridge" 
              element={
                <ProtectedRoute allowedRoles={['Weighbridge Operator']}>
                  <WeighbridgeDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Unloading Department Routes */}
            <Route 
              path="/unloading-dept" 
              element={
                <ProtectedRoute allowedRoles={['Unloading Dept']}>
                  <UnloadingDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Accounts Department Routes */}
            <Route 
              path="/accounts-dept" 
              element={
                <ProtectedRoute allowedRoles={['Accounts Dept']}>
                  <AccountsDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect based on role */}
            <Route 
              path="/dashboard" 
              element={<RoleBasedRedirect />} 
            />
            
            {/* Catch-all route for handling direct URL access */}
            <Route 
              path="*" 
              element={<Navigate to="/login" replace />} 
            />
                      </Routes>
          </Router>
        </POProvider>
        </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to redirect users to their role-specific dashboard
function RoleBasedRedirect() {
  const { userRole } = useAuth();
  
  switch (userRole) {
    case 'Admin':
      return <Navigate to="/admin" replace />;
    case 'Purchase Team':
      return <Navigate to="/purchase-team" replace />;
    case 'Manager':
      return <Navigate to="/manager" replace />;
    case 'Vendor':
      return <Navigate to="/vendor" replace />;
    case 'Gate Security':
      return <Navigate to="/gate-security" replace />;
    case 'Sample Dept':
      return <Navigate to="/sample-dept" replace />;
    case 'QC Dept':
      return <Navigate to="/qc-dept" replace />;
    case 'Weighbridge Operator':
      return <Navigate to="/weighbridge" replace />;
    case 'Unloading Dept':
      return <Navigate to="/unloading-dept" replace />;
    case 'Accounts Dept':
      return <Navigate to="/accounts-dept" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
