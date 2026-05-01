import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DailyHoroscope, HoroscopeCategory } from '@types';

interface HoroscopeState {
  todayHoroscope: DailyHoroscope | null;
  history: DailyHoroscope[];
  categories: HoroscopeCategory[];
  bookmarkedIds: string[];
  isLoading: boolean;

  setTodayHoroscope: (horoscope: DailyHoroscope | null) => void;
  addToHistory: (horoscope: DailyHoroscope) => void;
  loadMoreHistory: (horoscopes: DailyHoroscope[]) => void;
  toggleBookmark: (id: string) => void;
  setCategories: (categories: HoroscopeCategory[]) => void;
  setLoading: (value: boolean) => void;
  clear: () => void;
}

export const useHoroscopeStore = create<HoroscopeState>()(
  persist(
    (set) => ({
      todayHoroscope: null,
      history: [],
      categories: [],
      bookmarkedIds: [],
      isLoading: false,

      setTodayHoroscope: (horoscope) => set({ todayHoroscope: horoscope }),

      addToHistory: (horoscope) =>
        set((state) => ({
          history: [horoscope, ...state.history.filter((h) => h.id !== horoscope.id)],
        })),

      loadMoreHistory: (horoscopes) =>
        set((state) => ({
          history: [...state.history, ...horoscopes],
        })),

      toggleBookmark: (id) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(id)
            ? state.bookmarkedIds.filter((bid) => bid !== id)
            : [...state.bookmarkedIds, id],
        })),

      setCategories: (categories) => set({ categories }),

      setLoading: (value) => set({ isLoading: value }),

      clear: () =>
        set({
          todayHoroscope: null,
          history: [],
          categories: [],
          bookmarkedIds: [],
        }),
    }),
    {
      name: 'horoscope-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todayHoroscope: state.todayHoroscope,
        bookmarkedIds: state.bookmarkedIds,
      }),
    }
  )
);
