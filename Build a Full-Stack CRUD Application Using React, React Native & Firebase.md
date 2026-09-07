# Build a Full-Stack CRUD Application Using React, React Native & Firebase

## Project Overview

Build a production-ready CRUD application with:

1. React.js web application
2. React Native mobile application
3. Firebase as the complete backend
4. Shared Firebase Authentication between web and mobile
5. Shared Cloud Firestore database between web and mobile
6. Firebase Storage for file/image uploads
7. Firebase Security Rules for authorization and data protection
8. Firebase Cloud Functions where backend/server-side logic is required

The web and mobile applications must use the **same Firebase project and the same Firestore database**.

The architecture should be scalable so that additional modules/features can be added later.

---

# 1. Technology Stack

## Web

Use:

- React.js
- Vite
- JavaScript or TypeScript
- React Router
- Firebase Web SDK
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting

Prefer TypeScript if starting the project from scratch.

## Mobile

Use:

- React Native
- Expo if appropriate
- TypeScript
- React Navigation
- Firebase SDK / React Native Firebase where appropriate
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

The mobile app must communicate with the same Firebase project/database used by the React web application.

## Backend

Use Firebase:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions
- Firebase Security Rules

Do not create a separate traditional Node/Express backend unless there is a specific Firebase limitation requiring it.

---

# 2. Project Structure

Create a monorepo structure:

```text
crud-app/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── routes/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── firebase/
│   │   │   ├── context/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── constants/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile/
│       ├── src/
│       │   ├── components/
│       │   ├── screens/
│       │   ├── navigation/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── firebase/
│       │   ├── context/
│       │   ├── utils/
│       │   ├── types/
│       │   └── constants/
│       └── package.json
│
├── functions/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── records/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
│
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
│
├── firebase.json
├── firestore.rules
├── storage.rules
├── package.json
└── README.md
```

Keep the architecture modular.

Do not put all Firebase logic directly inside React components.

---

# 3. Firebase Project

Create/use one Firebase project.

Example:

```text
crud-app-production
```

Both applications must use the same Firebase configuration:

```text
Web
↓
Firebase
├── Authentication
├── Firestore
├── Storage
└── Cloud Functions

Mobile
↓
Firebase
├── Authentication
├── Firestore
├── Storage
└── Cloud Functions
```

Do NOT create separate databases for web and mobile.

---

# 4. Authentication

Implement Firebase Authentication.

Support:

- Email/password registration
- Email/password login
- Logout
- Forgot password
- Reset password
- Auth state persistence
- Account deactivation
- Account reactivation where appropriate
- User profile

Create an authentication context/provider.

Example:

```text
AuthProvider
├── user
├── loading
├── login()
├── register()
├── logout()
├── resetPassword()
└── refreshUser()
```

---

# 5. User Registration

Create a registration form.

Fields:

```text
First Name
Last Name
Email
Password
Confirm Password
```

Validation:

- First name required
- Last name required
- Valid email
- Password required
- Minimum password length
- Password confirmation must match
- Prevent duplicate accounts through Firebase Authentication
- Display useful validation messages

After registration:

1. Create Firebase Authentication account
2. Create user document in Firestore
3. Store user profile information
4. Assign default role:
   `user`
5. Set account status:
   `active`

Firestore structure:

```text
users/{uid}
```

Example document:

```json
{
  "uid": "firebase-auth-uid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "user",
  "status": "active",
  "photoURL": null,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "lastLoginAt": "server timestamp"
}
```

Never store the user's password in Firestore.

---

# 6. Login

Create a login screen.

Fields:

```text
Email
Password
```

Include:

```text
Remember me
Forgot password?
Login
Create account
```

After login:

1. Authenticate using Firebase Authentication
2. Retrieve the user's Firestore profile
3. Check account status
4. If status is `inactive`, prevent access
5. If status is `active`, allow access
6. Update `lastLoginAt`

Important:

Do not rely only on frontend checks for authorization.

Use Firebase Security Rules and/or Cloud Functions for secure authorization.

---

# 7. Account Deactivation

Implement user account deactivation.

Users should be able to deactivate their own account.

Admin users should be able to deactivate other users.

Firestore:

```text
users/{uid}
```

Update:

```json
{
  "status": "inactive",
  "deactivatedAt": "server timestamp"
}
```

When an inactive user attempts to log in:

```text
Your account has been deactivated.
Please contact an administrator.
```

Do not delete the Firebase Authentication account automatically when the user is deactivated.

The purpose of deactivation is to preserve the user's data while preventing access.

---

# 8. Admin Role

Create two roles:

```text
admin
user
```

