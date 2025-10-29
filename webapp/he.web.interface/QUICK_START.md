# Quick Start Guide

## Installation (First Time)

```bash
cd he.web.provider
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=HealthExtent Provider Portal
```

## Development

```bash
npm run dev
```
Opens at: http://localhost:3000

## Production Build

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

## Type Checking

```bash
npm run type-check   # Check TypeScript types
```

## Project Structure

```
src/
├── components/
│   ├── auth/              - Login & auth components
│   ├── dashboard/         - Main app features
│   ├── layout/            - Layout components
│   └── shared/            - Reusable components
├── hooks/                 - Custom React hooks
├── lib/                   - API client
├── store/                 - Zustand state
├── types/                 - TypeScript types
├── utils/                 - Helper functions
└── styles/                - Global CSS
```

## Key Features

- ✅ Login/Authentication
- ✅ Dashboard with statistics
- ✅ Discharge summaries list with filters
- ✅ Discharge summary detail view
- ✅ Assign to providers
- ✅ Update status & priority
- ✅ Responsive design

## Routes

- `/login` - Login page
- `/dashboard` - Dashboard home
- `/discharge-summaries` - List view
- `/discharge-summaries/:id` - Detail view

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- React Router v7
- TanStack Query (data fetching)
- Zustand (state management)
- Tailwind CSS (styling)
- Axios (HTTP client)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_APP_NAME` | Application name | `HealthExtent Provider Portal` |

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript
npm run lint         # Run ESLint
```

## Troubleshooting

**CORS errors?**
- Check backend CORS settings for http://localhost:3000

**Auth issues?**
- Clear localStorage: `localStorage.clear()`
- Check API is running

**Build errors?**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`

## Documentation

- `README.md` - Full documentation
- `DEVELOPMENT.md` - Developer guide
- `PROJECT_SUMMARY.md` - Feature overview
- `QUICK_START.md` - This file

## API Endpoints Expected

The app expects these backend endpoints:

```
POST   /api/auth/login
GET    /api/discharge-summaries
GET    /api/discharge-summaries/:id
PATCH  /api/discharge-summaries/:id/assign
PATCH  /api/discharge-summaries/:id/status
PATCH  /api/discharge-summaries/:id/priority
GET    /api/hospitals
GET    /api/providers
```

## Need Help?

1. Check the full README.md
2. Check DEVELOPMENT.md for detailed guides
3. Review PROJECT_SUMMARY.md for feature overview
