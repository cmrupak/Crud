# NEXORA
## React Web + React Native Android + Supabase + Netlify

A complete step-by-step guide for building, developing, deploying, and publishing a web and Android application using a single Supabase backend.

---

# 1. Project Overview

## Goal

Build one application with:

- React web application
- React Native Android application
- One shared Supabase database
- Supabase authentication
- Supabase storage
- User management
- Admin/user roles
- Account activation/deactivation
- CRUD functionality
- Web deployment on Netlify
- Android application published on Google Play Store

---

# 2. Final Architecture

```text
                         NEXORA
                            |
             +--------------+--------------+
             |                             |
             v                             v
       React Web App                React Native App
       Vite + TypeScript             Expo + TypeScript
             |                             |
             +--------------+--------------+
                            |
                            v
                    SUPABASE CLOUD
                            |
            +---------------+---------------+
            |               |               |
            v               v               v
       PostgreSQL        Supabase Auth    Storage
       Database                            |
            |                              |
            +---------------+--------------+
                            |
                           RLS
                  Row Level Security
```

Deployment:

```text
                         GitHub
                            |
             +--------------+--------------+
             |                             |
             v                             v
          Netlify                         EAS
             |                             |
             v                             v
       Web Production                Android AAB
                                           |
                                           v
                                    Google Play Store
```

---

# 3. Technology Stack

| Requirement | Technology |
|---|---|
| Web | React |
| Web Build Tool | Vite |
| Web Language | TypeScript |
| Mobile | React Native |
| Mobile Framework | Expo |
| Mobile Language | TypeScript |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Database Security | Row Level Security |
| Web Hosting | Netlify |
| Android Build | Expo EAS |
| Android Store | Google Play |
| Source Control | GitHub |
| IDE | Cursor / VS Code |

---

# 4. Why Supabase Instead of Appwrite

For this project, Appwrite is not necessary.

Supabase already provides:

```text
Supabase
│
├── PostgreSQL
├── Authentication
├── Storage
├── REST API
├── Realtime
├── Row Level Security
└── Edge Functions
```

The web and mobile applications can both communicate with the same Supabase project.

Therefore:

```text
React Web
      |
      |
      +----> Supabase
      |
      |
React Native
```

Both applications use the same:

- users
- authentication
- database
- files
- permissions
- records

---

# 5. Prerequisites

Install the following software.

## Node.js

Check:

```bash
node -v
```

Check npm:

```bash
npm -v
```

Recommended:

```text
Node.js 20+
```

---

# 6. Install Git

Check:

```bash
git --version
```

If Git is not installed, install Git for your operating system.

---

# 7. Install Cursor

Use Cursor or VS Code.

Recommended project editor:

```text
Cursor
```

---

# 8. Create GitHub Repository

Create a GitHub repository:

```text
nexora
```

Recommended repository:

```text
nexora
```

Do not commit:

```text
.env
.env.local
.env.production
*.secret
```

---

# 9. Project Structure

Use a monorepo.

```text
nexora/
│
├── apps/
│   │
│   ├── web/
│   │   │
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/
│       │
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── assets/
│       ├── app.json
│       ├── eas.json
│       └── package.json
│
├── packages/
│   │
│   ├── types/
│   ├── validation/
│   └── shared/
│
├── supabase/
│   │
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│
├── .gitignore
├── package.json
└── README.md
```

---

# 10. Create Root Project

Create the project:

```bash
mkdir nexora

cd nexora

git init
```

Create package.json:

```bash
npm init -y
```

---

# 11. Create Web Application

Inside the root:

```bash
mkdir apps
cd apps
```

Create React application:

```bash
npm create vite@latest web -- --template react-ts
```

Enter:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Install Supabase:

```bash
npm install @supabase/supabase-js
```

Supabase's official React setup uses Vite and `@supabase/supabase-js`.

---

# 12. Run Web Application

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 13. Create Supabase Project

Create a Supabase account.

Create a new project:

```text
NEXORA
```

Choose a strong database password.

Wait for the project to finish provisioning.

---

# 14. Get Supabase Credentials

Inside Supabase:

```text
Project
   ↓
Connect
```

Get:

```text
Project URL
Publishable Key
```

Do NOT use the service-role/secret key in the frontend.

