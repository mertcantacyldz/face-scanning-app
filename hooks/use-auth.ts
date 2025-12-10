// hooks/use-auth.ts
// Re-export useAuth from AuthContext for backwards compatibility
// This prevents multiple instances of the hook from creating multiple anonymous users
export { useAuth } from '@/contexts/AuthContext';