Default registration role:

```text
user
```

Only an administrator can change another user's role.

Do not allow normal users to change their own role.

Use Firebase Security Rules and/or Firebase Custom Claims for admin authorization.

Admin users should have access to:

```text
Dashboard
Users
Records
Profile
Settings
```

Normal users:

```text
Dashboard
My Records
Profile
```

---

# 9. User Management

Create an Admin Users page.

Display:

```text
Name
Email
Role
Status
Created Date
Last Login
Actions
```

Actions:

```text
View
Edit
Activate
Deactivate
```

Add:

- Search
- Filter by status
- Filter by role
- Pagination or Firestore pagination
- Confirmation modal before deactivation
- Loading state
- Empty state
- Error state

Admin should be able to:

- View user
- Edit user profile
- Change role
- Activate user
- Deactivate user

Normal users must not have access to this screen.

---

# 10. CRUD Module

Create a generic CRUD module named:

```text
Records
```

Each authenticated user can create records.

Firestore:

```text
records/{recordId}
```

Example:

```json
{
  "id": "record-id",
  "userId": "owner-user-id",
  "title": "Example Record",
  "description": "Example description",
  "status": "active",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

Fields:

```text
Title
Description
Status
```

Status options:

```text
active
inactive
```

---

# 11. CRUD Operations

Implement:

## Create

Authenticated user can create a record.

## Read

User can view their own records.

Admin can view all records.

## Update

User can update their own records.

Admin can update any record.

## Delete

Use soft delete rather than immediately deleting data.

Example:

```json
{
  "deleted": true,
  "deletedAt": "server timestamp"
}
```

By default, deleted records should not appear in normal lists.

---

# 12. Firestore Security Rules

Create secure Firestore rules.

Requirements:

### Authentication

Unauthenticated users cannot access protected data.

### Users

A user can read/update their own profile.

A normal user cannot:

- Change their own role
- Change another user's profile
- Change account status of another user

Admin can manage users.

### Records

Authenticated users can:

- Create records owned by themselves
- Read their own records
- Update their own records
- Soft delete their own records

Admin can manage all records.

Use:

```text
request.auth.uid
```

for ownership validation.

Do not trust a client-provided `userId`.

---

# 13. Firebase Storage

Add Firebase Storage support.

Initially use it for profile images.

Profile image path:

```text
users/{uid}/profile/avatar.jpg
```

Requirements:

- Authenticated users can upload their own profile image
- Users cannot upload to another user's directory
- Validate file type
- Validate file size
- Delete/replace old profile image when required

Allowed types:

```text
image/jpeg
image/png
image/webp
```

---

# 14. Web Application Pages

Create these pages:

```text
/login
/register
/forgot-password

/dashboard

/profile

/records
/records/create
/records/:id
/records/:id/edit

/admin/users
/admin/users/:id
```

Unauthorized users should automatically redirect to:

```text
/login
```

Authenticated users should not be able to access login/register pages unless they explicitly log out.

---

# 15. Web Dashboard

Create a clean modern dashboard.

Display:

```text
Welcome, {firstName}

Total Records
Active Records
Inactive Records
```

Admin additionally sees:

```text
Total Users
Active Users
Inactive Users
Total Records
```

Use reusable statistic cards.

---

# 16. Web Layout

Create:

```text
Sidebar
Header
Main Content
```

Sidebar:

```text
Dashboard
Records
Profile

Admin
  Users
  All Records

Logout
```

Make the layout responsive.

Desktop:

```text
Sidebar + Main Content
```

Tablet:

```text
Collapsible Sidebar
```

Mobile:

```text
Top Header
Mobile Navigation / Drawer
```

---

# 17. Records UI

Create a records listing page.

Desktop table:

```text
Title
Description
Status
Created
Updated
Actions
```

Actions:

```text
View
Edit
Delete
```

Mobile:

Use responsive cards instead of forcing a large table.

Include:

- Search
- Status filter
- Sort
- Pagination
- Empty state
- Loading state
- Error state

---

# 18. Forms

Create reusable form components.

Example:

```text
Input
PasswordInput
Textarea
Select
FileUpload
Button
FormError
```

Use proper client-side validation.

Do not duplicate validation logic unnecessarily.

---

# 19. Mobile Application

Create a React Native application connected to the same Firebase project.

Screens:

```text
Splash
Login
Register
Forgot Password

Dashboard

Records
Create Record
Record Details
Edit Record

