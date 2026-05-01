import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NatalChartWithVedic,
  DivisionalChart,
  DivisionalChartType,
  Nakshatra,
  AyanamsaType,
} from '@types';

interface VedicChartState {
  natalChart: NatalChartWithVedic | null;
  selectedDivisionalChart: DivisionalChartType | null;
  divisionalCharts: Record<DivisionalChartType, DivisionalChart | null>;
  nakshatra: Nakshatra | null;
  ayanamsa: number | null;
  ayanamsaType: AyanamsaType | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setNatalChart: (chart: NatalChartWithVedic | null) => void;
  setSelectedDivisionalChart: (type: DivisionalChartType | null) => void;
  setDivisionalChart: (type: DivisionalChartType, chart: DivisionalChart) => void;
  setNakshatra: (nakshatra: Nakshatra | null) => void;
  setAyanamsa: (value: number, type: AyanamsaType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useVedicChartStore = create<VedicChartState>()(
  persist(
    (set) => ({
      // State
      natalChart: null,
      selectedDivisionalChart: null,
      divisionalCharts: {
        D1: null,
        D2: null,
        D4: null,
        D9: null,
        D10: null,
        D11: null,
      },
      nakshatra: null,
      ayanamsa: null,
      ayanamsaType: null,
      isLoading: false,
      error: null,

      // Actions
      setNatalChart: (chart) => set({ natalChart: chart }),

      setSelectedDivisionalChart: (type) => set({ selectedDivisionalChart: type }),

      setDivisionalChart: (type, chart) =>
        set((state) => ({
          divisionalCharts: {
            ...state.divisionalCharts,
            [type]: chart,
          },
        })),

      setNakshatra: (nakshatra) => set({ nakshatra }),

      setAyanamsa: (value, type) => set({ ayanamsa: value, ayanamsaType: type }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clear: () =>
        set({
          natalChart: null,
          selectedDivisionalChart: null,
          divisionalCharts: {
            D1: null,
            D2: null,
            D4: null,
            D9: null,
            D10: null,
            D11: null,
          },
          nakshatra: null,
          ayanamsa: null,
          ayanamsaType: null,
          error: null,
        }),
    }),
    {
      name: 'vedic-chart-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        natalChart: state.natalChart,
        selectedDivisionalChart: state.selectedDivisionalChart,
        nakshatra: state.nakshatra,
        ayanamsa: state.ayanamsa,
        ayanamsaType: state.ayanamsaType,
      }),
    }
  )
);
