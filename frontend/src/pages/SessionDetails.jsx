import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { 
  ArrowLeft, Download, Calendar, Clock, Timer, Layers, 
  CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Inbox, Loader2 
} from 'lucide-react';
import { cn } from '../lib/utils';

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className={`bg-white border rounded-2xl p-5 flex items-center gap-4 shadow-sm transition-all hover:shadow-md ${colorClass.border}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass.bg} ${colorClass.text}`}>
        <Icon className="w-6 h-6 outline-none" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-extrabold text-primary mt-0.5">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPresent = status === 'Present';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border",
      isPresent 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
        : "bg-rose-50 text-rose-700 border-rose-200"
    )}>
      {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
}

function LivenessBadge({ verified }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-cyan-600 text-xs font-bold" title="Liveness verified via blink detection">
        <ShieldCheck className="w-4 h-4" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
      <ShieldAlert className="w-4 h-4 opacity-50" />
      —
    </span>
  );
}

export default function SessionDetails() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [sessionRes, attendanceRes] = await Promise.all([
          api.get(`/session/${sessionId}`),
          api.get(`/session/${sessionId}/attendance`),
        ]);
        setSessionInfo(sessionRes.data);
        setAttendanceRecords(attendanceRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchData();
  }, [sessionId]);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await api.get(`/report/${sessionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `report_session_${sessionId}.pdf`;
      if (sessionInfo) {
        const batchStr = sessionInfo.class_name || 'Batch';
        const cleanBatch = batchStr.replace(/[^a-zA-Z0-9_\-]/g, '');
        const cleanTime = (sessionInfo.session_time || '').replace(/:/g, '-');
        filename = `Attendance_Report_${cleanBatch}_${sessionInfo.session_date}_${cleanTime}.pdf`;
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sessionInfo) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/past-records')} className="flex items-center gap-2 text-slate-500 font-semibold mb-6 hover:text-slate-800">
          <ArrowLeft className="w-5 h-5" /> Back to Records
        </button>
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-100 font-bold">
          {error || 'Session data could not be found.'}
        </div>
      </div>
    );
  }

  const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/past-records')} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Past Records
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            {sessionInfo.class_name || 'Session Details'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">{sessionInfo.batch || ''}</p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-primary hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Download PDF Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Layers} label="Batch" value={sessionInfo.class_name} 
          colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }} 
        />
        <StatCard 
          icon={Calendar} label="Date" value={formatDate(sessionInfo.session_date)} 
          colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' }} 
        />
        <StatCard 
          icon={Clock} label="Time" value={sessionInfo.session_time} 
          colorClass={{ bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' }} 
        />
        <StatCard 
          icon={Timer} label="Duration" value={sessionInfo.duration_minutes ? `${sessionInfo.duration_minutes} min` : 'N/A'} 
          colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' }} 
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" /> {presentCount} Present
        </div>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-700 text-xs font-bold">
          <XCircle className="w-4 h-4" /> {absentCount} Absent
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-16 text-center">#</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Attentive Time</th>
                <th className="px-6 py-4 text-center">Liveness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No attendance records found for this session.</p>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, index) => (
                  <tr key={record.student_id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-100">
                          {record.student_name?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <span className="font-bold text-primary text-sm">
                          {record.student_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-mono font-medium text-slate-500">
                        {record.attentive_seconds != null ? `${record.attentive_seconds}s` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <LivenessBadge verified={record.liveness_verified} />
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
