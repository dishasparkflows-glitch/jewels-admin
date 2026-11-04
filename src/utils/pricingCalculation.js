import api from '../api/axios';

// --- METAL WEIGHT CALCULATION (14KT BASE PURITY SCALING + 5% CASTING BUFFER + CENTER DIAMOND PRONG ALLOWANCE) ---
export const calculateEffectiveWeight = (metalWeight, metalPurity, centerDiamondCarat = 0, baseCarat = 1) => {
  const baseWeight = parseFloat(metalWeight) || 0;
  if (!metalPurity) {
    return Math.round(((baseWeight * 1.05) + Number.EPSILON) * 1000) / 1000;
  }

  const karat = typeof metalPurity === 'object' ? (metalPurity.karat || 0) : Number(metalPurity || 0);
  const metalType = typeof metalPurity === 'object' ? metalPurity.metalType : 'Gold';

  if (metalType === 'Gold' || (!metalType && karat)) {
    const baseKarat = 14;
    const targetKarat = karat || 0;

    const basePurityPercent = (baseKarat / 24) * 100;
    const targetPurityPercent = (targetKarat / 24) * 100;
    const diffPercent = targetPurityPercent - basePurityPercent;

    let karatWeight = baseWeight * (1 + (diffPercent / 100));

    const caratVal = parseFloat(centerDiamondCarat) || 0;
    const baseCaratVal = parseFloat(baseCarat) || 0;
    const extraWeight = caratVal > 0 ? (caratVal - baseCaratVal) * (karatWeight * 0.08) : 0;

    const finalWeightWithCarat = karatWeight + extraWeight;
    const finalWeightWith5Percent = finalWeightWithCarat * 1.05;
    return Math.round((finalWeightWith5Percent + Number.EPSILON) * 1000) / 1000;
  }

  return Math.round(((baseWeight * 1.05) + Number.EPSILON) * 1000) / 1000;
};

/**
 * Call the backend /products/calculate API endpoint
 */
export async function calculateProductPriceAPI(payload) {
  const response = await api.post('/products/calculate', payload);
  return response.data?.data ?? response.data;
}

