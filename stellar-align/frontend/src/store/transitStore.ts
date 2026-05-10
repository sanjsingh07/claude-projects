import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TransitFilters {
  /** item.type === 'shadow' */
  showShadow: boolean;
  /** item.type === 'major' */
  showMajor: boolean;
  /** item.type === 'minor' */
  showMinor: boolean;
  /** item.eventKind in ['sky_aspect', 'ingress', 'station_retrograde', 'station_direct'] */
  showRealTime: boolean;
  /** item.eventKind === 'natal_aspect' */
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
