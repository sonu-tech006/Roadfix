import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { UserRole } from '../types.ts';
import { 
  Bell, 
  MapPin, 
  Search, 
  ShieldAlert, 
  User, 
  LogOut, 
  Layers, 
  CheckCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenReportModal?: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenReportModal,
  onOpenAuthModal
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleLabels: Record<UserRole, { title: string; badge: string }> = {
    citizen: { title: 'Priya Sharma (Citizen)', badge: 'Citizen' },
    local_admin: { title: 'Ramesh Kulkarni (Ward 14 Officer)', badge: 'Ward Admin' },
    district_admin: { title: 'Dr. Sunita Rao (District Magistrate)', badge: 'District Admin' },
    state_admin: { title: 'V.R. Ananthakrishnan (PWD Chief)', badge: 'State Admin' }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            type="button" 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 font-black tracking-tighter text-lg shadow-sm group-hover:bg-teal-700 transition-colors">
              RF
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors whitespace-nowrap">
                RoadFix
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-600 font-medium -mt-1">
                Civic Accountability
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-5 clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'home' ? 'text-teal-700 font-semibold border-b-2 border-teal-600 pb-0.5' : ''
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => onTabChange('map')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'map' ? 'text-teal-700 font-semibold border-b-2 border-teal-600 pb-0.5' : ''
            }`}
          >
            Public Map
          </button>

          <button
            type="button"
            onClick={() => onTabChange('track')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'track' ? 'text-teal-700 font-semibold border-b-2 border-teal-600 pb-0.5' : ''
            }`}
          >
            Track Issue
          </button>

          {/* Role specific dashboard link */}
          {user && (
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                currentTab === 'dashboard' ? 'text-teal-700 font-semibold border-b-2 border-teal-600 pb-0.5' : ''
              }`}
            >
              {user.role === 'citizen' ? 'My Complaints' : 'Admin Portal'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onTabChange('faq')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentTab === 'faq' ? 'text-teal-700 font-semibold border-b-2 border-teal-600 pb-0.5' : ''
            }`}
          >
            Transparency & FAQ
          </button>
        </nav>

        {/* Zone 3: Actions & Interactive Role Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Role Switcher for Testability */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
              title="Switch demo account to test Citizen or Admin capabilities"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>{user ? roleLabels[user.role]?.badge : 'Demo Switcher'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Personas (One-Click)
                </div>
                
                <button
                  type="button"
                  onClick={() => { switchDemoRole('citizen'); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${user?.role === 'citizen' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700'}`}
                >
                  <div>
                    <div className="font-medium">Citizen (Priya Sharma)</div>
                    <div className="text-[11px] text-slate-500">Report problems, track status, appeal</div>
                  </div>
                  {user?.role === 'citizen' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => { switchDemoRole('local_admin'); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${user?.role === 'local_admin' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700'}`}
                >
                  <div>
                    <div className="font-medium">Ward Admin (Ramesh Kulkarni)</div>
                    <div className="text-[11px] text-slate-500">Ward 14 queue, assign, complete repair</div>
                  </div>
                  {user?.role === 'local_admin' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => { switchDemoRole('district_admin'); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${user?.role === 'district_admin' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700'}`}
                >
                  <div>
                    <div className="font-medium">District Admin (Dr. Sunita Rao)</div>
                    <div className="text-[11px] text-slate-500">Bengaluru Urban, verify resolution, export</div>
                  </div>
                  {user?.role === 'district_admin' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => { switchDemoRole('state_admin'); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${user?.role === 'state_admin' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700'}`}
                >
                  <div>
                    <div className="font-medium">State Admin (V.R. Ananthakrishnan)</div>
                    <div className="text-[11px] text-slate-500">Karnataka PWD, SLA analytics, audit logs</div>
                  </div>
                  {user?.role === 'state_admin' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">
                      Notifications ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 6).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-xs ${!n.read ? 'bg-teal-50/40' : ''}`}
                        >
                          <div className="font-medium text-slate-800 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {n.createdAt.slice(11, 16)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenReportModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Problem</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
