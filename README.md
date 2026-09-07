# CRUD

Temporary app name (will be renamed when the project is complete).

Full-stack CRUD app:

- **CRUD Web** — React + Vite
- **CRUD Mobile** — Expo / React Native (same API)
- **API** — Express + **local PostgreSQL** (Turso kept for later server)

## Architecture

| Layer | Technology |
| --- | --- |
| Database (local) | PostgreSQL |
| Database (later/server) | Turso (commented, ready to switch) |
| API | `apps/api` → port `8787` |
| Web | `VITE_DATA_SOURCE=api` |
| Mobile | `EXPO_PUBLIC_API_URL` → same API |

Demo login: `admin@nexora.app` / `Admin123!`

## Local development

### 1. API + Postgres

```bash
npm run db:setup
npm run dev:api
```

Health: http://localhost:8787/health

### 2. Web

```bash
npm run dev
```

http://localhost:5173

### 3. Mobile

Phone and PC must be on the **same Wi‑Fi**. Set your PC LAN IP in `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.9:8787
```

```bash
npm run dev:mobile
```

Scan the QR code with Expo Go. Login with the same admin/user accounts as web — same Postgres data.

Android emulator tip: use `http://10.0.2.2:8787`.

## Roadmap (after local features)

1. Finish any extra features on local web + mobile  
2. Switch API DB to Turso for server (uncomment Turso in `apps/api`)  
3. Deploy API to a host with HTTPS  
4. Deploy web to **Netlify** (`apps/web/dist` + `VITE_API_URL`)  
5. Build Android with **EAS** → upload AAB to **Google Play**

### Netlify (later)

```bash
# set VITE_API_URL to your public API, then:
npm run build
# deploy apps/web/dist to Netlify (SPA redirect: /* → /index.html)
```

### Google Play (later)

```bash
cd apps/mobile
npx eas-cli login
npx eas build -p android --profile production
npx eas submit -p android --profile production
```
