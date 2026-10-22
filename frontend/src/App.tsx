import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { ClubPage } from '@/features/clubs/ClubPage';
import { ClubsPage } from '@/features/clubs/ClubsPage';
import { HomePage } from '@/features/home/HomePage';
import { MatchDetailPage } from '@/features/matches/MatchDetailPage';
import { MatchesPage } from '@/features/matches/MatchesPage';
import { PlayersPage } from '@/features/players/PlayersPage';
import { StandingsPage } from '@/features/standings/StandingsPage';
import { createQueryClient } from '@/lib/query-client';

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="jogadores" element={<PlayersPage />} />
            <Route path="clubes" element={<ClubsPage />} />
            <Route path="clubes/:clubId" element={<ClubPage />} />
            <Route path="partidas" element={<MatchesPage />} />
            <Route path="partidas/:matchId" element={<MatchDetailPage />} />
            <Route path="classificacao" element={<StandingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
