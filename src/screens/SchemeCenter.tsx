import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

type SchemeCategory = 'all' | 'credit' | 'insurance' | 'market' | 'subsidy';

interface Scheme {
  id: string;
  name: string;
  nameEn: string;
  category: SchemeCategory;
  benefit: string;
  benefitEn: string;
  description: string;
  descriptionEn: string;
  url: string;
  icon: string;
  usedInGame: boolean;
}

const SCHEMES: Scheme[] = [
  {
    id: 'kcc',
    name: 'KCC — किसान क्रेडिट कार्ड',
    nameEn: 'Kisan Credit Card',
    category: 'credit',
    benefit: '4% ब्याज पर किसान कर्ज़',
    benefitEn: 'Affordable crop loans (around 4% interest)',
    description: 'किसानों को सस्ते ब्याज पर कर्ज़ मिलता है। सिर्फ 4% प्रति वर्ष। साहूकार से 36-60% के मुकाबले बहुत फायदेमंद।',
    descriptionEn: 'A formal credit line for farmers with much lower interest than moneylenders, typically around 4% per year (with conditions).',
    url: 'https://jansamarth.in',
    icon: '💳',
    usedInGame: true,
  },
  {
    id: 'pmfby',
    name: 'PMFBY — फसल बीमा',
    nameEn: 'Pradhan Mantri Fasal Bima Yojana',
    category: 'insurance',
    benefit: '2% प्रीमियम पर फसल सुरक्षा',
    benefitEn: 'Crop protection with low premium',
    description: 'बाढ़, सूखा, कीड़ा लगने पर फसल का बीमा मिलता है। प्रीमियम सिर्फ 2% (खरीफ), 1.5% (रबी), 5% (वाणिज्यिक)।',
    descriptionEn: 'Government crop insurance that can pay out when notified crop losses happen. Premiums are low relative to the insured value.',
    url: 'https://pmfby.gov.in',
    icon: '🛡️',
    usedInGame: true,
  },
  {
    id: 'pmkisan',
    name: 'PM-KISAN — किसान सम्मान निधि',
    nameEn: 'Pradhan Mantri Kisan Samman Nidhi',
    category: 'subsidy',
    benefit: '₹6,000/साल सीधे खाते में',
    benefitEn: 'Direct income support (₹6,000/year)',
    description: 'हर साल ₹6,000 तीन किस्तों में सीधे किसान के बैंक खाते में आता है। कोई बीच वाला नहीं।',
    descriptionEn: 'Direct benefit transfer providing ₹6,000 per year in instalments to eligible farmers.',
    url: 'https://pmkisan.gov.in',
    icon: '💵',
    usedInGame: false,
  },
  {
    id: 'enam',
    name: 'eNAM — इलेक्ट्रॉनिक मंडी',
    nameEn: 'Electronic National Agriculture Market',
    category: 'market',
    benefit: 'ऑनलाइन मंडी, बेहतर भाव',
    benefitEn: 'Online market access',
    description: 'घर बैठे अपनी फसल बेचो। पूरे देश के खरीदारों से मिलो। बिचौलिये खत्म।',
    descriptionEn: 'A platform to discover prices and connect with buyers across markets, improving transparency.',
    url: 'https://enam.gov.in',
    icon: '🌐',
    usedInGame: false,
  },
  {
    id: 'wdra',
    name: 'WDRA — गोदाम रसीद',
    nameEn: 'Warehouse Receipt',
    category: 'market',
    benefit: 'गोदाम रसीद पर 75% तक कर्ज़',
    benefitEn: 'Borrow against warehouse receipts',
    description: 'अनाज गोदाम में रखो, रसीद लो, बैंक से कर्ज़ लो। MSP से कम पर नहीं बेचना पड़ेगा।',
    descriptionEn: 'Store grain in a registered warehouse, get a receipt, and use it to borrow—so you can avoid distress selling.',
    url: 'https://wdra.gov.in',
    icon: '🏛️',
    usedInGame: true,
  },
  {
    id: 'nerl',
    name: 'NERL/NBHC — eNWR',
    nameEn: 'National Electronic Repository Ltd',
    category: 'market',
    benefit: 'इलेक्ट्रॉनिक गोदाम रसीद',
    benefitEn: 'Electronic warehouse receipts',
    description: 'डिजिटल गोदाम रसीद। कहीं भी दिखाओ, कभी भी बेचो। असली किसान के लिए असली सुविधा।',
    descriptionEn: 'Electronic warehouse receipts that are easier to share/verify and can improve access to formal credit.',
    url: 'https://nbhcl.co.in',
    icon: '📱',
    usedInGame: true,
  },
  {
    id: 'msp',
    name: 'MSP — न्यूनतम समर्थन मूल्य',
    nameEn: 'Minimum Support Price',
    category: 'market',
    benefit: 'सरकारी खरीद गारंटी',
    benefitEn: 'Government support price reference',
    description: 'MSP से कम पर अनाज नहीं बेचना पड़ेगा। सरकार खरीदेगी। FCI, NAFED, राज्य एजेंसियाँ।',
    descriptionEn: 'A reference support price announced by the government. In some cases, procurement happens through agencies and mandis.',
    url: 'https://cacp.dacnet.nic.in',
    icon: '📜',
    usedInGame: true,
  },
  {
    id: 'soilhealth',
    name: 'Soil Health Card',
    nameEn: 'Soil Health Card Scheme',
    category: 'subsidy',
    benefit: 'मिट्टी की जाँच मुफ्त',
    benefitEn: 'Soil testing guidance',
    description: 'हर 3 साल में मिट्टी की जाँच। क्या कमी है, क्या डालना है — पता चलेगा। फसल बेहतर होगी।',
    descriptionEn: 'Soil tests and recommendations to improve nutrient management and crop outcomes.',
    url: 'https://soilhealth.dac.gov.in',
    icon: '🧪',
    usedInGame: false,
  },
  {
    id: 'fpo',
    name: 'FPO — किसान उत्पादक संगठन',
    nameEn: 'Farmer Producer Organization',
    category: 'market',
    benefit: 'मिलकर बेचो, ज़्यादा कमाओ',
    benefitEn: 'Collective selling and bargaining',
    description: '10+ किसान मिलकर FPO बनाओ। मिलकर बेचो, बेहतर भाव मिलेगा। सरकार मदद करती है।',
    descriptionEn: 'Farmers can form a producer organization to aggregate produce, reduce costs, and negotiate better prices.',
    url: 'https://sfacindia.com',
    icon: '👥',
    usedInGame: false,
  },
  {
    id: 'kisansuvidha',
    name: 'Kisan Suvidha App',
    nameEn: 'Kisan Suvidha Mobile App',
    category: 'all',
    benefit: 'एक App में सब कुछ',
    benefitEn: 'One app for key info',
    description: 'मौसम, बाजार भाव, योजनाएँ — एक ही App में। डाउनलोड करो, फायदा उठाओ।',
    descriptionEn: 'An informational app with weather, market prices, and schemes in one place.',
    url: 'https://play.google.com/store/apps/details?id=nic.icar.suvidha',
    icon: '📲',
    usedInGame: false,
  },
];

