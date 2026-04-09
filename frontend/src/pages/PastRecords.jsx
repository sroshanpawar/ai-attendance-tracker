import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { History, Calendar, Clock, ChevronRight, Inbox, Loader2 } from 'lucide-react';

export default function PastRecords() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/sessions');
        const validSessions = Array.isArray(response.data) ? response.data.filter(Boolean) : [];
        setSessions(validSessions);
      } catch (err) {
        setError('Failed to fetch sessions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleRowClick = (sessionId) => navigate(`/session/${sessionId}`);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Invalid Date'; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
            <History className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Past Records</h1>
        </div>
        <p className="text-slate-500 font-medium ml-[60px]">
          Click any session row to view detailed attendance records and reports.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold border border-rose-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Batch</th>
                <th className="px-6 py-4 font-bold">Subject</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">Loading sessions...</p>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3 drop-shadow-sm" />
                    <p className="text-sm font-medium text-slate-500">
                      No past sessions found. Start a new session to see records here.
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => handleRowClick(session.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary text-sm tracking-wide">
                        {session.class_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-md">
                        {session.batch || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">
                          {formatDate(session.session_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">
                          {formatTime(session.session_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-5 h-5 text-slate-300 inline-block group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