Profile
Settings
```

Admin screens:

```text
Admin Dashboard
Users
User Details
All Records
```

Use role-based navigation.

---

# 20. Mobile Navigation

Use React Navigation.

Structure:

```text
RootNavigator
│
├── AuthStack
│   ├── Login
│   ├── Register
│   └── ForgotPassword
│
└── AppStack
    ├── Dashboard
    ├── Records
    ├── Profile
    └── Admin
```

Admin screens should only be accessible to admin users.

---

# 21. Shared Firebase Services

Create reusable Firebase service functions.

Example:

```text
services/
├── authService.ts
├── userService.ts
├── recordService.ts
├── storageService.ts
└── adminService.ts
```

Example functions:

```ts
registerUser()
loginUser()
logoutUser()
resetPassword()

getUserProfile()
updateUserProfile()
deactivateUser()
activateUser()

createRecord()
getRecords()
getRecord()
updateRecord()
deleteRecord()

uploadProfileImage()
```

The business logic should not be duplicated unnecessarily between web and mobile.

Where practical, create a shared package:

```text
packages/
└── shared/
    ├── types/
    ├── validation/
    ├── constants/
    └── services/
```

---

# 22. Environment Variables

Never hardcode sensitive configuration directly in source files.

Use environment variables.

Web:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Mobile should use the appropriate Expo/environment configuration.

Important:

Firebase client configuration values are not treated as server secrets. Security must come from Firebase Authentication, Security Rules, App Check where appropriate, and server-side functions.

Never expose:

```text
Firebase Admin SDK private key
Service account credentials
```

in the client.

---

# 23. Firebase Cloud Functions

Use Cloud Functions for operations that must not be trusted to the client.

Examples:

```text
Set admin custom claims
Deactivate Firebase Auth users when required
Admin-only account management
Sensitive server-side operations
Audit logging
```

Create functions using TypeScript.

Example:

```text
functions/src/
├── auth/
├── users/
├── records/
├── admin/
└── index.ts
```

---

# 24. Audit Log

Create an audit log system.

Firestore:

```text
auditLogs/{logId}
```

Example:

```json
{
  "action": "USER_DEACTIVATED",
  "performedBy": "admin-uid",
  "targetUser": "user-uid",
  "createdAt": "server timestamp"
}
```

Track important admin actions:

```text
USER_CREATED
USER_UPDATED
USER_ACTIVATED
USER_DEACTIVATED
ROLE_CHANGED
RECORD_CREATED
RECORD_UPDATED
RECORD_DELETED
```

---

# 25. Error Handling

Create centralized error handling.

Convert Firebase errors into user-friendly messages.

For example:

```text
auth/invalid-credential
→ Invalid email or password.

auth/email-already-in-use
→ An account already exists with this email.

auth/too-many-requests
→ Too many attempts. Please try again later.
```

Never expose raw Firebase/internal errors directly to users.

---

# 26. Loading States

Every asynchronous operation must have a loading state.

Examples:

```text
Login...
Creating account...
Saving...
Updating...
Deleting...
Uploading...
Loading users...
Loading records...
```

Prevent duplicate submissions while an operation is running.

---

# 27. Confirmation Modals

For destructive actions use confirmation dialogs.

Example:

```text
Deactivate User

Are you sure you want to deactivate John Doe?

The user will no longer be able to access the application.

[Cancel] [Deactivate]
```

For record deletion:

```text
Delete Record

Are you sure you want to delete this record?

[Cancel] [Delete]
```

---

# 28. Security Requirements

Follow these rules strictly.

1. Never store passwords in Firestore.
2. Never trust role values supplied by the client.
3. Never trust client-provided ownership IDs.
4. Validate ownership using `request.auth.uid`.
5. Protect Firestore using Security Rules.
6. Protect Storage using Storage Rules.
7. Use Firebase Authentication.
8. Use admin custom claims where appropriate.
9. Do not expose Firebase Admin credentials.
10. Validate all user input.
11. Use soft delete for records.
12. Prevent inactive users from accessing protected application data.
13. Use server timestamps.
14. Do not use insecure wildcard rules such as:

```text
allow read, write: if true;
```

15. Never deploy insecure rules to production.

---

# 29. Firestore Data Structure

Use:

```text
users
  └── {uid}

records
  └── {recordId}

auditLogs
  └── {logId}
