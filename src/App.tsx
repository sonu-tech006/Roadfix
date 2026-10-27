import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { CitizenDashboard } from './pages/CitizenDashboard.tsx';
import { LocalAdminDashboard } from './pages/LocalAdminDashboard.tsx';
import { DistrictAdminDashboard } from './pages/DistrictAdminDashboard.tsx';
import { StateAdminDashboard } from './pages/StateAdminDashboard.tsx';
import { PublicTrackingPage } from './pages/PublicTrackingPage.tsx';
import { FAQPage } from './pages/FAQPage.tsx';
import { InteractiveMap } from './components/InteractiveMap.tsx';
import { ReportComplaintModal } from './components/ReportComplaintModal.tsx';
import { ComplaintDetailModal } from './components/ComplaintDetailModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { IComplaint } from './types.ts';

const MainApp: React.FC = () => {
  const { user, token } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedComplaint, setSelectedComplaint] = useState<IComplaint | null>(null);
  const [trackingReference, setTrackingReference] = useState<string>('RF-2026-8941');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Public complaints for map view
  const [publicComplaints, setPublicComplaints] = useState<Partial<IComplaint>[]>([]);

  const loadPublicComplaints = async () => {
    try {
      const res = await fetch('/api/complaints/public');
      if (res.ok) {
        const data = await res.json();
        setPublicComplaints(data);
      }
    } catch (err) {
      console.warn('Error fetching public complaints:', err);
    }
  };

  useEffect(() => {
    loadPublicComplaints();
  }, []);

  const handleSelectComplaint = async (partialComplaint: Partial<IComplaint>) => {
    if (partialComplaint.id && token) {
      try {
        const res = await fetch(`/api/complaints/${partialComplaint.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const full = await res.json();
          setSelectedComplaint(full);
          setIsDetailModalOpen(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to load full complaint:', err);
      }
    }

    // Fallback: if not authenticated or public view
    if (partialComplaint.reference) {
      setTrackingReference(partialComplaint.reference);
      setCurrentTab('track');
    }
  };

  const handleTrackReference = (ref: string) => {
    setTrackingReference(ref);
    setCurrentTab('track');
  };

  const handleComplaintCreated = (newComplaint: IComplaint) => {
    loadPublicComplaints();
    setSelectedComplaint(newComplaint);
    setIsDetailModalOpen(true);
  };

  const handleComplaintUpdated = (updated: IComplaint) => {
    loadPublicComplaints();
    setSelectedComplaint(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenReportModal={() => {
          if (!user) {
            setIsAuthModalOpen(true);
          } else {
            setIsReportModalOpen(true);
          }
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            onOpenReportModal={() => {
              if (!user) setIsAuthModalOpen(true);
              else setIsReportModalOpen(true);
            }}
            onSelectComplaint={handleSelectComplaint}
            onTrackReference={handleTrackReference}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'map' && (
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Statewide Interactive Damage Map
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Explore reported road potholes, damaged dividers, and verified repair completions with real GPS coordinates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!user) setIsAuthModalOpen(true);
                  else setIsReportModalOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                + Report New Road Problem
              </button>
            </div>

            <InteractiveMap
              complaints={publicComplaints}
              onSelectComplaint={handleSelectComplaint}
              height="75vh"
            />
          </div>
        )}

        {currentTab === 'track' && (
          <PublicTrackingPage
            initialReference={trackingReference}
            onSelectComplaint={handleSelectComplaint}
          />
        )}

        {currentTab === 'dashboard' && (
          <>
            {user?.role === 'citizen' && (
              <CitizenDashboard
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setIsDetailModalOpen(true);
                }}
              />
            )}

            {user?.role === 'local_admin' && (
              <LocalAdminDashboard
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setIsDetailModalOpen(true);
                }}
              />
            )}

            {user?.role === 'district_admin' && (
              <DistrictAdminDashboard
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setIsDetailModalOpen(true);
                }}
              />
            )}

            {user?.role === 'state_admin' && (
              <StateAdminDashboard
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setIsDetailModalOpen(true);
                }}
              />
            )}
          </>
        )}

        {currentTab === 'faq' && <FAQPage />}
      </main>

      {/* Footer */}
      <Footer onNavigateTab={setCurrentTab} />

      {/* Modals */}
      <ReportComplaintModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onComplaintCreated={handleComplaintCreated}
      />

      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onComplaintUpdated={handleComplaintUpdated}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
