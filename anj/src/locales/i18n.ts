import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hi from './hi.json';

// English fallback (same structure, English values)
const en = {
  app: { name: 'Anaj-Arth', tagline: 'Smart farming, smart finances' },
  onboarding: { welcome: 'Welcome to Anaj-Arth!', select_language: 'Choose your language', select_state: 'Select your state', enter_name: 'What is your name?', name_placeholder: 'Enter name...', select_crop: 'Choose your main crop', start: 'Start! 🌾', subtitle: "Farmer's Financial Simulator", land_label: 'Land holding (hectares)', district_label: 'District', ready: 'Start Game!' },
  crops: { wheat: 'Wheat', paddy: 'Paddy', cotton: 'Cotton', mustard: 'Mustard', gram: 'Gram', onion: 'Onion', maize: 'Maize', soybean: 'Soybean', tomato: 'Tomato', sugarcane: 'Sugarcane' },
  stress: { mann_ki_tanao: 'Stress Level', calm: 'Calm', moderate: 'Moderate', stressed: 'Stressed', critical: 'Critical' },
  dashboard: { welcome: 'Namaste {{name}} 🙏', season: 'Season {{number}}', cash: 'Cash', grain_farm: 'Grain at Farm', grain_godown: 'Grain in Godown', debt: 'Debt', net_worth: 'Net Worth', samriddhi: 'Samriddhi Score', stress: 'Stress', actions_title: 'What to do today?', phase: 'Phase', acres: 'acres', quintals: 'quintals', start_season: 'New Season', select_crop: 'Choose Crop' },
  action: { sell_grain: 'Sell Grain', sell_grain_sub: 'Negotiate at mandi', use_godown: 'Use Godown', use_godown_sub: 'eNWR & pledge loan', crop_insurance: 'Crop Insurance', crop_insurance_sub: 'PMFBY protection', get_loan: 'Get Loan', get_loan_sub: 'KCC vs Moneylender', advance: 'Advance' },
  negotiation: { msp: 'MSP', arhatiya_offer: 'Arhatiya Offer', round: 'Round', accept: 'Accept', invoke_msp: 'Invoke MSP', show_enwr: 'Show eNWR', walk_away: 'Walk Away', compare_mandi: 'Compare Mandi', choose_response: 'Choose your response', msp_right: 'MSP is your right', can_wait: 'No hurry', find_another: 'Find another buyer', result_title: 'Deal', result_won: 'Good price!', result_lost: 'Low price this time.', final_price: 'Final Price' },
  npc: { arhatiya: { opening_default: 'Brother, market is weak today. Can\'t give more than ₹{{price}}.', quality_challenge: 'Look, moisture is high. Drying will cost me. ₹{{price}} only.', market_down: 'Lots of arrivals today. Everyone selling. ₹{{price}} max.', debt_pressure: 'You owe me ₹{{debt}} too. Need to settle that.', final_offer: 'Final offer — ₹{{price}}. Take it or leave it.', counter_msp: 'MSP is for government procurement. Mandi price is different.' } },
  credit: { title: 'Loan Comparison', moneylender_name: 'Moneylender', kcc_name: 'Kisan Credit Card', cooperative_name: 'Cooperative', nbfc_name: 'Microfinance', rate: 'Interest Rate', emi: 'Monthly EMI', total_payable: 'Total Payable', processing: 'Processing', days: 'days', recommended: 'Recommended', take_loan: 'Take Loan', amount: 'Amount' },
  insurance: { title: 'Crop Insurance (PMFBY)', premium: 'Premium', sum_insured: 'Sum Insured', enroll: 'Enroll', enrolled: 'Insured ✅', coverage: 'Coverage', guide: 'If crop loss exceeds 30%, insurance payout is triggered.' },
  godown: { title: 'Godown / eNWR', deposit: 'Deposit', sell: 'Sell', pledge: 'Pledge', storage_cost: 'Storage Cost', current_value: 'Current Value', months: 'months' },
  grading: { title: 'Grain Quality Check', instructions: 'Sort each sample into the correct bin', moisture: 'Moisture', foreign: 'Foreign Matter', damaged: 'Damaged', bin_godown: 'Godown', bin_sell: 'Sell', bin_reject: 'Reject', submit: 'Submit', excellent: 'Excellent!', good: 'Good!', try_again: 'Try again.', standards_header: 'Godown Standards', moisture_limit: 'Moisture Limit', foreign_matter: 'Foreign Matter Limit' },
  events: { 
    flood: { title: '🌊 Flood!', desc: 'Fields flooded.' }, 
    drought: { title: '☀️ Drought!', desc: 'Very low rainfall.' }, 
    pest: { title: '🐛 Pest Attack!', desc: 'Crops infested.' }, 
    medical: { title: '🏥 Medical Emergency!', desc: 'Family illness requires urgent cash.' }, 
    moneylender: { title: '🕴️ Moneylender Visit!', desc: 'Moneylender is here demanding repayment.' }, 
    procurement: { title: '🏛️ Govt Procurement!', desc: 'MSP purchase started!' }, 
    hailstorm: { title: '🧊 Hailstorm!', desc: 'Ice damaged crops.' }, 
    price_crash: { title: '📉 Price Crash!', desc: 'Market collapsed.' }, 
    wedding_expense: { title: '💒 Wedding!', desc: 'Family wedding expenses.' }, 
    school_fees: { title: '📚 School Fees!', desc: 'Children School Fees due.' }, 
    festival: { title: '🎉 Festival!', desc: 'Festival season expenses.' }, 
    good_rain: { title: '🌧️ Good Rain!', desc: 'Excellent rainfall.' }, 
    bumper_crop: { title: '🌾 Bumper Crop!', desc: 'Excellent harvest expected.' } 
  },
  phase: { season_start: 'Season Start', growing: 'Growing', harvest: 'Harvest', decision: 'Decision Time', godown: 'Godown', negotiation: 'Negotiation', season_end: 'Season End' },
  voice: { speak_response: 'Speak...', ask_anything: 'Ask' },
  badge: { active: 'Active', insured: 'Insured' },
  units: { quintals: 'quintals', rupees: '₹' },
  month: { '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug', '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' },
  states: { AP: 'Andhra Pradesh', AS: 'Assam', BR: 'Bihar', CG: 'Chhattisgarh', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand', KA: 'Karnataka', KL: 'Kerala', MP: 'Madhya Pradesh', MH: 'Maharashtra', OD: 'Odisha', PB: 'Punjab', RJ: 'Rajasthan', TN: 'Tamil Nadu', TS: 'Telangana', UP: 'Uttar Pradesh', UK: 'Uttarakhand', WB: 'West Bengal', JK: 'Jammu & Kashmir', GA: 'Goa' },
  recap: { title: 'Season Report', revenue: 'Revenue', costs: 'Costs', profit: 'Profit', yield: 'Yield', insurance_payout: 'Insurance Payout', risk_events: 'Risk Events', excellent: '🏆 Excellent!', good: '⭐ Good!', average: '👍 Average', poor: '⚠️ Poor', crisis: '🆘 Crisis' },
  common: { next: 'Next', back: 'Back', save: 'Save', loading: 'Loading...' },
};

i18n.use(initReactI18next).init({
  resources: {
    hi: { translation: hi },
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
