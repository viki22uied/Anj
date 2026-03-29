import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';

interface PriceAlert {
  id: string;
  type: 'above' | 'below';
  target: number;
  crop: string;
}

export const PriceAlerts: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const { gameState } = useGameStore();
  const { addPriceAlert, removePriceAlert, priceAlerts } = useSettingsStore();
  
  const [targetPrice, setTargetPrice] = useState(gameState?.currentMarketPrice || 2000);
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');

  const currentPrice = gameState?.currentMarketPrice || 2000;
  const mspPrice = gameState?.mspPrice || 2275;
  const historicalPeak = Math.round(mspPrice * 1.15);
  const grainStored = (gameState?.grainInGodownQuintals || 0) + (gameState?.grainOnFarmQuintals || 0);

  const setAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      type: alertType,
      target: targetPrice,
      crop: (gameState as any)?.primaryCrop || 'wheat',
    };
    addPriceAlert(newAlert);
  };

  const removeAlert = (id: string) => {
    removePriceAlert(id);
  };

  const projectedRevenue = grainStored * targetPrice;
  const currentRevenue = grainStored * currentPrice;
  const difference = projectedRevenue - currentRevenue;

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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl text-gray-900 font-bold">
            {t('priceAlerts.title')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Current Status */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg text-gray-900 mb-4 font-bold">
            {t('priceAlerts.currentPrice')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('priceAlerts.currentPrice')}</p>
              <p className="text-xl text-gray-900 font-bold">₹{currentPrice}/{t('common.quintal')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('priceAlerts.mspPrice')}</p>
              <p className="text-xl text-green-700 font-bold">₹{mspPrice}/{t('common.quintal')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('common.historicalPeak')}</p>
              <p className="text-xl text-amber-700 font-bold">₹{historicalPeak}/{t('common.quintal')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('common.trend')}</p>
              <p className="text-xl text-gray-900 font-bold">📈 {t('common.rising')}</p>
            </div>
          </div>
        </div>

        {/* Set Alert */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg text-gray-900 mb-4 font-bold">
            {alertType === 'above' 
              ? t('priceAlerts.above')
              : t('priceAlerts.below')
            }
          </h2>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAlertType('above')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all
                ${alertType === 'above' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
            >
              📈 {t('priceAlerts.above')}
            </button>
            <button
              onClick={() => setAlertType('below')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all
                ${alertType === 'below' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
            >
              📉 {t('priceAlerts.below')}
            </button>
          </div>

          {/* Price Input */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setTargetPrice(Math.max(1000, targetPrice - 100))}
              className="w-12 h-12 bg-gray-100 rounded-full font-bold text-xl"
            >
              -100
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl text-gray-900 font-bold">₹{targetPrice}</span>
              <span className="text-gray-500 text-sm">/{t('common.quintal')}</span>
            </div>
            <button
              onClick={() => setTargetPrice(Math.min(5000, targetPrice + 100))}
              className="w-12 h-12 bg-gray-100 rounded-full font-bold text-xl"
            >
              +100
            </button>
          </div>

          {/* Quick Set Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTargetPrice(mspPrice)}
              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
            >
              {t('priceAlerts.setTarget')} MSP
            </button>
            <button
              onClick={() => setTargetPrice(Math.round(historicalPeak * 0.95))}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
            >
              95% {t('common.historicalPeak')}
            </button>
          </div>

          {/* Projection */}
          {grainStored > 0 && (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="font-medium text-green-800">
                {grainStored} {t('common.quintal')} @ ₹{targetPrice}:
              </p>
              <p className="text-xl text-green-700 font-bold mt-1">
                ₹{projectedRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString()} {t('common.difference')}
              </p>
            </div>
          )}

          <button
            onClick={setAlert}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
          >
            ✅ {t('priceAlerts.setTarget')}
          </button>
        </div>

        {/* Active Alerts */}
        {priceAlerts.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg text-gray-900 mb-4 font-bold">
              {t('priceAlerts.alertsSet')}
            </h2>
            <div className="space-y-3">
              {priceAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span>{alert.type === 'above' ? '📈' : '📉'}</span>
                    <span className="font-medium">
                      ₹{alert.target} {alert.type === 'above' ? t('priceAlerts.above') : t('priceAlerts.below')}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;
