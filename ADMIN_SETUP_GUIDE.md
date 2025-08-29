# Admin Setup Guide

## Initial System Setup

### 1. First Admin Account
- Navigate to `/setup` in your browser
- Create the first admin user account
- This account will have full system access

### 2. Login as Admin
- Go to `/admin` and login with your admin credentials
- You'll see the Admin Dashboard with full system control

### 3. Create User Accounts
- Go to **Users Management** section
- Click **"Add User"** button
- Fill in the user details:
  - **Email**: User's email address
  - **Password**: Temporary password (user should change this)
  - **Display Name**: User's full name
  - **Role**: Select appropriate role from dropdown
  - **Active**: Check to enable the account

### 4. Available Roles
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

### 5. User Management
- **Edit Users**: Click edit icon to modify user details
- **Deactivate Users**: Uncheck "Active" to disable accounts
- **Delete Users**: Remove accounts (use with caution)
- **Change Passwords**: Update user passwords as needed

## Security Best Practices

1. **Strong Passwords**: Use complex passwords for admin accounts
2. **Role Assignment**: Only assign roles that users actually need
3. **Account Monitoring**: Regularly review active user accounts
4. **Password Policy**: Encourage users to change default passwords
5. **Access Control**: Deactivate accounts for users who leave the organization

## System Maintenance

- **Regular Backups**: Ensure Firestore data is backed up
- **User Audits**: Periodically review user access and roles
- **Security Updates**: Keep Firebase and dependencies updated
- **Activity Monitoring**: Review system logs for unusual activity

## Support

For technical issues or system administration questions, refer to the Firebase console and documentation.
