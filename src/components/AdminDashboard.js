import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePO } from '../contexts/POContext';
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
  ListItemIcon
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
  Home
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { runTransaction } from 'firebase/firestore';


const AdminDashboard = () => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatePassword, setUpdatePassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openGlobalPOSearch, setOpenGlobalPOSearch] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'Purchase Team',
    isActive: true
  });

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
    fetchUsers();
    fetchPurchaseOrders();
    fetchActivityLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'purchaseOrders'));
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchaseOrders(poData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'activityLogs'));
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

const handleAddUser = async () => {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);

    // 2. Add user to global users collection
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userForm.email,
      displayName: userForm.displayName,
      role: userForm.role,
      createdAt: new Date().toISOString(),
      isActive: userForm.isActive,
      createdBy: 'Admin'
    });

    // 3. Add user to roles/{role}/users/{uid} with incremental id
    const roleUsersRef = collection(db, 'roles', userForm.role, 'users');
    await runTransaction(db, async (transaction) => {
      const snapshot = await getDocs(roleUsersRef);
      const nextId = snapshot.size + 1; // Incremental id for this role

      transaction.set(doc(roleUsersRef, userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userForm.email,
        displayName: userForm.displayName,
        createdAt: new Date().toISOString(),
        isActive: userForm.isActive,
        id: nextId // role-specific id
      });
    });

    setOpenUserDialog(false);
    setUserForm({ email: '', password: '', displayName: '', role: 'Purchase Team', isActive: true });
    fetchUsers();
    setSuccessMessage(`User "${userForm.displayName}" created successfully! They can now login with email: ${userForm.email}`);
    await auth.signOut();
  } catch (error) {
    console.error('Error adding user:', error);
    alert(`Error creating user: ${error.message}`);
  }
};


  const handleEditUser = async () => {
    try {
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: userForm.displayName,
        role: userForm.role,
        isActive: userForm.isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin'
      });

      // Update password if provided
      if (updatePassword && updatePassword.length >= 6) {
        try {
          // Get the user from Firebase Auth to update password
          const user = auth.currentUser;
          if (user && user.email === editingUser.email) {
            // If we're editing the current user, update their password
            await user.updatePassword(updatePassword);
          } else {
            // For other users, we need to re-authenticate them with a temporary password
            // This is a limitation of Firebase - only the user themselves can change their password
            // We'll store the new password in Firestore and they can use it on next login
            await updateDoc(doc(db, 'users', editingUser.id), {
              tempPassword: updatePassword,
              passwordUpdatedAt: new Date().toISOString(),
              passwordUpdatedBy: 'Admin'
            });
          }
        } catch (passwordError) {
          console.error('Error updating password:', passwordError);
          // Continue with user update even if password update fails
        }
      }

      setOpenUserDialog(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', displayName: '', role: 'Purchase Team', isActive: true });
      setUpdatePassword('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Error updating user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Error deleting user: ${error.message}`);
      }
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '', // Don't show password in edit mode
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive
    });
    setUpdatePassword(''); // Reset update password field
    setSuccessMessage(''); // Clear success message
    setOpenUserDialog(true);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setUserForm({ email: '', password: '', displayName: '', role: 'Purchase Team', isActive: true });
    setUpdatePassword(''); // Reset update password field
    setSuccessMessage(''); // Clear success message
    setOpenUserDialog(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
  };

  const getRoleIcon = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.icon : <PersonAdd />;
  };

  const getRoleColor = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.color : 'default';
  };

  const renderDashboard = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{purchaseOrders.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Purchase Orders</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{activityLogs.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Activity Logs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{users.filter(u => u.isActive).length}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={openAddDialog}
            >
              Add New User
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setActiveTab(1)}
            >
              Manage Users
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => setOpenGlobalPOSearch(true)}
            >
              Search All POs
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Users */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Users</Typography>
        <Grid container spacing={2}>
          {users.slice(0, 4).map((user) => (
            <Grid item xs={12} sm={6} md={3} key={user.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getRoleIcon(user.role)}
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      {user.displayName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {user.email}
                  </Typography>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );

  const renderUserManagement = () => (
    <Box>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      
      {users.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>No users found.</strong> Start by creating user accounts for your team members. 
            Each user will be assigned a specific role that determines their access to different parts of the system.
          </Typography>
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Users Management</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddDialog}
          >
            Add User
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={user.role}
                      color={getRoleColor(user.role)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditDialog(user)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUser(user.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Role Management</Typography>
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role.value}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {role.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {role.label}
                    </Typography>
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
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>System Settings</Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Authentication Settings"
              secondary="Configure user authentication and security policies"
            />
            <Button variant="outlined" size="small">
              Configure
            </Button>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText
              primary="General Settings"
              secondary="Configure system-wide settings and preferences"
            />
            <Button variant="outlined" size="small">
              Configure
            </Button>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Home sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            QMS Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Chip
              icon={<Security />}
              label={`Admin: ${userRole}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<Dashboard />} label="Dashboard" />
            <Tab icon={<People />} label="User Management" />
            <Tab icon={<People />} label="Role Management" />
            <Tab icon={<Settings />} label="System Settings" />
          </Tabs>
        </Paper>

        {/* Success Message */}
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        )}

        {/* Tab Content */}
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderUserManagement()}
        {activeTab === 2 && renderRoleManagement()}
        {activeTab === 3 && renderSystemSettings()}

        {/* User Dialog */}
        <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
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
              disabled={!!editingUser} // Disable email editing
            />
            {!editingUser && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                margin="normal"
                required
                helperText="Minimum 6 characters required"
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
                helperText="Leave blank to keep current password. Minimum 6 characters if updating."
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={userForm.role}
                label="Role"
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                {roles.map((role) => (
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
              control={
                <Switch
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                />
              }
              label="Active User"
              sx={{ mt: 2 }}
            />
            
            {!editingUser && (
              <Alert severity="info" sx={{ mt: 2 }}>
                The user will be able to login immediately after creation using their email and password.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
            <Button 
              onClick={editingUser ? handleEditUser : handleAddUser}
              variant="contained"
              disabled={
                editingUser 
                  ? (!userForm.displayName) 
                  : (!userForm.email || !userForm.password || !userForm.displayName)
              }
            >
              {editingUser ? 'Update' : 'Add'}
            </Button>
                  </DialogActions>
      </Dialog>

      {/* Global PO Search */}
      <GlobalPOSearch 
        open={openGlobalPOSearch} 
        onClose={() => setOpenGlobalPOSearch(false)} 
      />
    </Container>
  </Box>
);
};

export default AdminDashboard;
