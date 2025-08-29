# Quality Management System (QMS)

A comprehensive quality management system built with React and Firebase.

## System Overview

This QMS system provides role-based access control for different departments and functions within an organization. Users can only access the system through accounts created by administrators.

## User Management

### Admin-Only User Creation
- **Only administrators can create new user accounts**
- Users cannot self-register
- All user accounts are managed through the Admin Dashboard
- Each user is assigned a specific role with corresponding permissions

### Available Roles
- **Admin**: Full system access, user management
- **Purchase Team**: Purchase order management
- **Manager**: Operations oversight
- **Vendor**: Supplier portal access
- **Gate Security**: Entry/exit management
- **Sample Dept**: Sample collection and testing
- **QC Dept**: Quality control operations
- **Weighbridge Operator**: Weight measurement operations
- **Unloading Dept**: Material unloading management
- **Accounts Dept**: Financial operations

## Getting Started

### First Time Setup
1. **Create Admin Account**: Use the `/setup` route to create the first admin user
2. **Login as Admin**: Access the admin dashboard at `/admin`
3. **Create Users**: Use the Users Management section to create accounts for team members
4. **Assign Roles**: Each user should be assigned the appropriate role for their department

### User Login
- Users can only login with credentials provided by administrators
- No sample or demo accounts exist
- All accounts are created through the admin interface

## Features

### Admin Dashboard
- User management (create, edit, delete, activate/deactivate)
- Role assignment and management
- System monitoring and settings
- Purchase order oversight

### Department Dashboards
Each role has access to specific functionality:
- **Purchase Team**: Create and manage purchase orders
- **Manager**: View reports and manage operations
- **Vendor**: Submit and track orders
- **Security**: Manage entry/exit logs
- **Sample/QC**: Record test results and quality data
- **Weighbridge**: Record weight measurements
- **Unloading**: Track material unloading
- **Accounts**: Financial reporting and management

## Security

- Firebase Authentication for secure login
- Role-based access control
- Protected routes for each dashboard
- Admin-only user management
- No public registration

## Technology Stack

- **Frontend**: React with Material-UI
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context API
- **Routing**: React Router

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
cd Quality-system
npm install
```

### Running the Application
```bash
npm start
```

### Building for Production
```bash
npm run build
```

## File Structure

```
src/
├── components/          # React components for each dashboard
├── contexts/           # React context providers
├── utils/              # Utility functions
├── firebase.js         # Firebase configuration
└── App.js             # Main application component
```

## Support

For system administration and user management, contact your system administrator. All user accounts and access permissions are managed through the Admin Dashboard.
