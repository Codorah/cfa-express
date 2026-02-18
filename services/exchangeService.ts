
import { RatesData, ExchangeRates } from '../types';
import { DEFAULT_RATES } from '../constants';

const STORAGE_KEY = 'cfa_express_rates';
const API_URL = 'https://open.er-api.com/v6/latest/XOF';

/**
 * Récupère les taux de change réels via l'API Open ER.
 * Retourne les données formatées avec horodatage.
 */
export const fetchLatestRates = async (): Promise<RatesData> => {
  if (!navigator.onLine) {
    throw new Error("Offline");
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("API Error");
    
    const data = await response.json();
    
    const ratesData: RatesData = {
      rates: data.rates,
      lastUpdate: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratesData));
    return ratesData;
  } catch (error) {
    console.error("Erreur lors de la récupération des taux réels:", error);
    // Fallback sur le cache si l'API échoue
    return getCachedRates();
  }
};

/**
 * Récupère les taux stockés localement.
 */
export const getCachedRates = (): RatesData => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return { 
    rates: DEFAULT_RATES, 
    lastUpdate: Date.now() - 86400000 // 24h ago par défaut si vide
  };
};
