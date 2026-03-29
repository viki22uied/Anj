import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types/game.types';

// Mock html2canvas for now - will be imported properly
const html2canvas = async (element: HTMLElement) => {
  // Placeholder implementation
  return {
    toBlob: (callback: (blob: Blob | null) => void) => {
      callback(new Blob(['mock-image'], { type: 'image/png' }));
    }
  };
};

export const DataExport: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const { gameState, profile, seasonHistory } = useGameStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [showCopied, setShowCopied] = useState(false);

  // Calculate statistics
  const totalIncome = seasonHistory?.reduce((sum, s) => sum + s.netIncome, 0) || gameState?.netIncome || 45000;
  const totalInterestSaved = (seasonHistory || []).reduce((sum, s) => {
    return sum + (s.usedMoneylender ? 0 : s.kccInterestPaid || 600);
  }, 0);
  const totalInsurancePayout = (seasonHistory || []).reduce((sum, s) => sum + (s.pmfbyClaimReceived || 0), 0);
  const samriddhiScore = gameState?.samriddhiScore || 85;
  const badges = gameState?.badges || [];

  // Calculate behavioral change
  const s1UsedMoneylender = seasonHistory?.[0]?.usedMoneylender ?? true;
  const s5UsedMoneylender = seasonHistory?.[4]?.usedMoneylender ?? false;
  const s1FormalPercent = s1UsedMoneylender ? 0 : 100;
  const s5FormalPercent = s5UsedMoneylender ? 0 : 100;
  const pmfbyCount = (seasonHistory || []).filter(s => s.enrolledPMFBY).length;
  const enwrCount = (seasonHistory || []).filter(s => s.usedENWR).length;

  const handleShare = async () => {
    const text = t('report.shareText', 'मैंने Anaj-Arth में {score} समृद्धि अंक पाए! #AnajArth #KisanShakti', { score: samriddhiScore });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anaj-Arth Report',
          text: text,
        });
      } catch {
        // User cancelled
      }
    } else {
      // WhatsApp deep link fallback
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSaveImage = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `AnajArth_${profile?.name || 'Farmer'}_Report.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch {
      alert(t('report.saveError', 'फोटो सेव नहीं हुआ'));
    }
  };

  const handleCopyText = () => {
    const text = `
Anaj-Arth Report
================
किसान: ${profile?.name || 'Unknown'}
राज्य: ${profile?.state || 'Unknown'}
फसल: ${profile?.primaryCrop || 'Unknown'}
ज़मीन: ${profile?.landHoldingHectares || 2} हेक्टेयर

समृद्धि स्कोर: ${samriddhiScore}
कुल कमाई: ₹${totalIncome.toLocaleString()}
ब्याज बचाया: ₹${totalInterestSaved.toLocaleString()}
बीमे से मिला: ₹${totalInsurancePayout.toLocaleString()}

उपलब्धियाँ: ${badges.length}/12

#AnajArth #KisanShakti
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              if (onBack) return onBack();
              window.history.back();
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h1 className="text-xl text-gray-900 font-bold">
            {t('export.title')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Report Card */}
        <div 
          ref={reportRef}
          className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
          style={{ aspectRatio: '3/4' }}
        >
          {/* Header Section */}
          <div className="bg-green-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🌾</span>
              <div>
                <h2 className="text-2xl font-bold">{profile?.name || 'Farmer'}</h2>
                <p className="opacity-90">{t('export.subtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full">
                {profile?.state || 'State'} | {profile?.primaryCrop || 'Crop'} | {profile?.landHoldingHectares || 2} ha
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-1">⭐</p>
              <p className="text-2xl text-green-700 font-bold">{samriddhiScore}</p>
              <p className="text-xs text-gray-600">{t('export.score')}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-1">💰</p>
              <p className="text-xl text-green-700 font-bold">₹{(totalIncome / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-600">{t('export.totalIncome')}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-1">🏦</p>
              <p className="text-xl text-green-700 font-bold">₹{totalInterestSaved.toLocaleString()}</p>
              <p className="text-xs text-gray-600">{t('export.totalInterest')}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-1">🛡️</p>
              <p className="text-xl text-green-700 font-bold">₹{totalInsurancePayout.toLocaleString()}</p>
              <p className="text-xs text-gray-600">{t('export.insuranceReceived')}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 mb-3 font-medium">
              {t('export.badges')}: {badges.length}/12
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 8).map((badge) => (
                <span key={badge.id} className="text-2xl" title={badge.nameKey}>
                  🏆
                </span>
              ))}
              {badges.length === 0 && (
                <span className="text-gray-400 text-sm">{t('export.noBadges')}</span>
              )}
            </div>
          </div>

          {/* Behavioral Change */}
          <div className="px-6 pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {t('export.learningProgress')}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('export.usedKCC')}</span>
                <span className="font-semibold">{s1FormalPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('export.usedKCC')}</span>
                <span className="font-semibold text-green-700">{s5FormalPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('export.enrolledPMFBY')}</span>
                <span className="font-semibold">{pmfbyCount}/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('export.usedENWR')}</span>
                <span className="font-semibold">{enwrCount} {t('common.times')}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-4 text-center">
            <p className="text-xs text-gray-600">
              Anaj-Arth | NCFE Innovate4FinLit
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('export.realWorld')}:<br/>
              KCC: jansamarth.in | PMFBY: pmfby.gov.in
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <span>📤</span> {t('export.shareWhatsApp')}
          </button>

          <button
            onClick={handleSaveImage}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <span>💾</span> {t('export.saveImage')}
          </button>

          <button
            onClick={handleCopyText}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <span>📋</span> {t('export.copyText')}
          </button>

          {showCopied && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-green-600 font-medium"
            >
              ✅ {t('export.copied')}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExport;
