import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import api from '../lib/axios';
import { Users, CalendarDays, Webhook, PlaySquare, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

function StatTile({ title, value, subtext, Icon, colorClass, loading }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
        <div className={`p-2.5 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {loading ? (
        <Loader2 className={`w-6 h-6 animate-spin ${colorClass.text} mt-2`} />
      ) : (
        <div className="text-4xl font-extrabold text-primary tracking-tight">
          {value}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-4">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-semibold text-emerald-500">{subtext}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userFullName, setUserFullName] = useState('');
  const [stats, setStats] = useState({ students: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadataName = session.user.user_metadata?.full_name;
        const emailName = session.user.email?.split('@')[0];
        setUserFullName(metadataName || emailName || 'Administrator');
      }
    });

    const fetchStats = async () => {
      try {
        const [studentsRes, sessionsRes] = await Promise.all([
          api.get('/students'),
          api.get('/sessions'),
        ]);
        setStats({
          students: studentsRes.data.length || 0,
          sessions: sessionsRes.data.length || 0,
        });
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight flex items-center gap-2 mb-1">
            {greeting}, {userFullName}! <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-slate-500 font-semibold">AI Attendance Tracker — Premium Dashboard</p>
        </div>
        <div className="hidden md:block">
          <div className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 shadow-sm border border-slate-100">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
        <StatTile
          title="Total Enrolled Students"
          value={stats.students}
          subtext="+5% this month"
          Icon={Users}
          colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
          loading={loading}
        />
        <StatTile
          title="Sessions Conducted"
          value={stats.sessions}
          subtext="Consistent tracking"
          Icon={CalendarDays}
          colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
          loading={loading}
        />
        <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center items-center text-center transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1">
          <Webhook className="w-12 h-12 text-emerald-500 mb-3 drop-shadow-sm" />
          <h3 className="text-xl font-extrabold text-primary">Engine Active</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">AI face recognition is ready</p>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Recent Logs (Left Widget) */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-6 flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h3 className="text-xl font-extrabold text-primary">Recent Attendance Logs</h3>
            <span className="bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">
              Last 7 days
            </span>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-slate-100 px-4 flex-shrink-0">
              <div className="col-span-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</div>
              <div className="col-span-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Session Info</div>
              <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</div>
            </div>

            <div className="mt-2 space-y-1 overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ minHeight: 0 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-4 py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors items-center cursor-default shrink-0">
                  <div className="col-span-4 font-semibold text-sm text-primary">
                    {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                  </div>
                  <div className="col-span-4 lg:col-span-5 text-sm text-slate-500 font-medium tracking-wide truncate">
                    Math 101 Advanced Batch
                  </div>
                  <div className="col-span-4 lg:col-span-3 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions & Alerts (Right Widget) */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          {/* Quick Start */}
          <div className="bg-gradient-to-br from-primary to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden flex-1 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex flex-col justify-center">
            <Webhook className="w-48 h-48 absolute -right-8 -top-8 text-white/5" />
            <div className="relative z-10">
              <h3 className="text-xl font-extrabold mb-2">Live Session</h3>
              <p className="text-slate-300 text-sm leading-relaxed font-medium mb-4">
                Launch the recognition camera to begin marking attendance instantly.
              </p>
              <button 
                onClick={() => navigate('/mark-attendance')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm w-fit"
              >
                <PlaySquare className="w-4 h-4" />
                Launch Scanner
              </button>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex-shrink-0">
            <h3 className="text-base font-extrabold text-primary mb-4">System Details</h3>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Camera Permissions</h4>
                <p className="text-xs font-medium text-amber-700 mt-1 leading-relaxed">
                  Ensure modern browser permissions are active to utilize the scanner payload.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
