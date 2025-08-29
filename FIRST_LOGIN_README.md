# QMS First Login Admin System

## Overview

The Quality Management System (QMS) automatically handles the creation of the first admin user when the system is first deployed. This ensures that there's always an administrator to manage the system without requiring manual setup.

## How It Works

### 1. First Login Detection
- When a user attempts to log in, the system checks if any users exist in the database
- If no users exist, the system automatically treats this as the first login

### 2. Automatic Admin Creation
- The first email/password combination used will automatically become the admin user
- The user is automatically assigned the "Admin" role
- A user document is created in Firestore with admin privileges

### 3. Normal Login Flow
- After the first admin user is created, normal login authentication resumes
- Subsequent users must be created through the admin dashboard or registration process

## User Experience

### For First-Time Users
1. Navigate to the login page
2. Enter any email and password combination
3. The system will automatically create an admin account
4. You'll be redirected to the admin dashboard

### For Existing Users
1. Use your registered email and password
2. Normal authentication flow applies
3. You'll be redirected to your role-specific dashboard

## System Status

You can check the current system status by visiting `/setup` or clicking the "Check System Status" link on the login page. This will show you:

- Whether an admin user already exists
- Current system configuration status
- Instructions for first-time setup

## Security Features

- Only the first login creates an admin user automatically
- Subsequent login attempts follow normal authentication
- Admin users can manage other user accounts through the admin dashboard
- User roles and permissions are enforced throughout the system

## Technical Implementation

The system uses:
- Firebase Authentication for user management
- Firestore for user data storage
- Automatic role detection and assignment
- Context-based authentication state management

## Troubleshooting

If you encounter issues with the first login:

1. Check the browser console for error messages
2. Verify Firebase configuration is correct
3. Ensure Firestore rules allow user creation
4. Visit the setup page to check system status

## Next Steps

After creating your admin account:
1. Access the admin dashboard
2. Create additional user accounts as needed
3. Configure system settings
4. Set up user roles and permissions