---

# 15. Web Environment Variables

Inside:

```text
apps/web/
```

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Example:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxxxxxxxxxxxxxxx
```

Never commit `.env.local`.

Supabase's current React documentation uses these Vite environment variable names.

---

# 16. Create Supabase Client for Web

Create:

```text
apps/web/src/lib/supabase.ts
```

Code:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)
```

---

# 17. Create Database Tables

Use Supabase:

```text
SQL Editor
```

Create:

```text
profiles
records
audit_logs
```

---

# 18. Profiles Table

Run:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,

  email text,

  role text not null default 'user'
    check (role in ('admin', 'user')),

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  avatar_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

---

# 19. Records Table

Create the main application records table:

```sql
create table public.records (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,

  description text,

  status text not null default 'active',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

---

# 20. Audit Logs Table

```sql
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references public.profiles(id)
    on delete set null,

  action text not null,

  entity_type text,

  entity_id uuid,

  metadata jsonb,

  created_at timestamptz not null default now()
);
```

---

# 21. Enable Row Level Security

Enable RLS:

```sql
alter table public.profiles enable row level security;

alter table public.records enable row level security;

alter table public.audit_logs enable row level security;
```

RLS is critical because both the web application and mobile application will access the same Supabase backend.

---

# 22. Profile RLS Policies

Users can view their own profile:

```sql
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);
```

Users can update their own profile:

```sql
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);
```

---

# 23. Admin Profile Policy

Create helper function:

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;
```

Allow admins to manage profiles:

```sql
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);
```

---

# 24. Records RLS

Users can read their own records:

```sql
create policy "Users can read own records"
on public.records
for select
to authenticated
using (
  user_id = auth.uid()
);
```

Users can create records:

```sql
create policy "Users can create records"
on public.records
for insert
to authenticated
with check (
  user_id = auth.uid()
);
```

Users can update their own records:

```sql
create policy "Users can update own records"
on public.records
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);
```

Users can delete their own records:

```sql
create policy "Users can delete own records"
on public.records
for delete
to authenticated
using (
  user_id = auth.uid()
);
```

---

# 25. Admin Record Access

```sql
create policy "Admins can manage all records"
on public.records
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);
```

---

# 26. Automatically Create Profile After Registration

Create:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );

  return new;
end;
$$;
```

Create trigger:

```sql
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
```

---

# 27. Authentication

Enable authentication providers in Supabase.

Start with:

```text
Email + Password
```

Later you can add:

```text
Google
Apple
Microsoft
```

---

# 28. Web Authentication

Create:

```text
src/services/authService.ts
```

Example:

```ts
import { supabase } from '../lib/supabase'

export async function register(
  email: string,
  password: string,
  fullName: string
) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
}

export async function login(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function logout() {
  return await supabase.auth.signOut()
}
```

---

# 29. Authentication Pages

Create:

```text
pages/
│
├── Login/
├── Register/
├── ForgotPassword/
└── ResetPassword/
```

Flow:

```text
Register
   ↓
Supabase Auth
   ↓
profiles
   ↓
Dashboard
```

Login:

```text
Login
   ↓
Supabase Auth
   ↓
Check profile
   ↓
Check status
   ↓
Dashboard
```

---

# 30. Account Deactivation

When an admin deactivates a user:

```text
profiles.status = inactive
```

The application must prevent inactive users from using protected features.

Important:

```text
active
inactive
```

Do not delete the user just to deactivate them.

---

# 31. Admin Dashboard

Create:

```text
Dashboard
Users
Records
Profile
Settings
Logout
```

Admin:

```text
Dashboard
├── Users
│   ├── View Users
│   ├── Activate
│   ├── Deactivate
│   └── Change Role
│
├── Records
│   ├── Create
│   ├── Read
│   ├── Update
│   └── Delete
│
└── Audit Logs
```

Normal user:

```text
Dashboard
├── My Records
├── Create Record
├── Profile
└── Settings
```

---

# 32. Create Mobile Application

Go to:

```text
nexora/apps
```

Create Expo application:

```bash
npx create-expo-app@latest mobile
```

Or TypeScript template:

```bash
npx create-expo-app mobile --template blank-typescript
```

Supabase's current Expo documentation supports this approach.

---

# 33. Install Mobile Dependencies

```bash
cd mobile
```

Install Supabase:

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite
```

Supabase's current Expo quickstart uses these packages for the client and local session persistence.

---

# 34. Mobile Environment Variables

Create:

```text
apps/mobile/.env
```

Add:

```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Expo requires public client variables to use the `EXPO_PUBLIC_` prefix.

---

# 35. Mobile Supabase Client

Create:

```text
apps/mobile/lib/supabase.ts
```

Code:

```ts
import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'

import 'expo-sqlite/localStorage/install'

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL!

const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

This follows the current Supabase Expo setup.

---

# 36. Test Mobile Application

Start Expo:

```bash
npx expo start
```

You can then use:

```text
Android Emulator
```

or:

```text
Physical Android Device
```

Supabase's Expo guide uses `npx expo start` for development.

---

# 37. Mobile Authentication

Use the same Supabase functions.

Register:

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
    },
  },
})
```

Login:

```ts
const { data, error } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  })
```

Logout:

```ts
await supabase.auth.signOut()
```

---

# 38. Important: Same Database

The web application:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The mobile application:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Both values point to:

```text
THE SAME SUPABASE PROJECT
```

Therefore:

```text
WEB
 |
 +------+
        |
        v
   SUPABASE DB
        ^
        |
 +------+
 |
