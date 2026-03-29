import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './locales/i18n';
import { useGameStore } from './store/gameStore';
import { useOffline, useIsPWA } from './hooks/useOffline';
import { CROP_BASE_DATA } from './data/crops';

import OnboardingFlow from './screens/Onboarding/OnboardingFlow';
import FarmDashboard from './screens/Dashboard/FarmDashboard';
import MandiArena from './screens/NegotiationBattle/MandiArena';
import LoanComparison from './screens/CreditEngine/LoanComparison';
import InsuranceShield from './screens/InsuranceShield/InsuranceShield';
import GoldenGodown from './screens/GoldenGodown/GoldenGodown';
import SeasonRecap from './screens/SeasonRecap/SeasonRecap';
import GameFinale from './screens/SeasonRecap/GameFinale';
import LoanRepayment from './screens/Dashboard/LoanRepayment';
import InputPurchase from './screens/Dashboard/InputPurchase';
import HarvestDecision from './screens/Dashboard/HarvestDecision';
import KCCDraw from './screens/Dashboard/KCCDraw';
import EventModal from './screens/Events/EventModal';
import MarketPrices from './screens/Dashboard/MarketPrices';
import BadgesGallery from './screens/Dashboard/BadgesGallery';

// New Feature Screens
import Settings from './screens/Settings';
import ProfileEdit from './screens/ProfileEdit';
import GroupPlay from './screens/GroupPlay';
import PriceAlerts from './screens/PriceAlerts';
import SeasonComparison from './screens/SeasonComparison';
import SchemeCenter from './screens/SchemeCenter';
import DataExport from './screens/DataExport';
import VoiceTutorial from './screens/VoiceTutorial';
import GradingGame from './screens/mini-games/GradingGame';
import MandiMath from './screens/mini-games/MandiMath';
import WeatherRisk from './screens/mini-games/WeatherRisk';
import NegotiationTrainer from './screens/mini-games/NegotiationTrainer';

