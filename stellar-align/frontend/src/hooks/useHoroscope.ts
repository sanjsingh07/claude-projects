import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@services/api';
import { useHoroscopeStore } from '@store/horoscopeStore';
import { DailyHoroscope, HoroscopeCategory } from '@types';
import { useCallback } from 'react';

function formatCategories(horoscope: DailyHoroscope): HoroscopeCategory[] {
  return [
    { id: 'self', title: 'Self', icon: 'sparkles', content: horoscope.contentSelf },
    { id: 'work', title: 'Work', icon: 'briefcase', content: horoscope.contentWork },
    { id: 'love', title: 'Love', icon: 'heart', content: horoscope.contentLove },
    { id: 'social', title: 'Social', icon: 'chatbubbles', content: horoscope.contentSocial },
  ];
}

export function useHoroscope() {
  const queryClient = useQueryClient();
  const {
    todayHoroscope,
    history,
    bookmarkedIds,
    setTodayHoroscope,
    addToHistory,
    toggleBookmark: toggleBookmarkStore,
    setCategories,
    setLoading,
  } = useHoroscopeStore();

  // Fetch today's horoscope
  const { isLoading: isTodayLoading, error } = useQuery({
    queryKey: ['horoscope', 'today'],
    queryFn: async () => {
      const response = await api.getTodayHoroscope();
      const horoscope = response.data;
      setTodayHoroscope(horoscope);
      setCategories(formatCategories(horoscope));
      return horoscope;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch history (infinite query for pagination)
  const { fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['horoscope', 'history'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.getHoroscopeHistory(pageParam);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage.meta?.pagination?.totalPages || 0;
      const currentPage = allPages.length;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: false, // Manual fetch
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ id, bookmarked }: { id: string; bookmarked: boolean }) => {
      const response = await api.bookmarkHoroscope(id, bookmarked);
      return response.data;
    },
    onMutate: async ({ id }) => {
      toggleBookmarkStore(id);
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.shareHoroscope(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['horoscope', 'today'], (old: any) => {
        if (old?.id === id) {
          return { ...old, shared: true };
        }
        return old;
      });
    },
  });

  const toggleBookmark = useCallback(
    async (id: string, bookmarked: boolean) => {
      await bookmarkMutation.mutateAsync({ id, bookmarked });
    },
    [bookmarkMutation],
  );

  const shareHoroscope = useCallback(
    async (id: string) => {
      await shareMutation.mutateAsync(id);
    },
    [shareMutation],
  );

  const refreshHoroscope = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['horoscope'] });
  }, [queryClient]);

  const bookmarkedHoroscopes = history.filter((h) => bookmarkedIds.includes(h.id));

  return {
    todayHoroscope,
    categories: useHoroscopeStore((s) => s.categories),
    bookmarkedHoroscopes,
    isLoading: isTodayLoading,
    error,
    refresh: refreshHoroscope,
    toggleBookmark,
    shareHoroscope,
    fetchNextPage,
    hasNextPage,
    hasActiveTransits: !!todayHoroscope?.activeTransits?.length,
  };
}