```

Users:

```json
{
  "uid": "",
  "firstName": "",
  "lastName": "",
  "email": "",
  "role": "user",
  "status": "active",
  "photoURL": null,
  "createdAt": null,
  "updatedAt": null,
  "lastLoginAt": null
}
```

Records:

```json
{
  "id": "",
  "userId": "",
  "title": "",
  "description": "",
  "status": "active",
  "deleted": false,
  "createdAt": null,
  "updatedAt": null
}
```

---

# 30. UI Design

Create a professional SaaS-style interface.

Requirements:

- Clean typography
- Good spacing
- Responsive layout
- Accessible forms
- Clear buttons
- Toast notifications
- Confirmation dialogs
- Skeleton/loading states
- Empty states
- Error states
- Mobile-friendly interface

Do not overdesign the application.

Focus on:

```text
Clean
Fast
Responsive
Accessible
Maintainable
Scalable
```

---

# 31. Toast Notifications

Implement a global notification system.

Examples:

```text
Account created successfully.
Login successful.
Record created successfully.
Record updated successfully.
Record deleted successfully.
User deactivated successfully.
User activated successfully.
Profile updated successfully.
```

Errors:

```text
Unable to save record.
Unable to load users.
Unable to update profile.
```

---

# 32. Protected Routes

Implement authentication guards.

Example:

```tsx
<ProtectedRoute>
    <Dashboard />
</ProtectedRoute>
```

Admin:

```tsx
<AdminRoute>
    <AdminUsers />
</AdminRoute>
```

Rules:

```text
Not authenticated
→ Login

Authenticated + active
→ Application

Authenticated + inactive
→ Account Deactivated

