import type { IndianState } from '../types/game.types';

export interface Festival {
  name: string;
  nameKey: string;
  month: number;
  spendingPressure: number;
  debtTrigger: boolean;
  typicalSpend: number;
}

export const FESTIVAL_CALENDAR: Partial<Record<IndianState, Festival[]>> = {
  PB: [
    { name: 'Baisakhi', nameKey: 'festivals.baisakhi', month: 4, spendingPressure: 18, debtTrigger: false, typicalSpend: 8000 },
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 15, debtTrigger: true, typicalSpend: 10000 },
    { name: 'Lohri', nameKey: 'festivals.lohri', month: 1, spendingPressure: 12, debtTrigger: false, typicalSpend: 5000 },
  ],
  UP: [
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 9000 },
    { name: 'Chhath', nameKey: 'festivals.chhath', month: 11, spendingPressure: 15, debtTrigger: true, typicalSpend: 7000 },
    { name: 'Holi', nameKey: 'festivals.holi', month: 3, spendingPressure: 14, debtTrigger: false, typicalSpend: 6000 },
  ],
  MH: [
    { name: 'Ganesh Chaturthi', nameKey: 'festivals.ganesh', month: 8, spendingPressure: 20, debtTrigger: true, typicalSpend: 12000 },
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 10000 },
  ],
  TN: [
    { name: 'Pongal', nameKey: 'festivals.pongal', month: 1, spendingPressure: 20, debtTrigger: true, typicalSpend: 12000 },
    { name: 'Karthigai', nameKey: 'festivals.karthigai', month: 11, spendingPressure: 10, debtTrigger: false, typicalSpend: 4000 },
  ],
  WB: [
    { name: 'Durga Puja', nameKey: 'festivals.durga_puja', month: 10, spendingPressure: 22, debtTrigger: true, typicalSpend: 14000 },
    { name: 'Kali Puja', nameKey: 'festivals.kali_puja', month: 11, spendingPressure: 14, debtTrigger: false, typicalSpend: 7000 },
  ],
  AS: [
    { name: 'Bihu (Bohag)', nameKey: 'festivals.bihu_bohag', month: 4, spendingPressure: 20, debtTrigger: true, typicalSpend: 9000 },
    { name: 'Bihu (Magh)', nameKey: 'festivals.bihu_magh', month: 1, spendingPressure: 15, debtTrigger: false, typicalSpend: 6000 },
  ],
  KL: [
    { name: 'Onam', nameKey: 'festivals.onam', month: 8, spendingPressure: 22, debtTrigger: true, typicalSpend: 15000 },
    { name: 'Vishu', nameKey: 'festivals.vishu', month: 4, spendingPressure: 12, debtTrigger: false, typicalSpend: 6000 },
  ],
  OD: [
    { name: 'Nuakhai', nameKey: 'festivals.nuakhai', month: 9, spendingPressure: 18, debtTrigger: true, typicalSpend: 7000 },
    { name: 'Raja', nameKey: 'festivals.raja', month: 6, spendingPressure: 12, debtTrigger: false, typicalSpend: 5000 },
  ],
  KA: [
    { name: 'Dasara', nameKey: 'festivals.dasara', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 10000 },
    { name: 'Ugadi', nameKey: 'festivals.ugadi', month: 3, spendingPressure: 12, debtTrigger: false, typicalSpend: 6000 },
  ],
  GJ: [
    { name: 'Navratri', nameKey: 'festivals.navratri', month: 10, spendingPressure: 20, debtTrigger: true, typicalSpend: 12000 },
    { name: 'Uttarayan', nameKey: 'festivals.uttarayan', month: 1, spendingPressure: 12, debtTrigger: false, typicalSpend: 5000 },
  ],
  RJ: [
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 9000 },
    { name: 'Gangaur', nameKey: 'festivals.gangaur', month: 3, spendingPressure: 14, debtTrigger: false, typicalSpend: 6000 },
  ],
  MP: [
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 9000 },
    { name: 'Holi', nameKey: 'festivals.holi', month: 3, spendingPressure: 14, debtTrigger: false, typicalSpend: 6000 },
  ],
  HR: [
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 16, debtTrigger: true, typicalSpend: 9000 },
    { name: 'Baisakhi', nameKey: 'festivals.baisakhi', month: 4, spendingPressure: 14, debtTrigger: false, typicalSpend: 7000 },
  ],
  BR: [
    { name: 'Chhath', nameKey: 'festivals.chhath', month: 11, spendingPressure: 20, debtTrigger: true, typicalSpend: 10000 },
    { name: 'Diwali', nameKey: 'festivals.diwali', month: 10, spendingPressure: 16, debtTrigger: true, typicalSpend: 8000 },
  ],
  AP: [
    { name: 'Sankranti', nameKey: 'festivals.sankranti', month: 1, spendingPressure: 18, debtTrigger: true, typicalSpend: 10000 },
    { name: 'Ugadi', nameKey: 'festivals.ugadi', month: 3, spendingPressure: 12, debtTrigger: false, typicalSpend: 6000 },
  ],
  TS: [
    { name: 'Bathukamma', nameKey: 'festivals.bathukamma', month: 10, spendingPressure: 18, debtTrigger: true, typicalSpend: 8000 },
    { name: 'Sankranti', nameKey: 'festivals.sankranti', month: 1, spendingPressure: 16, debtTrigger: true, typicalSpend: 9000 },
  ],
};
