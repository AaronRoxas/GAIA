import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function DashboardShellSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden md:flex w-64 border-r bg-muted/20 p-4 flex-col gap-4">
        <div className="space-y-2 pb-2 border-b">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-md" />
          ))}
        </div>
        <div className="mt-auto space-y-2 border-t pt-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <header className="h-16 border-b px-4 md:px-6 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-44" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        <section className="p-3 sm:p-4 md:p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-24 shrink-0" />
                ))}
              </div>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}