import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Shell } from './components/layout/Shell';
import { OnboardingWizard } from './components/onboarding/Wizard';
import { LandingPage } from './pages/Landing';
import { OverviewPage } from './pages/Overview';
import { PagesPage } from './pages/Pages';
import { SourcesPage } from './pages/Sources';
import { EventsPage } from './pages/Events';
import { FunnelsPage } from './pages/Funnels';
import { SettingsPage } from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      {isAuthenticated && (
        <Route element={<Shell />}>
          <Route path="/sites/:id" element={<OverviewPage />} />
          <Route path="/sites/:id/pages" element={<PagesPage />} />
          <Route path="/sites/:id/sources" element={<SourcesPage />} />
          <Route path="/sites/:id/events" element={<EventsPage />} />
          <Route path="/sites/:id/funnels" element={<FunnelsPage />} />
          <Route path="/sites/:id/settings" element={<SettingsPage />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/onboarding' : '/'} replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
