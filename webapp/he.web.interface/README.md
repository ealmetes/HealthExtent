# HealthExtent Provider Portal (he.web.provider)

A production-ready React + TypeScript application that enables care teams to view, triage, filter, and assign incoming admission and discharge summaries from hospitals to primary care providers and transitional care management teams.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with secure token management
- **Dashboard Overview**: Real-time statistics and quick access to pending summaries
- **Discharge Summary Management**:
  - View paginated list of discharge summaries
  - Advanced filtering (status, priority, hospital, provider, date range)
  - Real-time search by patient name, MRN
  - Detailed view with full clinical information
- **Assignment Workflow**: Assign discharge summaries to specific providers
- **Status Management**: Update review status (Pending, In Review, Reviewed, Escalated)
- **Priority Management**: Set priority levels (Low, Medium, High, Urgent)

### Technical Features
- **Type-Safe**: Full TypeScript coverage with strict mode enabled
- **API Integration**: Axios-based API client with interceptors for auth and error handling
- **State Management**: Zustand for authentication state with persistence
- **Data Fetching**: TanStack Query for server state management with caching
- **Routing**: React Router v7 with protected routes
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Loading States**: Consistent loading indicators throughout the app

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **State Management**: Zustand 5
- **Data Fetching**: TanStack Query 5
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS 3.4
- **Date Handling**: date-fns 4

## Project Structure

```
he.web.provider/
├── src/
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── layout/             # Layout components
│   │   └── shared/             # Shared/reusable components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Library code (API client)
│   ├── store/                  # State management (Zustand)
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   └── styles/                 # Global styles
├── .env.example                # Environment variables template
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:5000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=HealthExtent Provider Portal
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Building for Production

1. Type-check the code:
```bash
npm run type-check
```

2. Build the production bundle:
```bash
npm run build
```

3. Preview the production build:
```bash
npm run preview
```

## API Integration

The application expects the backend API at `VITE_API_BASE_URL`. The API client handles JWT tokens, error handling, and automatic retries.

### Key API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/discharge-summaries` - List discharge summaries (with filters)
- `GET /api/discharge-summaries/:id` - Get discharge summary details
- `PATCH /api/discharge-summaries/:id/assign` - Assign discharge summary
- `PATCH /api/discharge-summaries/:id/status` - Update review status
- `PATCH /api/discharge-summaries/:id/priority` - Update priority
- `GET /api/hospitals` - List hospitals
- `GET /api/providers` - List providers

## Authentication

JWT token-based authentication:
1. User logs in via `/login` page
2. JWT token stored in localStorage and Zustand store
3. Token automatically attached to all API requests
4. Protected routes redirect to `/login` if no valid token
5. 401 responses automatically clear token and redirect

## Key Components

- **DischargeSummariesList**: Main list view with filtering, search, and pagination
- **DischargeSummaryDetail**: Detailed view with action buttons for status/priority/assignment
- **DischargeSummaryFilters**: Advanced filter component with debounced search
- **DashboardHome**: Dashboard overview with statistics

## Performance Optimizations

- Code splitting with React Router
- TanStack Query caching (5-minute stale time)
- Debounced search inputs (300ms)
- Production build minification

## Deployment

Build the production bundle:
```bash
npm run build
```

The built files in `dist/` can be hosted on any static file server (Netlify, Vercel, AWS S3, etc.)

## Troubleshooting

### API Connection Issues
- Verify `VITE_API_BASE_URL` in `.env`
- Check backend API is running
- Review browser console for CORS errors

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT token expiration

## Future Enhancements

- Real-time notifications with WebSockets
- Bulk assignment operations
- Export to CSV/PDF
- Advanced analytics dashboard
- Dark mode support
- Encounter and patient management pages

## License

Private - HealthExtent Internal Use Only
