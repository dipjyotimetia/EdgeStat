import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Shell } from './components/layout/Shell';
import { OnboardingWizard } from './components/onboarding/Wizard';
import { OverviewPage } from './pages/Overview';
import { PagesPage } from './pages/Pages';
import { SourcesPage } from './pages/Sources';
import { EventsPage } from './pages/Events';
import { FunnelsPage } from './pages/Funnels';
import { SettingsPage } from './pages/Settings';
import { useAuth } from './hooks/useAuth';

export function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<OnboardingWizard />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route element={<Shell />}>
          <Route path="/sites/:id" element={<OverviewPage />} />
          <Route path="/sites/:id/pages" element={<PagesPage />} />
          <Route path="/sites/:id/sources" element={<SourcesPage />} />
          <Route path="/sites/:id/events" element={<EventsPage />} />
          <Route path="/sites/:id/funnels" element={<FunnelsPage />} />
          <Route path="/sites/:id/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
