import type { Subscription } from '../../../types/erp';

export const initialBranches = ['Iași Centru', 'Iași Copou', 'Iași Nicolina'];

export const initialSubscriptions: Subscription[] = [
  {
    id: 'SUB-001',
    name: 'Premium 12 luni',
    duration: '12 luni',
    price: '2400 RON',
    status: 'Activ',
    renewals: 34,
    description: 'Acces complet și beneficii premium.',
  },
  {
    id: 'SUB-002',
    name: 'Standard 3 luni',
    duration: '3 luni',
    price: '650 RON',
    status: 'Activ',
    renewals: 51,
    description: 'Abonament standard cu acces programat.',
  },
];

export const activityData = [
  { day: 'Lun', active: 112, messages: 18 },
  { day: 'Mar', active: 120, messages: 25 },
  { day: 'Mie', active: 117, messages: 22 },
  { day: 'Joi', active: 134, messages: 29 },
  { day: 'Vin', active: 142, messages: 35 },
  { day: 'Sâm', active: 156, messages: 31 },
  { day: 'Dum', active: 98, messages: 12 },
];