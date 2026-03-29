import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { CropType, IndianState } from '../types/game.types';

const CROPS: { id: CropType; name: string; season: string; msp: number; risk: 'low' | 'medium' | 'high' }[] = [
  { id: 'wheat', name: 'Wheat', season: 'Rabi', msp: 2275, risk: 'low' },
  { id: 'paddy', name: 'Paddy', season: 'Kharif', msp: 2183, risk: 'medium' },
  { id: 'cotton', name: 'Cotton', season: 'Kharif', msp: 6620, risk: 'high' },
  { id: 'mustard', name: 'Mustard', season: 'Rabi', msp: 5450, risk: 'medium' },
  { id: 'gram', name: 'Gram', season: 'Rabi', msp: 5335, risk: 'low' },
  { id: 'maize', name: 'Maize', season: 'Kharif', msp: 2090, risk: 'medium' },
  { id: 'soybean', name: 'Soybean', season: 'Kharif', msp: 4600, risk: 'high' },
];

const FARMING_METHODS = [
  { id: 'irrigated', name: '💧 Irrigated', desc: 'Canal/Tube well water' },
  { id: 'rainfed', name: '🌧️ Rain-fed', desc: 'Depends on rainfall' },
  { id: 'terrace', name: '🏔️ Terrace', desc: 'Hilly farming' },
  { id: 'jhum', name: '🌿 Jhum', desc: 'Shifting cultivation (NE only)' },
];

export const ProfileEdit: React.FC<{ onBack?: () => void; onNavigate?: (screen: string) => void }> = ({ onBack, onNavigate }) => {
  const { t } = useTranslation();
  const { profile, gameState, updateProfile } = useGameStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [primaryCrop, setPrimaryCrop] = useState<CropType>(profile?.primaryCrop || 'wheat');
  const [secondaryCrops, setSecondaryCrops] = useState<CropType[]>([]);
  const [farmingMethod, setFarmingMethod] = useState('irrigated');
  const [landHolding, setLandHolding] = useState(profile?.landHoldingHectares || 2);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const isMidSeason = gameState?.weekNumber !== undefined && gameState.weekNumber > 1 && gameState.weekNumber < 20;

  const handleSave = () => {
    updateProfile({
      name,
      primaryCrop,
      landHoldingHectares: landHolding,
    });
    if (onNavigate) return onNavigate('settings');
    if (onBack) return onBack();
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedConfirm(true);
    } else {
      if (onBack) return onBack();
      if (onNavigate) return onNavigate('settings');
      window.history.back();
    }
  };

  const toggleSecondaryCrop = (crop: CropType) => {
    if (secondaryCrops.includes(crop)) {
      setSecondaryCrops(secondaryCrops.filter(c => c !== crop));
    } else if (secondaryCrops.length < 3) {
      setSecondaryCrops([...secondaryCrops, crop]);
    }
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl text-gray-900 font-bold">
            {t('settings.editProfile')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Warning for mid-season */}
        {isMidSeason && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <p className="text-amber-800 flex items-center gap-2 font-medium">
              🔒 {t('common.midSeasonLock')}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
          {/* Name */}
          <div>
            <label className="font-semibold text-gray-900 block mb-2">
              {t('onboarding.enter_name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
              maxLength={30}
              disabled={isMidSeason}
              className="w-full p-4 border-2 border-gray-200 rounded-xl font-medium text-gray-900 
                focus:border-green-500 focus:outline-none disabled:bg-gray-100"
              placeholder={t('onboarding.name_placeholder')}
            />
          </div>

          {/* Primary Crop */}
          <div>
            <label className="font-semibold text-gray-900 block mb-3">
              {t('onboarding.select_crop')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CROPS.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => { setPrimaryCrop(crop.id); setHasChanges(true); }}
                  disabled={isMidSeason}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative
                    ${primaryCrop === crop.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-100 hover:border-gray-200'
                    } ${isMidSeason ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-semibold text-gray-900">{crop.name}</p>
                  <p className="text-xs text-gray-500">{crop.season} • MSP ₹{crop.msp}</p>
                  <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full
                    ${crop.risk === 'low' ? 'bg-green-100 text-green-700' : 
                      crop.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {crop.risk}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Crops */}
          <div>
            <label className="font-semibold text-gray-900 block mb-3">
              {t('profileEdit.secondaryCrops')}
              <span className="text-sm font-normal text-gray-500 ml-2">{secondaryCrops.length}/3</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CROPS.filter(c => c.id !== primaryCrop).map((crop) => {
                const isSelected = secondaryCrops.includes(crop.id);
                return (
                  <button
                    key={crop.id}
                    onClick={() => toggleSecondaryCrop(crop.id)}
                    disabled={isMidSeason}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all
                      ${isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${isMidSeason ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSelected ? '✓ ' : '+ '}{crop.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Farming Method */}
          <div>
            <label className="font-semibold text-gray-900 block mb-3">
              {t('profileEdit.farmingMethod')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {FARMING_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => { setFarmingMethod(method.id); setHasChanges(true); }}
                  disabled={isMidSeason}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                    ${farmingMethod === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-100 hover:border-gray-200'
                    } ${isMidSeason ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-semibold text-gray-900">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Land Holding */}
          <div>
            <label className="font-semibold text-gray-900 block mb-3">
              {t('onboarding.land_label')}
              {isMidSeason && <span className="text-amber-600 text-sm ml-2">🔒 {t('common.locked')}</span>}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setLandHolding(Math.max(0.25, landHolding - 0.25)); setHasChanges(true); }}
                disabled={isMidSeason || landHolding <= 0.25}
                className="w-12 h-12 bg-gray-100 rounded-full font-bold text-xl disabled:opacity-50"
              >
                -
              </button>
              <span className="text-2xl text-gray-900 font-bold w-24 text-center">
                {landHolding.toFixed(2)}
              </span>
              <button
                onClick={() => { setLandHolding(Math.min(25, landHolding + 0.25)); setHasChanges(true); }}
                disabled={isMidSeason || landHolding >= 25}
                className="w-12 h-12 bg-gray-100 rounded-full font-bold text-xl disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold 
              hover:bg-green-600 active:scale-98 transition-all"
          >
            ✅ {t('common.save')}
          </button>

          {/* Back without saving */}
          <button
            onClick={handleBack}
            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700"
          >
            ← {t('common.back')}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl text-gray-900 mb-4 font-bold">
              {t('common.unsaved')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('common.discard')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnsavedConfirm(false)}
                className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-semibold"
              >
                {t('common.stay')}
              </button>
              <button
                onClick={() => {
                  if (onBack) return onBack();
                  if (onNavigate) return onNavigate('settings');
                  window.history.back();
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                {t('common.leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEdit;
