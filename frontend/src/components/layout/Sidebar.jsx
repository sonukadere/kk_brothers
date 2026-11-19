import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  PlusCircle,
  UserCheck,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';

export const Sidebar = ({ isMobile = false, onCloseMobile }) => {
  const { user, isAdmin, isUser, logout } = useAuth();
  const location = useLocation();

  // Navigation Items according to strict requirements
  const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Staff Management', path: '/staff', icon: Users },
    { label: 'Hotels & Catering', path: '/clients', icon: Building2 },
    { label: 'Duty Management', path: '/duties', icon: CalendarCheck },
    { label: 'Staff Payments', path: '/staff-payments', icon: Wallet },
    { label: 'Client Payments', path: '/client-payments', icon: Receipt },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const userNavItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Add Duty', path: '/user/add-duty', icon: PlusCircle },
    { label: 'My Duties', path: '/user/my-duties', icon: CalendarCheck },
    { label: 'My Payments', path: '/user/my-payments', icon: Wallet },
    { label: 'My Profile', path: '/user/profile', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="h-full flex flex-col bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <span className="font-bold text-lg tracking-wider">KK</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                KK BROTHERS
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 tracking-tight block mt-0.5">
              Staff & Duty Management
            </span>
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                isAdmin
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 leading-none">
                {isAdmin ? 'Admin Portal' : 'Staff Worker Portal'}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {isAdmin ? 'Full System Access' : 'Personal Duties & Pay'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-1">
          {isAdmin ? 'Administration Menu' : 'Staff Menu'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold shadow-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.name ? user.name.slice(0, 2) : 'KK'}
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-semibold text-slate-800 truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
