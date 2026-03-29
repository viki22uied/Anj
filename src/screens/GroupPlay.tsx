import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { CropType } from '../types/game.types';

type GroupMode = 'pass_and_play' | 'local_wifi';
type GamePhase = 'setup' | 'insurance_vote' | 'warehouse' | 'negotiation' | 'turn';

interface Farmer {
  id: string;
  name: string;
  crop: CropType;
  grainCommitted: number;
  insuranceVote: boolean | null;
  warehouseVote: boolean | null;
  negotiationVote: boolean | null;
}

export const GroupPlay: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GroupMode | null>(null);
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [farmers, setFarmers] = useState<Farmer[]>([
    { id: '1', name: '', crop: 'wheat', grainCommitted: 0, insuranceVote: null, warehouseVote: null, negotiationVote: null }
  ]);
  const [currentFarmerIndex, setCurrentFarmerIndex] = useState(0);
  const [groupGrainPool, setGroupGrainPool] = useState(0);
  const [arhatiyaOffer, setArhatiyaOffer] = useState(2100);

  const crops: { id: CropType; name: string }[] = [
    { id: 'wheat', name: 'गेहूँ' },
    { id: 'paddy', name: 'धान' },
    { id: 'cotton', name: 'कपास' },
    { id: 'mustard', name: 'सरसों' },
  ];

  const addFarmer = () => {
    if (farmers.length < 6) {
      setFarmers([...farmers, {
        id: String(farmers.length + 1),
        name: '',
        crop: 'wheat',
        grainCommitted: 0,
        insuranceVote: null,
        warehouseVote: null,
        negotiationVote: null
      }]);
    }
  };

  const removeFarmer = (id: string) => {
    if (farmers.length > 2) {
      setFarmers(farmers.filter(f => f.id !== id));
    }
  };

  const updateFarmer = (id: string, updates: Partial<Farmer>) => {
    setFarmers(farmers.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const canStart = farmers.every(f => f.name.trim().length > 0);

  const startGame = () => {
    setPhase('insurance_vote');
  };

  const totalGrain = farmers.reduce((sum, f) => sum + f.grainCommitted, 0);
  const insuranceYesVotes = farmers.filter(f => f.insuranceVote === true).length;
  const insuranceNoVotes = farmers.filter(f => f.insuranceVote === false).length;
  const warehouseYesVotes = farmers.filter(f => f.warehouseVote === true).length;
  const negotiationYesVotes = farmers.filter(f => f.negotiationVote === true).length;

  // Group gets better price
  const groupOffer = Math.round(arhatiyaOffer * (1 + Math.min(totalGrain / 100, 0.15)));

  if (!mode) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl text-gray-900 mb-2">
            👥 {t('groupPlay.title', 'मिलकर खेलो, मिलकर जीतो')}
          </h1>
          <p className="text-soil-600 mb-8">
            {t('groupPlay.subtitle', 'गाँव के किसानों के साथ — एक साथ खेलने से फायदा होता है')}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setMode('pass_and_play')}
              className="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold 
                hover:bg-green-600 active:scale-98 transition-all"
            >
              📱 {t('groupPlay.passAndPlay', 'एक फोन पर खेलें')}
              <span className="block text-sm font-normal opacity-90">Pass & Play</span>
            </button>

            <button
              onClick={() => setMode('local_wifi')}
              disabled={!navigator.onLine}
              className={`w-full py-4 rounded-2xl font-semibold transition-all
                ${navigator.onLine 
                  ? 'bg-amber-100 text-gray-700 hover:bg-soil-200' 
                  : 'bg-soil-200 text-soil-400 cursor-not-allowed'}`}
              title={!navigator.onLine ? t('groupPlay.needsWifi', 'WiFi चाहिए') : ''}
            >
              📡 {t('groupPlay.localWifi', 'एक नेटवर्क पर खेलें')}
              <span className="block text-sm font-normal opacity-70">Same WiFi</span>
            </button>

            <button
              onClick={() => {
                if (onBack) return onBack();
                window.history.back();
              }}
              className="w-full py-3 text-soil-500 hover:text-gray-700"
            >
              ← {t('common.back', 'वापस')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-amber-50">
        <div className="bg-white border-b border-soil-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-xl text-gray-900">
              {t('groupPlay.addFarmers', 'किसान जोड़ो')}
            </h1>
            <p className="text-sm text-soil-500">
              {farmers.length} {t('groupPlay.farmersAdded', 'किसान जोड़े')}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {farmers.map((farmer, index) => (
            <div key={farmer.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 bg-field-100 rounded-full flex items-center justify-center text-green-700">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={farmer.name}
                  onChange={(e) => updateFarmer(farmer.id, { name: e.target.value })}
                  placeholder={t('groupPlay.farmerName', 'किसान का नाम')}
                  className="flex-1 p-3 border-2 border-soil-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
                {farmers.length > 2 && (
                  <button
                    onClick={() => removeFarmer(farmer.id)}
                    className="p-2 text-danger-500 hover:bg-danger-50 rounded-full"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {crops.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => updateFarmer(farmer.id, { crop: crop.id })}
                    className={`px-3 py-1 rounded-full text-sm transition-all
                      ${farmer.crop === crop.id
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-100 text-gray-700'}`}
                  >
                    {crop.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {farmers.length < 6 && (
            <button
              onClick={addFarmer}
              className="w-full py-4 border-2 border-dashed border-soil-300 rounded-2xl text-soil-600 
                hover:border-field-400 hover:text-field-600 transition-all"
            >
              + {t('groupPlay.addAnother', 'और किसान जोड़ो')}
            </button>
          )}

          <button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
              ${canStart 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-soil-200 text-soil-400 cursor-not-allowed'}`}
          >
            ✅ {t('groupPlay.startGroupGame', 'शुरू करो')}
          </button>
        </div>
      </div>
    );
  }

  // INSURANCE VOTE PHASE
  if (phase === 'insurance_vote') {
    return (
      <div className="min-h-screen bg-amber-50">
        <div className="bg-white border-b border-soil-200 p-4">
          <h1 className="text-xl text-gray-900 text-center">
            {t('groupPlay.groupInsurance', 'मिलकर बीमा करेंगे?')}
          </h1>
          <p className="text-center text-soil-600 text-sm mt-1">
            {t('groupPlay.insuranceDiscount', '5% छूट मिलेगी')} • {insuranceYesVotes}/{farmers.length} {t('groupPlay.ready', 'तैयार')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {farmers.map((farmer) => (
              <div key={farmer.id} className={`p-4 rounded-xl border-2 text-center
                ${farmer.insuranceVote === true ? 'border-field-500 bg-field-50' : 
                  farmer.insuranceVote === false ? 'border-soil-200 bg-amber-50' : 'border-soil-100 bg-white'}`}>
                <p className="font-semibold text-gray-900">{farmer.name}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => updateFarmer(farmer.id, { insuranceVote: true })}
                    className={`flex-1 py-2 rounded-lg text-sm
                      ${farmer.insuranceVote === true ? 'bg-green-500 text-white' : 'bg-amber-100'}`}
                  >
                    ✅ {t('common.yes', 'हाँ')}
                  </button>
                  <button
                    onClick={() => updateFarmer(farmer.id, { insuranceVote: false })}
                    className={`flex-1 py-2 rounded-lg text-sm
                      ${farmer.insuranceVote === false ? 'bg-red-500 text-white' : 'bg-amber-100'}`}
                  >
                    ❌ {t('common.no', 'नहीं')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {farmers.every(f => f.insuranceVote !== null) && (
            <button
              onClick={() => setPhase('warehouse')}
              className="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold"
            >
              {t('common.next', 'आगे')} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // WAREHOUSE PHASE
  if (phase === 'warehouse') {
    return (
      <div className="min-h-screen bg-amber-50">
        <div className="bg-white border-b border-soil-200 p-4">
          <h1 className="text-xl text-gray-900 text-center">
            {t('groupPlay.groupWarehouse', 'मिलकर गोदाम में रखेंगे?')}
          </h1>
          <p className="text-center text-soil-600 text-sm mt-1">
            {t('groupPlay.totalPool', 'कुल पूल')}: {totalGrain} {t('common.quintal', 'क्विंटल')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {farmers.map((farmer) => (
            <div key={farmer.id} className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">{farmer.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFarmer(farmer.id, { warehouseVote: true })}
                    className={`px-3 py-1 rounded-full text-sm
                      ${farmer.warehouseVote === true ? 'bg-green-500 text-white' : 'bg-amber-100'}`}
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => updateFarmer(farmer.id, { warehouseVote: false })}
                    className={`px-3 py-1 rounded-full text-sm
                      ${farmer.warehouseVote === false ? 'bg-red-500 text-white' : 'bg-amber-100'}`}
                  >
                    ❌
                  </button>
                </div>
              </div>
              {farmer.warehouseVote === true && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-soil-600">{t('groupPlay.iWillGive', 'मैं दूँगा')}:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={farmer.grainCommitted}
                    onChange={(e) => updateFarmer(farmer.id, { grainCommitted: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">{farmer.grainCommitted}</span>
                </div>
              )}
            </div>
          ))}

          <div className="bg-field-50 rounded-2xl p-4 border-2 border-field-200">
            <p className="text-center text-field-800">
              {totalGrain > 0 && (
                <>
                  {t('groupPlay.betterPrice', 'ज़्यादा मात्रा = बेहतर भाव')}
                  <br />
                  <span className="text-2xl">₹{groupOffer}/क्विंटल</span>
                </>
              )}
            </p>
          </div>

          {farmers.every(f => f.warehouseVote !== null) && (
            <button
              onClick={() => setPhase('negotiation')}
              className="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold"
            >
              {t('common.next', 'आगे')} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // NEGOTIATION PHASE
  if (phase === 'negotiation') {
    return (
      <div className="min-h-screen bg-amber-50">
        <div className="bg-amber-50 border-b border-amber-200 p-4">
          <h1 className="text-xl text-gray-900 text-center">
            {t('groupPlay.groupNegotiation', 'मिलकर मंडी जाओ')}
          </h1>
          <p className="text-center text-gray-700 mt-2">
            {t('groupPlay.arhatiyaSays', 'आढ़तिया कहता है')}:<br/>
            <span className="text-2xl text-green-700">"₹{groupOffer}/क्विंटल दूँगा!"</span>
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-3 mb-6">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{farmer.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFarmer(farmer.id, { negotiationVote: true })}
                    className={`px-4 py-2 rounded-lg font-body
                      ${farmer.negotiationVote === true ? 'bg-green-500 text-white' : 'bg-amber-100'}`}
                  >
                    ✅ {t('groupPlay.accept', 'मंजूर')}
                  </button>
                  <button
                    onClick={() => updateFarmer(farmer.id, { negotiationVote: false })}
                    className={`px-4 py-2 rounded-lg font-body
                      ${farmer.negotiationVote === false ? 'bg-red-500 text-white' : 'bg-amber-100'}`}
                  >
                    ❌ {t('groupPlay.reject', 'नहीं')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {farmers.every(f => f.negotiationVote !== null) && (
            <div className="bg-field-50 rounded-2xl p-6 text-center border-2 border-field-200">
              {negotiationYesVotes > farmers.length / 2 ? (
                <>
                  <p className="text-xl text-field-800 mb-2">
                    ✅ {t('groupPlay.dealDone', 'सौदा हुआ!')}
                  </p>
                  <p className="text-green-700">
                    {t('groupPlay.allSold', 'सबका अनाज ₹{price}/क्विंटल पर बिका', { price: groupOffer })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-red-700 mb-2">
                    ❌ {t('groupPlay.dealRejected', 'सौदा टूटा')}
                  </p>
                  <p className="text-gray-700">
                    {t('groupPlay.tryAgain', 'दोबारा बातचीत करो')}
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  if (onBack) return onBack();
                  window.history.back();
                }}
                className="mt-4 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold"
              >
                {t('common.finish', 'खत्म')} →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default GroupPlay;
