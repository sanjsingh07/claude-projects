import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TransitFilters {
  showShadow: boolean;
  showMajor: boolean;
  showMinor: boolean;
  showRealTime: boolean;
  showPersonal: boolean;
}

interface TransitState {
  filters: TransitFilters;
  setFilter: (key: keyof TransitFilters, value: boolean) => void;
  toggleFilter: (key: keyof TransitFilters) => void;
}

export const useTransitStore = create<TransitState>()(
  persist(
    (set) => ({
      filters: {
        showShadow: true,
        showMajor: true,
        showMinor: true,
        showRealTime: true,
        showPersonal: true,
      },
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      toggleFilter: (key) =>
        set((state) => ({
          filters: { ...state.filters, [key]: !state.filters[key] },
        })),
    }),
    {
      name: 'transit-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