Authenticated + non-admin
→ No access to admin routes
```

---

# 33. Account Deactivation Flow

Implement this carefully.

### User deactivation

User clicks:

```text
Deactivate My Account
```

Show confirmation.

After confirmation:

```text
users/{uid}
status = inactive
```

Then sign the user out.

### Admin deactivation

Admin opens Users.

Clicks:

```text
Deactivate
```

Confirmation modal.

Cloud Function/server-side logic should perform any privileged Firebase Authentication operation that is required.

The user should immediately lose access to protected application functionality.

---

# 34. Account Reactivation

Admin can reactivate a user.

Update:

```text
status = active
```

Log:

```text
USER_ACTIVATED
```

The user can then log in again.

---

# 35. Testing

Create tests for:

### Authentication

- Register
- Login
- Logout
- Forgot password
- Invalid login
- Duplicate email
- Deactivated account

### Users

- Admin can view users
- Admin can deactivate users
- Admin can activate users
- Admin can change roles
- User cannot access admin functionality

### Records

- Create
- Read
- Update
- Soft delete
- Ownership restrictions
- Admin access

### Security

Test Firestore Security Rules with:

```text
Unauthenticated user
Normal user
Admin user
User A
User B
Inactive user
```

---

# 36. Firebase Emulator Suite

Use Firebase Emulator Suite during development.

Configure:

```text
Authentication Emulator
Firestore Emulator
Storage Emulator
Functions Emulator
```

Do not repeatedly test destructive operations against production Firebase data during development.

Provide scripts such as:

```bash
npm run dev
npm run firebase:emulators
npm run test
npm run build
npm run deploy
```

---

# 37. Firebase Deployment

Configure Firebase Hosting for the React web application.

Build:

```bash
npm run build
```

Deploy:

```bash
firebase deploy
```

Configure SPA rewrites so React Router works correctly.

Example concept:

```text
/* → /index.html
```

Do not deploy development configuration to production.

---

# 38. Mobile Build

Prepare the React Native application for:

```text
Android
iOS
```

Configure environment-specific Firebase projects if needed later.

For the initial development version, use the same Firebase development project.

Prepare the application so production/staging Firebase projects can easily be introduced later.

---

# 39. Development Environments

Prepare:

```text
development
staging
production
```

For now, implement:

```text
development
```

with a structure that allows staging and production to be added later without rewriting the application.

---

# 40. Code Quality

Follow these principles:

- TypeScript strict mode
- Reusable components
- Reusable hooks
- Separation of UI and business logic
- Centralized Firebase configuration
- Centralized error handling
- Strong typing
- No duplicated Firebase logic
- No unnecessary global state
- Clean naming conventions
- Small focused components
- Avoid huge components
- Avoid hardcoded strings where constants are appropriate

Do not use `any` unless absolutely necessary.

---

# 41. README

Create a complete README containing:

## Requirements

```text
Node.js
npm
Firebase CLI
Expo CLI if required
```

## Installation

Explain:

```bash
npm install
```

## Firebase setup

Explain:

1. Create Firebase project
2. Enable Authentication
3. Enable Email/Password provider
4. Create Firestore database
5. Create Storage bucket
6. Configure Firebase web app
7. Configure mobile Firebase app
8. Configure environment variables
9. Deploy Security Rules
10. Deploy Cloud Functions
11. Deploy Firebase Hosting

## Development

Explain how to run:

```bash
npm run dev
```

and Firebase emulators.

## Deployment

Explain:

```bash
npm run build
firebase deploy
```

---

# 42. Cursor Development Process

Do NOT generate the entire application blindly in one step.

Work in phases.

## Phase 1 — Project Setup

Create:

```text
Monorepo
React web
React Native mobile
Firebase configuration
TypeScript
ESLint
Prettier
```

Stop and verify the project builds.

## Phase 2 — Firebase

Configure:

```text
Authentication
Firestore
Storage
Functions
Security Rules
Emulators
```

Stop and verify Firebase connectivity.

## Phase 3 — Authentication

Implement:

```text
Register
Login
Logout
Forgot Password
Auth Provider
Protected Routes
```

Test completely.

## Phase 4 — User Management

Implement:

```text
User profile
Admin users
Roles
Activation
Deactivation
```

Test Security Rules.

## Phase 5 — CRUD

Implement:

```text
Create
Read
Update
Soft Delete
Search
Filter
```

## Phase 6 — Web UI

Complete responsive web interface.

## Phase 7 — Mobile

Implement equivalent mobile functionality using the same Firebase backend.

## Phase 8 — Security

Review:

```text
Firestore Rules
Storage Rules
Authentication
Role authorization
Ownership
Inactive accounts
```

## Phase 9 — Testing

Test web and mobile against Firebase Emulator Suite.

## Phase 10 — Deployment

Deploy web application to Firebase Hosting.

Prepare mobile Android/iOS builds.

---

# 43. Important Cursor Instructions

Before writing code:

1. Inspect the existing project.
2. Determine whether the project is empty or already contains code.
3. Do not overwrite existing functionality without understanding it.
4. Create a clear implementation plan.
5. Work incrementally.
6. After every major phase, run/build/test the application.
7. Fix errors before moving to the next phase.
8. Do not leave placeholder code pretending functionality is complete.
9. Do not use mock Firebase services once the real Firebase integration is implemented.
10. Keep the web and mobile data models synchronized.
11. Use shared TypeScript types where possible.
12. Keep Firebase logic outside UI components.
13. Implement proper loading/error/empty states.
14. Implement security rules before considering the feature complete.

---

# 44. Final Acceptance Criteria

The application is considered complete when:

### Authentication

- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] User can reset password
- [ ] Duplicate registration is handled
- [ ] Inactive users cannot access the application

### User Management

- [ ] User profile exists in Firestore
- [ ] Admin role exists
- [ ] Normal user role exists
- [ ] Admin can view users
- [ ] Admin can activate users
- [ ] Admin can deactivate users
- [ ] Admin can change roles
- [ ] Normal users cannot perform admin actions

### CRUD

- [ ] User can create records
- [ ] User can view own records
- [ ] User can edit own records
- [ ] User can soft-delete own records
- [ ] Admin can view all records
- [ ] Admin can manage records
- [ ] Search works
- [ ] Filtering works

### Firebase

- [ ] Authentication configured
- [ ] Firestore configured
- [ ] Storage configured
- [ ] Cloud Functions configured
- [ ] Firestore Security Rules configured
- [ ] Storage Security Rules configured
- [ ] Firebase Emulator Suite configured
- [ ] Firebase Hosting configured

### Web

- [ ] React application works
- [ ] Responsive desktop UI
- [ ] Responsive mobile UI
- [ ] Protected routes
- [ ] Admin routes
- [ ] Error handling
- [ ] Loading states

### Mobile

- [ ] React Native application works
- [ ] Login/register works
- [ ] Same Firebase Authentication
- [ ] Same Firestore database
- [ ] CRUD works
- [ ] Profile works
- [ ] Admin functionality works

### Security

- [ ] No passwords stored in Firestore
- [ ] No Firebase Admin credentials in frontend
- [ ] Firestore rules tested
- [ ] Storage rules tested
- [ ] Role authorization implemented
- [ ] Record ownership enforced
- [ ] Inactive account handling implemented

---

# Start Now

Start with **Phase 1 only**.

First inspect the current project and environment.

Then:

1. Create the project architecture.
2. Configure React/Vite web application.
3. Configure React Native application.
4. Configure TypeScript.
5. Configure shared types.
6. Configure ESLint and Prettier.
7. Create the initial Firebase configuration structure.
8. Add environment variable examples.
9. Add README.
10. Run the web application.
11. Verify that the web application builds successfully.
12. Verify that the mobile application starts successfully.

Do not implement authentication or CRUD yet.

After Phase 1 is complete, provide a concise summary of:

- Files created
- Packages installed
- Commands executed
- Build/test results
- Any issues encountered

Then wait for confirmation before moving to Phase 2.