import { useState, useEffect } from 'react';
import {
  Moon, Sun, HelpCircle, LogOut, UserCircle
} from 'lucide-react';
import { AppProvider, useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import Sidebar from '@/components/Sidebar';
import GlobalFilters from '@/components/GlobalFilters';
import NotificationPanel from '@/components/NotificationPanel';
import TransactionModal from '@/components/TransactionModal';
import WelcomeGuide from '@/components/WelcomeGuide';
import LoginPage from '@/sections/LoginPage';
import Dashboard from '@/sections/Dashboard';
import Transactions from '@/sections/Transactions';
import Budgets from '@/sections/Budgets';
import ObjectifsSection from '@/sections/Objectifs';
import Calendrier from '@/sections/Calendrier';
import Rapports from '@/sections/Rapports';
import Analyse from '@/sections/Analyse';
import Parametres from '@/sections/Parametres';
import Admin from '@/sections/Admin';
import type { SectionId } from '@/types';

// ============================================================
// APP CONTENT (needs AppProvider context)
// ============================================================
function AppContent() {
  const { state, dispatch, syncObjectivesWithEpargne } = useApp();
  const { user, isAdmin, isActivated, displayName, loading, login, register, resetPassword, logout } = useAuth();
  const { notifications, show, remove } = useNotification();

  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({ year: String(state.currentYear), month: state.currentMonth, category: 'all', type: 'all', search: '' });
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Sync objectives on mount
  useEffect(() => {
    syncObjectivesWithEpargne();
  }, []);

  // Update filters when year/month change via dispatch
  useEffect(() => {
    setFilters(prev => ({ ...prev, year: String(state.currentYear), month: state.currentMonth }));
  }, [state.currentYear, state.currentMonth]);

  // Show guide on first visit
  useEffect(() => {
    if (user && !localStorage.getItem('guide_seen')) {
      const timer = setTimeout(() => setGuideOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleCloseGuide = () => {
    setGuideOpen(false);
    localStorage.setItem('guide_seen', 'true');
  };

  const handleToggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // Update year/month in state if changed
    if (newFilters.year !== String(state.currentYear)) {
      dispatch({ type: 'SET_YEAR', payload: parseInt(newFilters.year) });
    }
    if (newFilters.month !== 'all' && newFilters.month !== state.currentMonth) {
      dispatch({ type: 'SET_MONTH', payload: newFilters.month });
    }
  };

  // Check activation button
  const needsActivation = user && !isActivated;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (!user) {
    return (
      <>
        <LoginPage
          onLogin={async (email, password) => { await login(email, password); }}
          onRegister={async (firstName, lastName, email, password) => { await register(firstName, lastName, email, password); }}
          onResetPassword={async (email) => { await resetPassword(email); }}
          onNotify={show}
          loading={loading}
        />
        <NotificationPanel notifications={notifications} onRemove={remove} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Notifications */}
      <NotificationPanel notifications={notifications} onRemove={remove} />

      {/* Sidebar */}
      <div className="no-print">
        <Sidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300 p-6 lg:p-8 main-content"
        style={{ marginLeft: sidebarOpen ? '280px' : window.innerWidth >= 1024 ? '70px' : '0' }}
      >
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4 no-print">
          {/* Welcome Message */}
          {showWelcomeBanner && (
            <div className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-2xl p-5 mb-2 text-white">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-[60px] h-[60px] bg-white/20 rounded-full flex items-center justify-center text-2xl shrink-0">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Bonjour, {displayName} ! 👋</h3>
                  <p className="text-sm opacity-90">Bienvenue sur votre espace de gestion financiere</p>
                </div>
                {needsActivation && (
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="px-4 py-2 bg-amber-400 text-amber-900 rounded-xl text-sm font-semibold hover:bg-amber-300 transition-all"
                  >
                    🔑 Demander l'activation
                  </button>
                )}
                <button onClick={() => setShowWelcomeBanner(false)} className="text-white/60 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 no-print">
          <button
            onClick={() => setGuideOpen(true)}
            className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)]
                       flex items-center justify-center hover:bg-[var(--border)] transition-all shadow-lg"
            title="Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleTheme}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white
                       flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/30 transition-all shadow-lg"
            title="Theme"
          >
            {state.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Logout - top right */}
        <div className="fixed top-5 right-5 z-50 no-print">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold
                       flex items-center gap-2 hover:bg-[var(--border)] transition-all shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Deconnexion
          </button>
        </div>

        {/* Global Filters */}
        <div className="no-print">
          <GlobalFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Sections */}
        <div className="animate-[fadeIn_0.4s_ease]">
          {activeSection === 'dashboard' && (
            <Dashboard
              filters={filters}
              onNavigate={(section: string) => setActiveSection(section as SectionId)}
              onOpenTxModal={() => setTxModalOpen(true)}
            />
          )}
          {activeSection === 'transactions' && (
            <Transactions
              filters={filters}
              isActivated={isActivated}
              onNotify={show}
              onOpenGuide={() => setGuideOpen(true)}
            />
          )}
          {activeSection === 'budgets' && (
            <Budgets
              filters={filters}
              isActivated={isActivated}
              onNotify={show}
              onOpenGuide={() => setGuideOpen(true)}
            />
          )}
          {activeSection === 'objectifs' && (
            <ObjectifsSection
              isActivated={isActivated}
              onNotify={show}
              onOpenGuide={() => setGuideOpen(true)}
            />
          )}
          {activeSection === 'calendrier' && <Calendrier filters={filters} />}
          {activeSection === 'rapports' && <Rapports filters={filters} />}
          {activeSection === 'analyse' && <Analyse filters={filters} />}
          {activeSection === 'parametres' && (
            <Parametres
              isActivated={isActivated}
              onNotify={show}
              onOpenGuide={() => setGuideOpen(true)}
            />
          )}
          {activeSection === 'admin' && isAdmin && <Admin onNotify={show} />}
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal open={txModalOpen} onClose={() => setTxModalOpen(false)} />

      {/* Welcome Guide */}
      <WelcomeGuide open={guideOpen} onClose={handleCloseGuide} />
    </div>
  );
}

// ============================================================
// APP ROOT (provides context)
// ============================================================
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
