# Development Guide

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Project Overview

This is a React + TypeScript + Vite application for managing discharge summaries in a healthcare provider portal.

## Architecture

### Frontend Stack
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v7** - Routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Key Design Patterns

1. **Component Organization**
   - `components/auth` - Authentication & authorization
   - `components/dashboard` - Main application features
   - `components/layout` - Page layouts and navigation
   - `components/shared` - Reusable components

2. **State Management**
   - **Server State**: TanStack Query for API data (caching, invalidation, optimistic updates)
   - **Client State**: Zustand for authentication state
   - **Local State**: React hooks for component-specific state

3. **API Integration**
   - Centralized API client in `lib/api-client.ts`
   - Axios interceptors for auth tokens and error handling
   - Custom hooks in `hooks/` for data fetching

4. **Type Safety**
   - All types defined in `types/index.ts`
   - Strict TypeScript configuration
   - Type-safe API responses

## Common Development Tasks

### Adding a New Page

1. Create component in `src/components/dashboard/YourPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Adding a New API Endpoint

1. Add method to `src/lib/api-client.ts`
2. Create custom hook in `src/hooks/`
3. Use hook in component

Example:
```typescript
// lib/api-client.ts
async getPatients() {
  const response = await this.client.get<Patient[]>('/api/patients');
  return response.data;
}

// hooks/usePatients.ts
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => apiClient.getPatients(),
  });
}

// components/YourComponent.tsx
const { data: patients, isLoading } = usePatients();
```

### Adding New Types

Add to `src/types/index.ts`:
```typescript
export interface YourType {
  id: string;
  name: string;
  // ...
}
```

## Testing the Application

### Manual Testing

1. Start backend API (default: http://localhost:5000)
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:3000
4. Test login flow
5. Test discharge summary filtering
6. Test assignment workflow

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Building for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## Environment Variables

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=HealthExtent Provider Portal
```

## Debugging

### React DevTools
Install React DevTools browser extension for component inspection.

### TanStack Query DevTools
Uncomment the devtools in `App.tsx` for query inspection:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In component
<ReactQueryDevtools initialIsOpen={false} />
```

### Network Debugging
- Open browser DevTools > Network tab
- Filter by "XHR" to see API calls
- Check request headers for JWT token
- Verify API responses

## Common Issues

### CORS Errors
- Ensure backend has CORS configured for http://localhost:3000
- Check `VITE_API_BASE_URL` in `.env`

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT token expiration
- Verify backend auth endpoints

### Build Errors
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`
- Type check: `npm run type-check`

## Code Style

- Use functional components with hooks
- Prefer TypeScript interfaces over types
- Use TanStack Query for server state
- Use Zustand sparingly for global client state
- Keep components small and focused
- Extract reusable logic to custom hooks

## Performance Best Practices

- Use TanStack Query caching
- Debounce search inputs
- Lazy load routes
- Optimize images
- Monitor bundle size

## Git Workflow

```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Create pull request
```

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
