import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  CalendarCheck,
  Plus,
  Wallet,
  User,
  Users,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

export const BottomNav = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    // Mobile Bottom Nav for Admin
    const adminTabs = [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/duties', label: 'Duties', icon: CalendarCheck },
      { to: '/staff', label: 'Staff', icon: Users },
      { to: '/clients', label: 'Clients', icon: Building2 },
      { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    ];

    return (
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/90 z-40 shadow-lg px-2 py-1 safe-area-pb">
        <div className="flex items-center justify-around">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[56px] text-center ${
                    isActive
                      ? 'text-indigo-600 font-bold bg-indigo-50/70 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  // Mobile Bottom Nav for Worker / Staff User
  const userTabs = [
    { to: '/user/dashboard', label: 'Home', icon: Home },
    { to: '/user/my-duties', label: 'My Duties', icon: CalendarCheck },
    { to: '/user/add-duty', label: 'Add Duty', icon: Plus, isAction: true },
    { to: '/user/my-payments', label: 'Payments', icon: Wallet },
    { to: '/user/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/90 z-40 shadow-lg px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {userTabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-white transition-transform active:scale-95 group-hover:scale-105">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 mt-0.5">
                  {tab.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[56px] text-center ${
                  isActive
                    ? 'text-indigo-600 font-bold bg-indigo-50/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
