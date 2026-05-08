import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { User } from '@types';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: storeLoading, setUser, logout: storeLogout } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.login(email, password);
      console.log('useAuth login response:', response);
      // After interceptor, response is the body: { success, data: { user, tokens } }
      // So response.data has { user, tokens }
      const userData = response.data?.user;
      if (!userData) {
        throw new Error('No user data in response: ' + JSON.stringify(response));
      }
      return userData;
    },
    onSuccess: (userData) => {
      console.log('useAuth login success, setting user:', userData);
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['horoscope'] });
      queryClient.invalidateQueries({ queryKey: ['chart'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => {
      console.error('useAuth login error:', error);
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      birthDate: string;
      birthTime?: string;
      birthTimezone: string;
      birthLocationName?: string;
      birthLatitude?: number;
      birthLongitude?: number;
      displayName?: string;
    }) => {
      const response = await api.register(data);
      console.log('useAuth register response:', response);
      const userData = response.data?.user;
      if (!userData) {
        throw new Error('No user data in response: ' + JSON.stringify(response));
      }
      return userData;
    },
    onSuccess: (userData) => {
      console.log('useAuth register success, setting user:', userData);
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('useAuth register error:', error);
    }
  });

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      storeLogout();
      queryClient.clear();
    }
  }, [storeLogout, queryClient]);

  // Social login mutation
  const socialLoginMutation = useMutation({
    mutationFn: async ({ provider, idToken }: { provider: 'google' | 'apple'; idToken: string }) => {
      const response = await api.socialLogin(provider, idToken);
      const userData = response.data?.user;
      if (!userData) {
        throw new Error('No user data in response');
      }
      return userData;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['horoscope'] });
      queryClient.invalidateQueries({ queryKey: ['chart'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      birthDate?: string;
      birthTime?: string;
      birthTimezone?: string;
      birthLocationName?: string;
      birthLatitude?: number;
      birthLongitude?: number;
    }) => {
      const response = await api.updateUser(data);
      // Backend returns { success: true, data: user }
      const userData = response.data;
      if (!userData) {
        throw new Error('No user data in response');
      }
      return userData;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['horoscope'] });
      queryClient.invalidateQueries({ queryKey: ['chart'] });
    },
    onError: (error: any) => {
      console.error('updateProfile error:', error);
      throw error;
    }
  });

  return {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    socialLogin: socialLoginMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    logout,
    completeOnboarding: () => useAuthStore.getState().completeOnboarding(),
    isLoginPending: loginMutation.isPending || socialLoginMutation.isPending,
    error: loginMutation.error || registerMutation.error || socialLoginMutation.error,
  };
}
