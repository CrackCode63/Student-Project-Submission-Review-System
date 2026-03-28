import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className='page-shell lg:flex'>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className='relative flex min-h-screen flex-1 flex-col'>
        <Navbar
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((current) => !current)}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className='relative z-10 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
