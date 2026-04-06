import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function Shell() {
  return (
    <div className="flex min-h-screen bg-edge-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto" role="main">
        <Outlet />
      </main>
    </div>
  );
}
