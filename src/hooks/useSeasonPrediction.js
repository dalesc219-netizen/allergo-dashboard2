import { useMemo } from 'react';

export const useSeasonPrediction = (currentData = [], historicalData = [], allergens = ['alder', 'hazel'], decayConstant = 0.12) => {
  return useMemo(() => {
    const THRESHOLD = 50; // Порог (ед/м³), ниже которого сезон считается завершенным
    
    // Расчет Area Under the Curve (AUC) для переданных аллергенов
    const calculateAUC = (data) => {
      if (!data || data.length === 0) return 0;
      return data.reduce((acc, curr) => {
        return acc + allergens.reduce((sum, allergen) => sum + (Number(curr[allergen]) || 0), 0);
      }, 0);
    };

    const currentAUC = calculateAUC(currentData);
    // Усредняем исторический AUC по количеству лет (2023, 2024, 2025) - делим на 3
    const historicalAUC = calculateAUC(historicalData) / 3; 
    
    let expectedRemaining = historicalAUC - currentAUC;
    if (expectedRemaining < 0) expectedRemaining = 0;

    // Математическая модель экспоненциального затухания
    const daysToThreshold = expectedRemaining > 0 
      ? Math.max(0, Math.log(expectedRemaining / THRESHOLD) / decayConstant)
      : 0;

    const progress = historicalAUC > 0 ? Math.min(100, (currentAUC / historicalAUC) * 100) : 0;

    return {
      currentAUC,
      historicalAUC,
      expectedRemaining,
      daysToThreshold: Math.ceil(daysToThreshold),
      progress
    };
  }, [currentData, historicalData, allergens, decayConstant]);
};