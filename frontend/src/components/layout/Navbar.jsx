import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Building,
} from 'lucide-react';

export const Navbar = ({ onOpenMobileMenu }) => {
  const { user, isAdmin, isUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Convert route path to page title
  const getPageTitle = (pathname) => {
    const titles = {
      '/dashboard': 'Business Overview Dashboard',
      '/staff': 'Staff Management & Roster',
      '/clients': 'Hotels & Catering Partners',
      '/duties': 'Duty Management & Allocations',
      '/staff-payments': 'Staff Wage Payments',
      '/client-payments': 'Hotel & Catering Receivables',
      '/reports': 'Financial & Operational Reports',
      '/settings': 'System Settings & Rates',
      '/user/dashboard': 'My Duty & Earnings Dashboard',
      '/user/add-duty': 'Submit Duty Record',
      '/user/my-duties': 'My Duty History & Status',
      '/user/my-payments': 'My Received Payments',
      '/user/profile': 'My Personal Profile & Bank Details',
    };
    return titles[pathname] || 'KK Brothers Management';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {getPageTitle(location.pathname)}
          </h2>
          <div className="text-[11px] text-slate-600 hidden sm:block">
            Hotel & Catering Workforce Solutions • KK Brothers
          </div>
        </div>
      </div>

      {/* Right: Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">

        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.slice(0, 2) : 'KK'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-none">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                {isAdmin ? 'Administrator' : 'Staff Member'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                      isAdmin
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isAdmin ? 'System Admin' : 'Staff Worker'}
                  </span>
                </div>

                <div className="py-1">
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      System Settings
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/user/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      My Profile & Bank Info
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