MOBILE
```

---

# 39. Shared Types

Create:

```text
packages/types/
```

Example:

```ts
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

Record:

```ts
export interface Record {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}
```

Both applications can use these types.

---

# 40. Shared Validation

Create:

```text
packages/validation/
```

Use a validation library such as Zod.

Example:

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})
```

Use the same validation rules on:

```text
Web
Mobile
```

---

# 41. Supabase Storage

Create storage buckets.

Example:

```text
avatars
documents
```

Structure:

```text
Storage
│
├── avatars
│
└── documents
```

Users can upload:

```text
Profile photo
Documents
Attachments
```

Make sure Storage RLS policies are configured correctly.

---

# 42. Web Routing

Use React Router:

```bash
npm install react-router-dom
```

Routes:

```text
/
 /login
 /register
 /forgot-password

/dashboard
/profile
/records
/records/new
/records/:id

/admin
/admin/users
/admin/records
/admin/audit-logs
```

Protected routes should verify:

```text
Authenticated
+
Active
+
Correct Role
```

---

# 43. Mobile Navigation

Use Expo Router.

Recommended:

```text
app/
│
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── (tabs)/
│   ├── index.tsx
│   ├── records.tsx
│   ├── profile.tsx
│   └── settings.tsx
│
└── _layout.tsx
```

---

# 44. API Strategy

Do not create a separate Express backend unless you have a specific requirement.

Use:

```text
React
   ↓
Supabase Client
   ↓
Supabase API
   ↓
PostgreSQL
```

And:

```text
React Native
   ↓
Supabase Client
   ↓
Supabase API
   ↓
PostgreSQL
```

For sensitive server-side operations use:

```text
Supabase Edge Functions
```

Examples:

```text
Send email
Payment processing
Admin-only server operation
External API secret
Webhook
```

Never expose secret API keys in React or React Native.

---

# 45. Local Development

Start web:

```bash
cd apps/web
npm run dev
```

Start mobile:

```bash
cd apps/mobile
npx expo start
```

You can run both simultaneously.

---

# 46. Git Configuration

Root `.gitignore`:

```gitignore
node_modules/

dist/
build/

.env
.env.local
.env.development
.env.production

.expo/
.expo-shared/

*.log

.DS_Store

android/.gradle/
android/local.properties

ios/Pods/
```

---

# 47. First Git Commit

From root:

```bash
git add .
```

Then:

```bash
git commit -m "Initial NEXORA project setup"
```

Connect GitHub:

```bash
git remote add origin YOUR_GITHUB_REPOSITORY
```

Push:

```bash
git branch -M main

git push -u origin main
```

---

# 48. Netlify Deployment

The web application will be deployed to Netlify.

Build locally first:

```bash
cd apps/web

npm run build
```

Output:

```text
apps/web/dist
```

Netlify's Vite configuration uses `npm run build` with `dist` as the publish directory.

---

# 49. Netlify Configuration

Because the project is a monorepo, configure Netlify to use:

```text
Base directory:

