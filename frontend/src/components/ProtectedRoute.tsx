/**
 * Protected Route Component
 * 
 * Wrapper component that restricts access to authenticated users only.
 * Redirects unauthenticated users to the login page.
 * 
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show skeleton loading state while checking session
  if (loading) {
    return (
      <div
        className="flex h-screen w-full overflow-hidden bg-background"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 border-r bg-card flex-col">
          <div className="px-4 py-4 border-b">
            <Skeleton className="h-10 w-24 rounded-md mb-2" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>

          <div className="px-3 py-4 space-y-2">
            <Skeleton className="h-3 w-20 rounded-md mb-3" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>

          <div className="mt-auto px-4 py-4 border-t space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
            <Skeleton className="h-9 w-full rounded-md mt-2" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </aside>

        <div className="flex-1 min-w-0 overflow-auto">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-4 w-px" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>

          <main className="p-3 sm:p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
              <p className="text-xs text-muted-foreground">Getting Hazard Analytics ready for you</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-7 w-16 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-[340px] w-full rounded-md" />
              </CardContent>
            </Card>

            <span className="sr-only">Loading dashboard. Hazard Analytics is being prepared.</span>
          </main>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};
