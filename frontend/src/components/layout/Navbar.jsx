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
  UserPlus,
  Building2,
  UtensilsCrossed,
  PlusCircle,
  Wallet,
  Receipt,
  Zap,
} from 'lucide-react';

export const Navbar = ({ onOpenMobileMenu }) => {
  const { user, isAdmin, isUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
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

  // Quick Action shortcut definitions for Admin Navbar
  const quickActions = [
    {
      label: 'Add Staff',
      shortLabel: '+ Staff',
      path: '/staff',
      icon: UserPlus,
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-700',
      desc: 'Add new worker to roster',
    },
    {
      label: 'Add Hotel',
      shortLabel: '+ Hotel',
      path: '/clients',
      icon: Building2,
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      desc: 'Register hotel client',
    },
    {
      label: 'Add Catering',
      shortLabel: '+ Catering',
      path: '/clients',
      icon: UtensilsCrossed,
      bg: 'bg-amber-50 hover:bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      desc: 'Register catering firm',
    },
    {
      label: 'Add Duty',
      shortLabel: '+ Duty',
      path: '/duties',
      icon: PlusCircle,
      bg: 'bg-sky-50 hover:bg-sky-100',
      text: 'text-sky-700',
      border: 'border-sky-200',
      iconBg: 'bg-sky-100 text-sky-700',
      desc: 'Allocate worker shift',
    },
    {
      label: 'Pay Staff',
      shortLabel: '+ Pay Staff',
      path: '/staff-payments',
      icon: Wallet,
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      desc: 'Issue wage payment',
    },
    {
      label: 'Collect Bill',
      shortLabel: '+ Collect Bill',
      path: '/client-payments',
      icon: Receipt,
      bg: 'bg-rose-50 hover:bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      desc: 'Record client invoice collection',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open mobile navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {getPageTitle(location.pathname)}
            </h2>
            <div className="text-[11px] text-slate-600 hidden sm:block">
              Hotel & Catering Workforce Solutions • KK Brothers
            </div>
          </div>
        </div>

        {/* Right: Quick Actions, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Admin Quick Actions Dropdown (Positioned next to notification bell) */}
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickActionsMenu(!showQuickActionsMenu)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-xs transition-all hover:shadow-indigo-200 cursor-pointer active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Quick Actions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showQuickActionsMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showQuickActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickActionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                        Quick Operations
                      </span>
                      <span className="text-[10px] text-slate-400">All Shortcuts</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setShowQuickActionsMenu(false);
                              navigate(action.path);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition group cursor-pointer ${action.bg} ${action.border}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className={`text-xs font-bold leading-tight ${action.text}`}>
                                {action.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {action.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
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
      </div>
    </header>
  );
};

export default Navbar;
