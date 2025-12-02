# Authentication & Collaboration Features

## Overview

The Portfolio Management Tool now includes comprehensive authentication and multi-user collaboration features. Users can create accounts, log in securely, and collaborate on portfolios with other users.

## New Features

### 1. Authentication System

#### Login Page
- Modern, user-friendly login interface
- Email and password authentication
- Toggle between login and registration modes
- Password visibility controls
- Form validation with error messages
- Responsive design with gradient styling

#### User Registration
- Create new accounts with name, email, and password
- Password confirmation validation
- Minimum password length requirements
- Duplicate email detection
- Automatic login after registration

#### User Management
- Secure session management using localStorage
- Token-based authentication
- User profile display in header
- User menu dropdown with profile info and logout
- Persistent login across sessions

### 2. Multi-User Portfolios

Each user now has:
- **Separate Portfolio Data**: Investments are stored per user
- **User-Specific Storage**: Data is isolated using user IDs
- **Personalized Dashboard**: Header displays "{User's Name}'s Portfolio"

### 3. Collaboration Features

#### Portfolio Management
- **Create Multiple Portfolios**: Users can create and manage multiple portfolios
- **Portfolio Metadata**: Name, description, creation date, and update tracking
- **Public/Private Portfolios**: Toggle portfolio visibility
- **Portfolio Activities**: Comprehensive activity feed tracking all changes

#### Sharing & Permissions
- **Share Portfolios**: Share portfolios with other users
- **Permission Levels**:
  - **View**: Read-only access to portfolio
  - **Edit**: Can add/modify investments
  - **Admin**: Full control except ownership transfer
- **User Search**: Find users by email or name to share with
- **Access Management**: Add or remove user access at any time

#### Collaboration Panel
Access via the new "Collaborate" tab in the navigation:
- View all portfolios (owned and shared)
- Create new portfolios
- Share portfolios with other users
- Toggle portfolio visibility (public/private)
- View recent activity across all portfolios
- See who has access to each portfolio
- Manage shared user permissions

## Technical Implementation

### Architecture

#### Services Layer
1. **Authentication Service** (`src/services/auth.ts`)
   - Login/logout functionality
   - User registration
   - Token management
   - User profile updates
   - Password management
   - User search for collaboration

2. **Collaboration Service** (`src/services/collaboration.ts`)
   - Portfolio CRUD operations
   - Sharing and permission management
   - Investment management within portfolios
   - Activity tracking
   - Public portfolio discovery

#### Context & State Management
- **AuthContext** (`src/contexts/AuthContext.tsx`)
  - Global authentication state
  - User session management
  - Login/logout actions
  - User profile updates

#### Components
1. **Login Component** (`src/components/Login.tsx`)
   - Dual-mode login/registration form
   - Form validation
   - Error handling
   - Responsive design

2. **Collaboration Panel** (`src/components/CollaborationPanel.tsx`)
   - Portfolio grid view
   - Create portfolio modal
   - Share portfolio modal
   - Activity feed
   - User search and management

### Data Models

#### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}
```

#### Portfolio
```typescript
interface Portfolio {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  investments: Investment[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  sharedWith: SharedUser[];
  tags?: string[];
}
```

#### SharedUser
```typescript
interface SharedUser {
  userId: string;
  email: string;
  name: string;
  permission: 'view' | 'edit' | 'admin';
  addedAt: string;
}
```

#### PortfolioActivity
```typescript
interface PortfolioActivity {
  id: string;
  portfolioId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'shared' | 'investment_added' | 'investment_removed' | 'investment_updated';
  description: string;
  timestamp: string;
  changes?: any;
}
```

## Usage Guide

### Getting Started

1. **First Time Users**
   - Click "Sign up" on the login page
   - Enter your name, email, and password
   - Confirm your password
   - Click "Create Account"

2. **Returning Users**
   - Enter your email and password
   - Click "Sign In"

### Managing Portfolios

1. **Create a Portfolio**
   - Navigate to the "Collaborate" tab
   - Click "Create Portfolio"
   - Enter portfolio name and description
   - Click "Create Portfolio"

2. **Share a Portfolio**
   - Go to the "Collaborate" tab
   - Find your portfolio
   - Click "Share"
   - Search for users by email or name
   - Select permission level (View/Edit/Admin)
   - Click "Share" next to the user

3. **Make Portfolio Public/Private**
   - Go to the "Collaborate" tab
   - Find your portfolio
   - Click "Make Public" or "Make Private"

4. **Remove User Access**
   - Go to the "Collaborate" tab
   - Click "Share" on your portfolio
   - Click the X button next to the user you want to remove

### User Account Management

1. **View Profile**
   - Click your name in the header
   - View your email and account info

2. **Logout**
   - Click your name in the header
   - Click "Log Out"
   - Confirm logout

## Security Notes

### Current Implementation
⚠️ **Development Mode**: The current implementation uses localStorage for data storage and client-side authentication. This is suitable for:
- Development and testing
- Demonstration purposes
- Learning and prototyping

### Production Considerations
For production deployment, you should implement:
- **Server-side authentication** with secure password hashing (bcrypt)
- **JWT tokens** with proper expiration and refresh mechanisms
- **HTTPS** for all communications
- **Database storage** (PostgreSQL, MongoDB, etc.)
- **API endpoints** for all data operations
- **CORS** and security headers
- **Rate limiting** and abuse prevention
- **Password reset** functionality
- **Email verification**
- **OAuth integration** (Google, GitHub, etc.)

## Storage

### LocalStorage Keys
- `portfolio_user` - Current user session
- `portfolio_token` - Authentication token
- `portfolio_users_db` - User database (demo only)
- `portfolio_portfolios` - Portfolio data
- `portfolio_activities` - Activity feed
- `investments_{userId}` - User-specific investments

### Data Persistence
- All data persists across browser sessions
- Each user's data is isolated by user ID
- Clearing browser data will reset the application

## Future Enhancements

Potential improvements for the collaboration system:
- Real-time synchronization using WebSockets
- Portfolio comments and discussions
- Version history and rollback
- Portfolio templates and cloning
- Team workspaces
- Advanced analytics on shared portfolios
- Email notifications for shared activity
- Portfolio export/import functionality
- Mobile app integration
- Two-factor authentication (2FA)

## Troubleshooting

### Can't Login
- Verify email and password are correct
- Check browser console for errors
- Try clearing browser cache and localStorage
- Create a new account if needed

### Lost Access to Portfolio
- Contact the portfolio owner
- Check if you've been removed from shared users
- Verify you're logged into the correct account

### Data Not Saving
- Check browser console for errors
- Verify localStorage is enabled in your browser
- Check available storage space
- Try refreshing the page

## Development

### Running Locally
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
npm run preview
```

### Testing Authentication
1. Create multiple user accounts
2. Test login/logout flows
3. Create and share portfolios between users
4. Test different permission levels
5. Verify data isolation between users

## Support

For issues or questions:
1. Check the browser console for errors
2. Review this documentation
3. Check the component code for implementation details
4. Open an issue in the repository

---

**Note**: This is a demonstration system. For production use, implement proper backend authentication and security measures.
