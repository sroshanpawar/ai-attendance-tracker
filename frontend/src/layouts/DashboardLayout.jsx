import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, UserPlus, FileClock, Webhook, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Manage Hub', href: '/manage', icon: Users },
  { name: 'Mark Attendance', href: '/mark-attendance', icon: Webhook },
  { name: 'Past Records', href: '/past-records', icon: FileClock },
];

export default function DashboardLayout({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-primary flex flex-col transition-all duration-300 shadow-[20px_0_40px_rgba(0,0,0,0.04)] z-20">
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xl ring-4 ring-accent/20">
              AI
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              Attendance
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent ring-1 ring-accent/20 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden">
              {session?.user?.user_metadata?.full_name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session?.user?.user_metadata?.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden isolates relative">
        <div className="flex-1 overflow-auto p-8 lg:px-12 lg:py-10">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
