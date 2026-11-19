import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import ErrorBoundary from '../common/ErrorBoundary';

export const AppLayout = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-20 shadow-xs">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area (Offset by 64 (w-64) on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-screen pb-20 lg:pb-0">
        <Navbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        <footer className="hidden lg:flex py-4 px-6 border-t border-slate-200/80 bg-white text-xs text-slate-500 items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} KK Brothers Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Hotel & Catering Staff Logistics</span>
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