import SoundManager from './utils/SoundManager';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { t, i18n } = useTranslation();
  const { gameState, farmer, resetGame } = useGameStore();
  const isHi = (i18n.language || '').startsWith('hi');
  
  // Custom router state
  const [screen, setScreen] = useState('onboarding');
  
  const { isOffline } = useOffline();
  const isPWA = useIsPWA();

  // Root Navigation Guardian
  useEffect(() => {
    if (!gameState || !farmer) {
      setScreen('onboarding');
      return;
    }
    
    // Check for season end or finale
    if (gameState.seasonEndReached && screen !== 'recap') {
      if (gameState.seasonNumber === 5) {
        setScreen('finale');
      } else {
        setScreen('recap');
      }
      return;
    }

    // Check for forced harvest decision screen
    const crop = CROP_BASE_DATA[farmer.primaryCrop];
    if (crop && gameState.currentMonth === crop.harvestMonths[0] && !gameState.harvestComplete) {
      if (screen !== 'harvest_decision') {
         setScreen('harvest_decision');
      }
    }
    
    // Fallback to dashboard if just initialized
    else if (screen === 'onboarding') {
      setScreen('dashboard');
    }

  }, [gameState, farmer, screen]);

  const handleOnboardingComplete = () => setScreen('dashboard');
  const handleNavigate = (s: string) => setScreen(s);
  const handleBack = () => setScreen('dashboard');
  
  const handleSignOut = () => {
    if (window.confirm(isHi ? 'क्या आप सच में गेम रीसेट करना चाहते हैं? सारी प्रोग्रेस डिलीट हो जाएगी।' : 'Are you sure you want to reset the game? All progress will be deleted.')) {
      resetGame();
      setScreen('onboarding');
    }
  };

  const isMainTab = ['dashboard', 'godown', 'credit', 'insurance', 'market'].includes(screen) && gameState !== null;

  // Handle Modal overlay for events
  const showEventModal = screen.startsWith('event_');
  const eventId = showEventModal ? screen.replace('event_', '') : null;

  return (
    <div className={`min-h-screen relative pb-20 ${gameState?.currentEmotion === 'dread' ? 'emotion-dread' : gameState?.currentEmotion === 'pressure' ? 'emotion-pressure' : gameState?.currentEmotion === 'hope' ? 'emotion-hope' : gameState?.currentEmotion === 'relief' ? 'emotion-relief' : 'bg-slate-100'} transition-all duration-700`}>
      <SoundManager />
      
      {/* Top Bar - Profile & Global Sign Out */}
      {gameState && isMainTab && (
        <div className="flex justify-between items-center px-4 py-3 shadow-sm bg-white fixed top-0 w-full z-10 transition-colors border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 border border-amber-200 text-lg">
               👨‍🌾
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{farmer?.name}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{farmer?.state} · {isHi ? 'हेक्टेयर' : 'Hectares'}: {farmer?.landHoldingHectares}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-[10px] uppercase tracking-widest font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors border border-red-100">
            {isHi ? 'बाहर निकलें' : 'Sign Out'}
          </button>
        </div>
      )}

      {/* Main Content Render Area */}
      <div className={`pt-${isMainTab ? '16' : '0'}`}>
        <AnimatePresence mode="wait">
          
          {screen === 'onboarding' && !gameState && <OnboardingFlow key="onboarding" onComplete={handleOnboardingComplete} />}
          {screen === 'dashboard' && gameState && <FarmDashboard key="dashboard" onNavigate={handleNavigate} />}
          {screen === 'harvest_decision' && gameState && <HarvestDecision key="harvest" onNavigate={handleNavigate} />}
          {screen === 'negotiation' && gameState && <MandiArena key="negotiation" onBack={handleBack} />}
          {screen === 'credit' && gameState && <LoanComparison key="credit" onBack={handleBack} />}
          {screen === 'insurance' && gameState && <InsuranceShield key="insurance" onBack={handleBack} />}
          {screen === 'godown' && gameState && <GoldenGodown key="godown" onBack={handleBack} />}
          {screen === 'recap' && gameState && <SeasonRecap key="recap" onContinue={handleBack} />}
          {screen === 'finale' && gameState && <GameFinale key="finale" onRestart={() => handleSignOut()} onHome={handleBack} />}
          
          {screen === 'repay' && gameState && <LoanRepayment key="repay" onBack={handleBack} />}
          {screen === 'inputs' && gameState && <InputPurchase key="inputs" onBack={handleBack} />}
          {screen === 'kcc_draw' && gameState && <KCCDraw key="kcc_draw" onBack={handleBack} />}
          
          {screen === 'market' && gameState && <MarketPrices key="market" onBack={handleBack} />}
          {screen === 'achievements' && gameState && <BadgesGallery key="achievements" onBack={handleBack} />}
          
          {/* New Feature Routes */}
          {screen === 'settings' && gameState && (
            <ErrorBoundary key="settings" screenName="Settings">
              <Settings onBack={handleBack} />
            </ErrorBoundary>
          )}
          {screen === 'profile-edit' && gameState && (
            <ErrorBoundary key="profile" screenName="ProfileEdit">
              <ProfileEdit onBack={handleBack} onNavigate={handleNavigate} />
            </ErrorBoundary>
          )}
          {screen === 'group-play' && gameState && (
            <ErrorBoundary key="group" screenName="GroupPlay">
              <GroupPlay onBack={handleBack} />
            </ErrorBoundary>
          )}
          {screen === 'price-alerts' && gameState && (
            <ErrorBoundary key="alerts" screenName="PriceAlerts">
              <PriceAlerts onBack={handleBack} />
            </ErrorBoundary>
          )}
          {screen === 'season-compare' && gameState && (
            <ErrorBoundary key="compare" screenName="SeasonComparison">
              <SeasonComparison onBack={handleBack} onNavigate={handleNavigate} />
            </ErrorBoundary>
          )}
          {screen === 'schemes' && gameState && (
            <ErrorBoundary key="schemes" screenName="SchemeCenter">
              <SchemeCenter onBack={handleBack} onNavigate={handleNavigate} />
            </ErrorBoundary>
          )}
          {screen === 'export' && gameState && (
            <ErrorBoundary key="export" screenName="DataExport">
              <DataExport onBack={handleBack} />
            </ErrorBoundary>
          )}
          {screen === 'voice-tutorial' && gameState && (
            <ErrorBoundary key="vtutorial" screenName="VoiceTutorial">
              <VoiceTutorial onComplete={handleBack} />
            </ErrorBoundary>
          )}
          
          {/* Mini Games */}
          {screen === 'grading-game' && gameState && (
            <ErrorBoundary key="grading" screenName="GradingGame">
              <GradingGame onComplete={() => handleNavigate('dashboard')} />
            </ErrorBoundary>
          )}
          {screen === 'mandi-math' && gameState && (
            <ErrorBoundary key="math" screenName="MandiMath">
              <MandiMath onComplete={() => handleNavigate('dashboard')} />
            </ErrorBoundary>
          )}
          {screen === 'weather-risk' && gameState && (
            <ErrorBoundary key="weather" screenName="WeatherRisk">
              <WeatherRisk onComplete={() => handleNavigate('dashboard')} />
            </ErrorBoundary>
          )}
          {screen === 'negotiation-trainer' && gameState && (
            <ErrorBoundary key="ntrainer" screenName="NegotiationTrainer">
              <NegotiationTrainer onComplete={() => handleNavigate('dashboard')} />
            </ErrorBoundary>
          )}
        </AnimatePresence>
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {showEventModal && eventId && <EventModal eventId={eventId} onBack={handleBack} />}
      </AnimatePresence>

      {/* Persistence / Connectivity Toasts */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-[10px] uppercase font-bold tracking-widest z-50 shadow">
          📡 {isHi ? 'ऑफ़लाइन सक्रिय — डेटा स्थानीय स्तर पर सहेजा गया' : 'Offline Mode Active — Data Saved Locally'}
        </div>
      )}
      {!isPWA && typeof window !== 'undefined' && (
        <div className="fixed bottom-[72px] left-0 right-0 text-center py-1.5 text-[10px] uppercase font-bold tracking-widest bg-white/90 backdrop-blur border-t border-slate-100 text-slate-400 z-40">
          📱 {isHi ? 'ब्राउज़र मेनू से ऐप (PWA) इंस्टॉल करें' : 'Install as App (PWA) from browser menu'}
        </div>
      )}

      {/* Bottom Global Navigation */}
      <AnimatePresence>
        {isMainTab && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bottom-nav z-50 fixed bottom-0 left-0 right-0 pb-safe">
            <NavBtn icon="🏠" label={isHi ? 'खेत' : 'Farm'} active={screen === 'dashboard'} onClick={() => setScreen('dashboard')} />
            <NavBtn icon="🏛️" label={isHi ? 'गोदाम' : 'Godown'} active={screen === 'godown'} onClick={() => setScreen('godown')} />
            <NavBtn icon="🛡️" label={isHi ? 'बीमा' : 'Bima'} active={screen === 'insurance'} onClick={() => setScreen('insurance')} />
            <NavBtn icon="🏦" label={isHi ? 'कर्ज़' : 'Credit'} active={screen === 'credit'} onClick={() => setScreen('credit')} />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''} cursor-pointer`} onClick={onClick}>
      <span className="emoji">{icon}</span>
      <span className="mt-1 font-bold tracking-wide">{label}</span>
    </div>
  );
}

export default App;