export const SchemeCenter: React.FC<{ onBack?: () => void; onNavigate?: (screen: string) => void }> = ({ onBack, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isHi = (i18n.language || '').startsWith('hi');
  const [activeCategory, setActiveCategory] = useState<SchemeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (onNavigate) return onNavigate('dashboard');
      window.history.back();
    }
  };

  const categories: { id: SchemeCategory; label: string; icon: string }[] = [
    { id: 'all', label: t('schemes.all', 'सभी'), icon: '📋' },
    { id: 'credit', label: t('schemes.credit', 'कर्ज़'), icon: '💳' },
    { id: 'insurance', label: t('schemes.insurance', 'बीमा'), icon: '🛡️' },
    { id: 'market', label: t('schemes.market', 'बाज़ार'), icon: '💰' },
    { id: 'subsidy', label: t('schemes.subsidy', 'सब्सिडी'), icon: '💵' },
  ];

  const filteredSchemes = SCHEMES.filter(scheme => {
    const matchesCategory = activeCategory === 'all' || scheme.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      (isHi ? scheme.name : scheme.nameEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isHi ? scheme.benefit : scheme.benefitEn).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openUrl = (url: string) => {
    if (navigator.onLine) {
      window.open(url, '_blank');
    } else {
      alert(t('schemes.offline'));
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl text-gray-900 font-bold">
                {t('schemes.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('schemes.subtitle')}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('schemes.search')}
              className="w-full p-3 pl-10 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute left-3 top-3.5">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all
                ${activeCategory === cat.id
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes List */}
      <div className="max-w-2xl mx-auto px-4 pb-6 space-y-4">
        {filteredSchemes.map((scheme) => (
          <motion.div
            key={scheme.id}
            layout
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  {scheme.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{isHi ? scheme.name : scheme.nameEn}</h3>
                      <p className="text-xs text-gray-500">{isHi ? scheme.nameEn : scheme.name}</p>
                    </div>
                    {scheme.usedInGame && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        ✅ {t('schemes.used')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-700 mt-1 font-medium">{isHi ? scheme.benefit : scheme.benefitEn}</p>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedScheme === scheme.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <p className="text-sm text-gray-600 mb-4">
                    {isHi ? scheme.description : scheme.descriptionEn}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedScheme(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      {t('common.close')}
                    </button>
                    <button
                      onClick={() => openUrl(scheme.url)}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                    >
                      {t('schemes.applyNow')} →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              {expandedScheme !== scheme.id && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setExpandedScheme(scheme.id)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {t('schemes.learnMore')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filteredSchemes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {t('schemes.noResults')}
            </p>
          </div>
        )}
      </div>

      {/* Helpline */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <a
          href="tel:18001801551"
          className="block bg-amber-50 rounded-2xl p-6 text-center border-2 border-amber-200"
        >
          <p className="text-amber-800 mb-1 font-medium">{t('schemes.helpline')}</p>
          <p className="text-3xl text-amber-700 font-bold">1800-180-1551</p>
          <p className="text-sm text-amber-600">{t('schemes.tollFree')}</p>
        </a>
      </div>
    </div>
  );
};

export default SchemeCenter;
