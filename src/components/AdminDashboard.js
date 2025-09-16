// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GlobalPOSearch from './GlobalPOSearch';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Stack
} from '@mui/material';
import {
  People,
  ShoppingCart,
  Assessment,
  Add,
  Edit,
  Delete,
  Logout,
  Dashboard,
  Security,
  Settings,
  PersonAdd,
  Business,
  LocalShipping,
  Science,
  AccountBalance,
  Home,
  History
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  runTransaction,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

/**
 * AdminDashboard.jsx
 * Modernized admin dashboard with:
 * - AppBar (gradient)
 * - Tabs (Dashboard, User Management, Role Management, System Settings)
 * - Stats cards, recent users, PO quick actions
 * - User create/edit dialog integrated with Firebase Auth + Firestore
 * - Clean dialogs, subtle shadows, rounded corners, hover effects
 *
 * Note:
 * - Keep GlobalPOSearch (modal) as separate component and imported above.
 * - Adjust firebase import paths to your project structure as required.
 */

const AdminDashboard = () => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openGlobalPOSearch, setOpenGlobalPOSearch] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data state
  const [users, setUsers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // User dialog state
  const [editingUser, setEditingUser] = useState(null);
  const [updatePassword, setUpdatePassword] = useState('');
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'Purchase Team',
    isActive: true
  });

  // Roles metadata
  const roles = [
    { value: 'Admin', label: 'Admin', icon: <Security />, color: 'error' },
    { value: 'Purchase Team', label: 'Purchase Team', icon: <ShoppingCart />, color: 'primary' },
    { value: 'Manager', label: 'Manager', icon: <Assessment />, color: 'info' },
    { value: 'Vendor', label: 'Vendor', icon: <Business />, color: 'secondary' },
    { value: 'Gate Security', label: 'Gate Security', icon: <Security />, color: 'warning' },
    { value: 'Sample Dept', label: 'Sample Dept', icon: <Science />, color: 'success' },
    { value: 'QC Dept', label: 'QC Dept', icon: <Science />, color: 'info' },
    { value: 'Weighbridge Operator', label: 'Weighbridge Operator', icon: <LocalShipping />, color: 'primary' },
    { value: 'Unloading Dept', label: 'Unloading Dept', icon: <LocalShipping />, color: 'secondary' },
    { value: 'Accounts Dept', label: 'Accounts Dept', icon: <AccountBalance />, color: 'success' }
  ];

  useEffect(() => {
    // load all data initially
    fetchUsers();
    fetchPurchaseOrders();
    fetchActivityLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Firestore fetchers ----------
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
    } catch (err) {
      console.error('fetchUsers error', err);
      setErrorMessage('Failed to load users.');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const q = query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPurchaseOrders(data);
    } catch (err) {
      console.error('fetchPurchaseOrders error', err);
      setErrorMessage('Failed to load purchase orders.');
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivityLogs(data);
    } catch (err) {
      console.error('fetchActivityLogs', err);
      setErrorMessage('Failed to load activity logs.');
    }
  };

  // ---------- Auth / Navigation ----------
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('logout error', err);
      navigate('/login');
    }
  };

  // ---------- CRUD: Users ----------
  const handleAddUser = async () => {
    setErrorMessage('');
    if (!userForm.email || !userForm.password || !userForm.displayName) {
      setErrorMessage('Please fill required fields (name, email, password).');
      return;
    }
    if (userForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);
      const uid = userCredential.user.uid;

      // 2. Add basic profile to users collection
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: userForm.email,
        displayName: userForm.displayName,
        role: userForm.role,
        createdAt: new Date().toISOString(),
        isActive: userForm.isActive,
        createdBy: 'Admin'
      });

      // 3. Add role-specific doc with incremental ID inside roles/{role}/users
      const roleUsersRef = collection(db, 'roles', userForm.role, 'users');

      await runTransaction(db, async (transaction) => {
        const snapshot = await getDocs(roleUsersRef);
        const nextId = snapshot.size + 1;
        transaction.set(doc(roleUsersRef, uid), {
          uid,
          email: userForm.email,
          displayName: userForm.displayName,
          createdAt: new Date().toISOString(),
          isActive: userForm.isActive,
          id: nextId
        });
      });

      // UI updates
      setOpenUserDialog(false);
      setUserForm({ email: '', password: '', displayName: '', role: 'Purchase Team', isActive: true });
      setSuccessMessage(`User "${userForm.displayName}" created successfully.`);
      await auth.signOut(); // keep admin session separate if your app signs in the new user by default in your setup
      fetchUsers();
    } catch (err) {
      console.error('handleAddUser', err);
      setErrorMessage(err.message || 'Failed to create user.');
    }
  };

  const handleEditUser = async () => {
    setErrorMessage('');
    if (!editingUser) return;

    try {
      // Update user doc
      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: userForm.displayName,
        role: userForm.role,
        isActive: userForm.isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin'
      });

      // Password handling note:
      // Only the user can directly update their password through Auth in most flows.
      // For other users, you can implement a secure reset flow; here we optionally store a tempPassword
      if (updatePassword && updatePassword.length >= 6) {
        try {
          await updateDoc(doc(db, 'users', editingUser.id), {
            tempPassword: updatePassword,
            passwordUpdatedAt: new Date().toISOString(),
            passwordUpdatedBy: 'Admin'
          });
        } catch (pwErr) {
          console.warn('password store warning', pwErr);
        }
      }

      setSuccessMessage('User updated successfully.');
      setOpenUserDialog(false);
      setEditingUser(null);
      setUpdatePassword('');
      setUserForm({ email: '', password: '', displayName: '', role: 'Purchase Team', isActive: true });
      fetchUsers();
    } catch (err) {
      console.error('handleEditUser', err);
      setErrorMessage(err.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setSuccessMessage('User deleted.');
      fetchUsers();
    } catch (err) {
      console.error('handleDeleteUser', err);
      setErrorMessage(err.message || 'Failed to delete user.');
    }
  };

  // ---------- Dialog helpers ----------
  const openEditDialog = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive ?? true
    });
    setUpdatePassword('');
    setSuccessMessage('');
    setErrorMessage('');
    setOpenUserDialog(true);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      password: '',
      displayName: '',
      role: 'Purchase Team',
      isActive: true
    });
    setUpdatePassword('');
    setSuccessMessage('');
    setErrorMessage('');
    setOpenUserDialog(true);
  };

  // helper to get role icon/color
  const getRoleIcon = (roleValue) => {
    const r = roles.find((rr) => rr.value === roleValue);
    return r ? r.icon : <PersonAdd />;
  };

  const getRoleColor = (roleValue) => {
    const r = roles.find((rr) => rr.value === roleValue);
    return r ? r.color : 'default';
  };

  // ---------- Render sections ----------
  const renderStatsCards = () => {
    const stats = [
      { label: 'Total Users', count: users.length, icon: <People />, color: 'primary.main' },
      { label: 'Purchase Orders', count: purchaseOrders.length, icon: <ShoppingCart />, color: 'success.main' },
      { label: 'Activity Logs', count: activityLogs.length, icon: <History />, color: 'warning.main' },
      { label: 'Active Users', count: users.filter(u => u.isActive).length, icon: <People />, color: 'info.main' }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 40, color: s.color, mr: 2 } })}
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{s.count}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderQuickActions = () => (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
      <Typography variant="h6" gutterBottom>Quick Actions</Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={openAddDialog} sx={{ textTransform: 'none' }}>
          Add New User
        </Button>
        <Button variant="outlined" startIcon={<Settings />} onClick={() => setActiveTab(1)} sx={{ textTransform: 'none' }}>
          Manage Users
        </Button>
        <Button variant="outlined" startIcon={<ShoppingCart />} onClick={() => setOpenGlobalPOSearch(true)} sx={{ textTransform: 'none' }}>
          Search All POs
        </Button>
      </Stack>
    </Paper>
  );

  const renderRecentUsers = () => (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
      <Typography variant="h6" gutterBottom>Recent Users</Typography>
      <Grid container spacing={2}>
        {users.slice(0, 4).map(user => (
          <Grid item xs={12} sm={6} md={3} key={user.id}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.06)' },
                p: 1
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1 }}>{getRoleIcon(user.role)}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user.displayName}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user.email}</Typography>
                <Chip label={user.role} color={getRoleColor(user.role)} size="small" variant="outlined" />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderDashboardTab = () => (
    <Box>
      {renderStatsCards()}
      {renderQuickActions()}
      {renderRecentUsers()}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <List dense>
          {activityLogs.slice(0, 6).map(log => (
            <React.Fragment key={log.id}>
              <ListItem>
                <ListItemIcon><History /></ListItemIcon>
                <ListItemText
                  primary={log.action || log.details || 'Activity'}
                  secondary={`${log.userId ? `By: ${log.userId}` : ''} ${log.timestamp ? ` • ${new Date(log.timestamp).toLocaleString()}` : ''}`}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );

  const renderUserManagement = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Users Management</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog} sx={{ textTransform: 'none' }}>
            Add User
          </Button>
        </Box>

        <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f3f6fb' }}>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} hover sx={{ '&:hover': { backgroundColor: '#fbfcfe' } }}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip icon={getRoleIcon(user.role)} label={user.role} color={getRoleColor(user.role)} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={user.isActive ? 'Active' : 'Inactive'} color={user.isActive ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit User"><IconButton onClick={() => openEditDialog(user)} color="primary"><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete User"><IconButton onClick={() => handleDeleteUser(user.id)} color="error"><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Activity Logs</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f3f6fb' }}>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityLogs.map(log => (
                <TableRow key={log.id} hover>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderRoleManagement = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Role Management</Typography>
        <Grid container spacing={2}>
          {roles.map(role => (
            <Grid item xs={12} sm={6} md={4} key={role.value}>
              <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.04)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {React.cloneElement(role.icon, { sx: { mr: 1 } })}
                    <Typography variant="h6">{role.label}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Users with this role: {users.filter(u => u.role === role.value).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );

  const renderSystemSettings = () => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>System Settings</Typography>
      <List>
        <ListItem>
          <ListItemIcon><Security /></ListItemIcon>
          <ListItemText primary="Authentication Settings" secondary="Configure user authentication and security policies." />
          <Button variant="outlined" size="small">Configure</Button>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon><Settings /></ListItemIcon>
          <ListItemText primary="General Settings" secondary="Configure system-wide settings and preferences." />
          <Button variant="outlined" size="small">Configure</Button>
        </ListItem>
      </List>
    </Paper>
  );

  // ---------- Main render ----------
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* AppBar */}
      <AppBar
        position="static"
        elevation={6}
        sx={{
          background: 'linear-gradient(135deg,#1976d2 0%,#42a5f5 100%)'
        }}
      >
        <Toolbar>
          <Home sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            QMS Admin Dashboard
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Chip
              icon={<Security />}
              label={`Role: ${userRole || 'Admin'}`}
              color="secondary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
          </Box>

          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout} sx={{ textTransform: 'none' }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Page body */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
        <Paper sx={{ borderRadius: 3, boxShadow: '0 6px 20px rgba(0,0,0,0.04)', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, nv) => setActiveTab(nv)} variant="scrollable" scrollButtons="auto" aria-label="admin tabs">
            <Tab icon={<Dashboard />} label="Dashboard" />
            <Tab icon={<People />} label="User Management" />
            <Tab icon={<People />} label="Role Management" />
            <Tab icon={<Settings />} label="System Settings" />
          </Tabs>
        </Paper>

        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Tab content */}
        {activeTab === 0 && renderDashboardTab()}
        {activeTab === 1 && renderUserManagement()}
        {activeTab === 2 && renderRoleManagement()}
        {activeTab === 3 && renderSystemSettings()}

      </Container>

      {/* User Dialog */}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            background: 'linear-gradient(145deg,#ffffff,#fbfdff)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Display Name"
            value={userForm.displayName}
            onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            margin="normal"
            required
            disabled={!!editingUser}
          />
          {!editingUser && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              margin="normal"
              helperText="Minimum 6 characters"
              required
            />
          )}
          {editingUser && (
            <TextField
              fullWidth
              label="New Password (Optional)"
              type="password"
              value={updatePassword}
              onChange={(e) => setUpdatePassword(e.target.value)}
              margin="normal"
              helperText="Leave blank to keep current password (if you want to rotate securely, trigger password reset)"
            />
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              {roles.map(role => (
                <MenuItem key={role.value} value={role.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {role.icon}
                    <Typography sx={{ ml: 1 }}>{role.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })} />}
            label="Active User"
            sx={{ mt: 1 }}
          />

          {!editingUser && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The user will be able to login immediately after creation using the provided email and password.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => setOpenUserDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingUser ? handleEditUser : handleAddUser}
            disabled={editingUser ? (!userForm.displayName) : (!userForm.email || !userForm.password || !userForm.displayName)}
            sx={{ textTransform: 'none' }}
          >
            {editingUser ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global PO Search Modal (kept as external component) */}
      <GlobalPOSearch open={openGlobalPOSearch} onClose={() => setOpenGlobalPOSearch(false)} />
    </Box>
  );
};

export default AdminDashboard;