apps/web
```

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

---

# 50. Netlify Environment Variables

Inside Netlify:

```text
Project
 ↓
Environment variables
```

Add:

```text
VITE_SUPABASE_URL
```

and:

```text
VITE_SUPABASE_PUBLISHABLE_KEY
```

Use the same Supabase project values.

---

# 51. React SPA Redirect

For React Router, create:

```text
apps/web/public/_redirects
```

Add:

```text
/*    /index.html   200
```

This prevents direct URL navigation from returning 404 on Netlify.

Netlify's Vite documentation specifically notes that SPA applications using client-side routing need a rewrite to `index.html`.

---

# 52. Netlify Production Flow

```text
Developer
   |
   v
Cursor
   |
   v
Git
   |
   v
GitHub
   |
   v
Netlify
   |
   v
npm run build
   |
   v
dist
   |
   v
Production Website
```

---

# 53. Custom Domain

After deployment:

```text
Netlify
 ↓
Domain management
 ↓
Add custom domain
```

Example:

```text
https://nexora.com
```

Configure DNS according to Netlify's instructions.

---

# 54. Android Application ID

Inside the mobile project configure:

```text
com.yourcompany.nexora
```

Example:

```json
{
  "expo": {
    "name": "Nexora",
    "slug": "nexora",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.nexora"
    }
  }
}
```

The Android package/application ID must be unique for your application. Expo documents Android package names using reverse-DNS notation.

---

# 55. Install EAS CLI

Install:

```bash
npm install --global eas-cli
```

Login:

```bash
eas login
```

Expo's current Android submission documentation uses EAS CLI for building and submitting Android apps.

---

# 56. Initialize EAS

Inside:

```text
apps/mobile
```

Run:

```bash
eas init
```

Then:

```bash
eas build:configure
```

This creates:

```text
eas.json
```

---

# 57. Development APK

For testing on a physical Android device, create an APK.

Example `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },

    "preview": {
      "distribution": "internal"
    },

    "production": {}
  }
}
```

Build:

```bash
eas build --platform android --profile preview
```

APK builds are useful for installing directly on Android devices. Expo documents APK configuration separately from Play Store AAB builds.

---

# 58. Production Android Build

For Google Play Store:

```bash
eas build --platform android --profile production
```

The production build produces an:

```text
.aab
```

Google Play uses Android App Bundles for new applications.

---

# 59. Google Play Developer Account

Create a Google Play Developer account.

You need:

```text
Google account
+
Developer account
+
Application information
```

A paid Google Play Developer account is required for production distribution.

---

# 60. Create Application in Google Play Console

Create:

```text
Nexora
```

Choose:

```text
Application type:
App
```

Choose the appropriate category.

Add:

```text
App name
Short description
Full description
App icon
Screenshots
Feature graphic
Privacy policy
Contact information
```

---

# 61. Google Play Internal Testing

Do NOT immediately publish to production.

Use:

```text
Internal testing
```

First upload your AAB.

Test:

```text
Login
Register
Logout
Database
CRUD
Profile
File upload
Account deactivation
Admin features
```

Expo's current Android production guide recommends using an internal testing release before production.

---

# 62. Submit Android Application

You can submit using:

```bash
eas submit --platform android
```

Expo's current EAS Submit documentation supports submitting the Android AAB through EAS.

---

# 63. Production Release

Once testing is complete:

```text
Internal Testing
       ↓
Closed Testing
       ↓
Production
       ↓
Google Play Review
       ↓
Published
```

---

# 64. Updating the Android Application

For a new version:

```bash
git add .

git commit -m "Update application"

git push
```

Then:

```bash
eas build --platform android --profile production
```

Submit:

```bash
eas submit --platform android
```

Future releases can also be automated with EAS workflows.

---

# 65. Production Environment

Use separate environments when the application becomes serious.

Recommended:

```text
Development
     |
     v
Staging
     |
     v
Production
```

Eventually:

```text
Supabase Development
Supabase Staging
Supabase Production
```

Do not test dangerous database migrations directly against production.

---

# 66. Security Rules

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

in:

```text
React
React Native
GitHub
Netlify frontend
Expo frontend
```

Frontend applications should use the public/publishable client key and rely on properly configured RLS.

---

# 67. Authentication Security

Implement:

```text
Email verification
Password reset
Session persistence
Protected routes
Inactive user checks
Role checks
RLS
```

---

# 68. Admin Security

Never trust this:

```ts
if (user.role === 'admin') {
   // sensitive operation
}
```

by itself.

The UI can hide buttons, but real authorization must happen in Supabase using:

```text
RLS
+
Database policies
+
Server-side functions where necessary
```

---

# 69. Recommended Application Layers

Web:

```text
components/
pages/
layouts/
hooks/
services/
lib/
contexts/
types/
utils/
```

Mobile:

```text
app/
components/
hooks/
services/
lib/
types/
utils/
```

Shared:

```text
packages/
├── types/
├── validation/
└── shared/
```

---

# 70. Recommended Development Order

Do NOT build everything simultaneously.

Follow this exact order.

## Phase 1 — Project Setup

```text
[ ] Create GitHub repository
[ ] Create root project
[ ] Create web application
[ ] Create mobile application
[ ] Configure TypeScript
[ ] Configure shared packages
```

---

## Phase 2 — Supabase

```text
[ ] Create Supabase project
[ ] Create database
[ ] Create profiles table
[ ] Create records table
[ ] Create audit_logs table
[ ] Enable RLS
[ ] Create policies
[ ] Create authentication
[ ] Create Storage
```

---

## Phase 3 — Web Authentication

```text
[ ] Login
[ ] Register
[ ] Logout
[ ] Forgot password
[ ] Reset password
[ ] Email verification
[ ] Protected routes
[ ] Session handling
```

---

## Phase 4 — Web Application

```text
[ ] Dashboard
[ ] Profile
[ ] Records
[ ] Create record
[ ] Edit record
[ ] Delete record
[ ] Search
[ ] Filters
```

---

## Phase 5 — Admin

```text
[ ] Admin dashboard
[ ] User list
[ ] User details
[ ] Activate user
[ ] Deactivate user
[ ] Change role
[ ] Audit logs
```

---

## Phase 6 — Mobile

```text
[ ] Expo configuration
[ ] Supabase connection
[ ] Login
[ ] Register
[ ] Logout
[ ] Dashboard
[ ] Records
[ ] Profile
[ ] Settings
```

---

## Phase 7 — Storage

```text
[ ] Profile image
[ ] File upload
[ ] File preview
[ ] File delete
[ ] Storage RLS
```

---

## Phase 8 — Testing

```text
[ ] Web testing
[ ] Mobile testing
[ ] Authentication testing
[ ] RLS testing
[ ] Admin testing
[ ] Inactive user testing
[ ] Storage testing
```

---

## Phase 9 — Web Deployment

```text
[ ] GitHub
[ ] Netlify
[ ] Environment variables
[ ] Build
[ ] SPA redirects
[ ] Custom domain
[ ] HTTPS
```

---

## Phase 10 — Android Release

```text
[ ] Expo EAS
[ ] Android package name
[ ] App icon
[ ] Splash screen
[ ] Production build
[ ] AAB
[ ] Google Play Console
[ ] Internal testing
[ ] Production release
```

---

# 71. Complete Development Workflow

Your normal development workflow will be:

```text
             DEVELOPMENT
                  |
        +---------+---------+
        |                   |
        v                   v
      WEB                MOBILE
   React/Vite          Expo/RN
        |                   |
        +---------+---------+
                  |
                  v
              SUPABASE
                  |
        +---------+---------+
        |                   |
        v                   v
    PostgreSQL           Storage
        |
        v
       RLS
```

When ready:

```text
                 GITHUB
                    |
          +---------+---------+
          |                   |
          v                   v
       NETLIFY               EAS
          |                   |
          v                   v
     WEB WEBSITE         ANDROID AAB
                              |
                              v
                       GOOGLE PLAY
```

---

# 72. Final Technology Decision

Use:

```text
React
+
Vite
+
TypeScript
+
React Native
+
Expo
+
Supabase
+
Netlify
+
GitHub
+
EAS
+
Google Play
```

Do not add Appwrite unless a specific future requirement needs something Appwrite provides that Supabase does not.

---

# 73. Final Project Structure

```text
nexora/
│
├── apps/
│   │
│   ├── web/
│   │   │
│   │   ├── public/
│   │   │   └── _redirects
│   │   │
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   ├── layouts/
│   │   │   ├── lib/
│   │   │   │   └── supabase.ts
│   │   │   ├── pages/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   ├── .env.local
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── mobile/
│       │
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   └── _layout.tsx
│       │
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       │   └── supabase.ts
│       ├── services/
│       ├── types/
│       ├── utils/
│       ├── assets/
│       ├── .env
│       ├── app.json
│       ├── eas.json
│       └── package.json
│
├── packages/
│   ├── types/
│   ├── validation/
│   └── shared/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│
├── .gitignore
├── package.json
└── README.md
```

---

# 74. Production Checklist

## Supabase

```text
[ ] Database configured
[ ] RLS enabled
[ ] RLS policies tested
[ ] Authentication configured
[ ] Storage configured
[ ] Storage policies configured
[ ] Production environment created
[ ] Backups checked
```

## Web

```text
[ ] Production build works
[ ] Environment variables configured
[ ] Netlify deployed
[ ] SPA redirect configured
[ ] Custom domain configured
[ ] HTTPS working
[ ] Authentication tested
```

## Mobile

```text
[ ] Android package configured
[ ] App icon configured
[ ] Splash screen configured
[ ] Production environment configured
[ ] AAB generated
[ ] Internal testing completed
[ ] Play Store listing completed
[ ] Privacy policy completed
[ ] Production submission completed
```

---

# 75. Important Rule

There is only **one database**.

```text
                    SUPABASE
                       |
                 PostgreSQL
                       |
             +---------+---------+
             |                   |
             v                   v
          WEBSITE             ANDROID
           React              Expo/RN
```

If a user creates:

```text
Record #123
```

from the website, the Android application can immediately access the same record according to the user's permissions.

Likewise, if the user creates a record from Android, the web application can access it.

That is the main advantage of this architecture.

---

# 76. Recommended Next Step

Do not start by building the complete UI.

Start with:

```text
STEP 1
Create GitHub repository

        ↓

STEP 2
Create Supabase project

        ↓

STEP 3
Create database tables

        ↓

STEP 4
Configure RLS

        ↓

STEP 5
Create React web app

        ↓

STEP 6
Connect React → Supabase

        ↓

STEP 7
Build authentication

        ↓

STEP 8
Create dashboard

        ↓

STEP 9
Create Expo mobile app

        ↓

STEP 10
Connect Expo → same Supabase

        ↓

STEP 11
Test both applications

        ↓

STEP 12
Deploy web → Netlify

        ↓

STEP 13
Build Android → EAS

        ↓

STEP 14
Publish → Google Play Store
```

---

# 77. Success Criteria

The project is considered complete when:

```text
WEB
✓ User can register
✓ User can login
✓ User can logout
✓ User can reset password
✓ User can manage profile
✓ User can CRUD records
✓ Admin can manage users
✓ Admin can activate/deactivate users
✓ RLS protects database
✓ Website works on Netlify

MOBILE
✓ User can register
✓ User can login
✓ User can logout
✓ User can manage profile
✓ User can CRUD records
✓ Mobile uses same Supabase database
✓ Android production AAB generated
✓ Internal testing completed
✓ App published on Google Play

BACKEND
✓ Supabase PostgreSQL
✓ Supabase Auth
✓ Supabase Storage
✓ RLS
✓ Audit logging
✓ Secure environment variables
```

---

# 78. Final Architecture

```text
                         NEXORA
                            |
             +--------------+--------------+
             |                             |
             v                             v
       React + Vite                   Expo + React Native
          WEB                              MOBILE
             |                             |
             |                             |
             +--------------+--------------+
                            |
                            v
                    ┌───────────────┐
                    │   SUPABASE    │
                    │               │
                    │ PostgreSQL    │
                    │ Auth          │
                    │ Storage       │
                    │ RLS           │
                    │ Realtime      │
                    └───────┬───────┘
                            |
                    +-------+-------+
                    |               |
                    v               v
                 NETLIFY        GOOGLE PLAY
                    |               |
                    v               v
                 WEBSITE         ANDROID APP
```

This is the recommended production architecture for NEXORA.