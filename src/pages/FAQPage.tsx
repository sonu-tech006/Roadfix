import React, { useState } from 'react';
import { HelpCircle, Shield, FileText, Send, CheckCircle2 } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How does RoadFix route complaints to the right department?',
      a: 'RoadFix maps the reported road location, road type (arterial highway vs. residential ward lane), and administrative boundary. Residential streets are routed to the local Panchayat or Ward engineer, while state highways and ring roads are routed directly to the State Public Works Department (PWD).'
    },
    {
      q: 'Can a repair be marked "Resolved" without photographic evidence?',
      a: 'No. The RoadFix platform enforces a strict two-step verification policy. An authorized maintenance squad or local engineer must upload post-repair completion photographs and describe the work done. A district-level administrator must then review and verify the evidence before the status transitions to Resolved.'
    },
    {
      q: 'What happens if another citizen has already reported the same pothole?',
      a: 'Before you submit a complaint, RoadFix runs a geospatial search within a 600-meter radius. If an active complaint exists on the same street, it is shown to you. You can choose to follow that complaint to receive updates or proceed with a separate submission if your report covers a distinct or exacerbated hazard.'
    },
    {
      q: 'How is citizen privacy protected on public pages?',
      a: 'Public tracking and interactive map views display only road names, damage categories, photographs, and status progress. Personal phone numbers, email addresses, and home addresses are never published.'
    },
    {
      q: 'What if a completed repair degrades or fails again?',
      a: 'Every citizen has the right to file an appeal or reopen a complaint directly through their dashboard. The complaint is re-opened, flagged as a recurring location, and routed back to the supervising authority with recorded audit history.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmittedMessage(true);
  };

  return (
    <div className="space-y-12 py-8 px-4 sm:px-6 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Transparency, FAQ & Civic Policy
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          RoadFix is built on civic transparency, open data standards, and verifiable accountability for road infrastructure maintenance.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900">
                {faq.q}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Support Inquiry Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">
            Civic Feedback & Administrative Inquiry
          </h2>
        </div>

        {submittedMessage ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Thank you. Your message has been logged with the RoadFix civic oversight ombudsman.</span>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Message or Inquiries</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Inquire regarding jurisdiction boundaries, road repair standards, or platform policies..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Civic Message</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
