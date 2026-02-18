
import { Currency } from './types';

export const CURRENCIES: Currency[] = [
  // Devises de Base (Franc CFA)
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'CFA', flag: '🌍' },
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', flag: '🌍' },
  
  // Devises Majeures
  { code: 'EUR', name: 'Euro (Europe/Espagne)', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', name: 'Dollar US (Amérique)', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£', flag: '🇬🇧' },
  { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'JPY', name: 'Yen Japonais', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Dollar Canadien', symbol: '$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Dollar Australien', symbol: '$', flag: '🇦🇺' },
  
  // Devises Asie & Moyen-Orient
  { code: 'CNY', name: 'Yuan Chinois', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'Won Sud-Coréen', symbol: '₩', flag: '🇰🇷' },
  { code: 'INR', name: 'Roupie Indienne', symbol: '₹', flag: '🇮🇳' },
  { code: 'SAR', name: 'Riyal Saoudien', symbol: 'SR', flag: '🇸🇦' },
  { code: 'AED', name: 'Dirham des E.A.U', symbol: 'DH', flag: '🇦🇪' },
  
  // Devises Afrique
  { code: 'NGN', name: 'Naira Nigérian', symbol: '₦', flag: '🇳🇬' },
  { code: 'GHS', name: 'Cedi Ghanéen', symbol: '₵', flag: '🇬🇭' },
  { code: 'ZAR', name: 'Rand Sud-Africain', symbol: 'R', flag: '🇿🇦' },
  { code: 'MAD', name: 'Dirham Marocain', symbol: 'DH', flag: '🇲🇦' },
  { code: 'EGP', name: 'Livre Égyptienne', symbol: 'E£', flag: '🇪🇬' },
  { code: 'KES', name: 'Shilling Kényan', symbol: 'KSh', flag: '🇰🇪' },
  
  // Autres Devises Importantes
  { code: 'BRL', name: 'Real Brésilien', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Peso Mexicain', symbol: '$', flag: '🇲🇽' },
  { code: 'RUB', name: 'Rouble Russe', symbol: '₽', flag: '🇷🇺' },
  { code: 'TRY', name: 'Lire Turque', symbol: '₺', flag: '🇹🇷' },
];

export const CFA_FIXED_RATE_EUR = 655.957;

/**
 * Taux par défaut basés sur 1 Franc CFA (XOF/XAF)
 * Note: Ces taux sont des approximations pour l'initialisation hors ligne.
 */
export const DEFAULT_RATES: Record<string, number> = {
  XOF: 1,
  XAF: 1,
  EUR: 0.001524,
  USD: 0.00165,
  GBP: 0.0013,
  CHF: 0.00143,
  JPY: 0.25,
  CAD: 0.0023,
  AUD: 0.0025,
  CNY: 0.0117,
  KRW: 2.25,
  INR: 0.14,
  SAR: 0.0062,
  AED: 0.0061,
  NGN: 2.50,
  GHS: 0.022,
  ZAR: 0.031,
  MAD: 0.016,
  EGP: 0.08,
  KES: 0.21,
  BRL: 0.009,
  MXN: 0.033,
  RUB: 0.16,
  TRY: 0.056,
};
