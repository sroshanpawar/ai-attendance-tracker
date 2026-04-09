import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Layers, LayoutGrid } from 'lucide-react';

export default function ManageHub() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Manage Batches',
      desc: 'Create or remove class batches.',
      Icon: Layers,
      colorClass: 'text-purple-500 bg-purple-50',
      path: '/manage/batches'
    },
    {
      title: 'Enroll Student',
      desc: 'Capture biometric data and assign to batches.',
      Icon: UserPlus,
      colorClass: 'text-emerald-500 bg-emerald-50',
      path: '/manage/enroll'
    },
    {
      title: 'Manage Roster',
      desc: 'View roster, edit batches, or remove students.',
      Icon: Users,
      colorClass: 'text-blue-500 bg-blue-50',
      path: '/manage/students'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Manage Hub
          </h1>
          <p className="text-slate-500 font-medium mt-1">Select an action to continue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => navigate(card.path)}
            className="group relative bg-white rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2 hover:border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            <div className={`p-4 rounded-2xl mb-6 transition-transform duration-300 group-hover:scale-110 ${card.colorClass}`}>
              <card.Icon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-primary mb-2">
              {card.title}
            </h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[200px]">
              {card.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
