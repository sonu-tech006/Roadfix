import React from 'react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6 mt-16 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-teal-400 font-bold text-xs">
            RF
          </div>
          <span className="font-bold text-slate-900">RoadFix</span>
          <span>·</span>
          <span>Road Damage Reporting & Repair Accountability Platform</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="hover:text-slate-900 transition-colors"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('map')}
            className="hover:text-slate-900 transition-colors"
          >
            Public Map
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('track')}
            className="hover:text-slate-900 transition-colors"
          >
            Track Reference
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('faq')}
            className="hover:text-slate-900 transition-colors"
          >
            FAQ & Support
          </button>
        </div>

        <div className="text-right text-[11px] text-slate-400">
          <span>Compliant with Ministry of Road Transport IRC standards.</span>
        </div>
      </div>
    </footer>
  );
};
