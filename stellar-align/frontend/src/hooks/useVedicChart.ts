import { useCallback } from 'react';
import { useVedicChartStore } from '@store/vedicChartStore';
import { api } from '@services/api';

export const useVedicChart = () => {
  const {
    natalChart,
    selectedDivisionalChart,
    divisionalCharts,
    nakshatra,
    ayanamsa,
    ayanamsaType,
    isLoading,
    error,
    setNatalChart,
    setSelectedDivisionalChart,
    setDivisionalChart,
    setNakshatra,
    setAyanamsa,
    setLoading,
    setError,
    clear,
  } = useVedicChartStore();

  const calculateVedicChart = useCallback(async (ayanamsaType?: 'lahiri' | 'raman' | 'krishnamurti' | 'fagan-bradley') => {
    try {
      setLoading(true);
      setError(null);

      // API interceptor unwraps response.data, so we get the data directly
      const result = await api.calculateVedicChart(ayanamsaType);
      const data = result.data || result;

      if (data) {
        setNatalChart(data);

        // Store divisional charts
        data.divisionalCharts?.forEach((chart: any) => {
          setDivisionalChart(chart.chartType, chart);
        });
        if (data.divisionalCharts?.some((chart: any) => chart.chartType === 'D1')) {
          setSelectedDivisionalChart('D1');
        }

        // Store nakshatra info
        if (data.nakshatra || data.data?.nakshatra) {
          setNakshatra({
            name: data.nakshatra || data.data?.nakshatra,
            pada: data.nakshatraPada || data.data?.nakshatraPada,
            lord: data.nakshatraLord || data.data?.nakshatraLord,
            degree: 0,
            padaDegree: 0,
          });
        }

        // Store ayanamsa
        if (data.ayanamsa) {
          setAyanamsa(data.ayanamsa, data.ayanamsaType);
        }

        return data;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate Vedic chart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVedicChart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.getVedicChart();
      const data = result.data || result;

      if (data) {
        setNatalChart(data);

        // Store divisional charts
        data.divisionalCharts?.forEach((chart: any) => {
          setDivisionalChart(chart.chartType, chart);
        });
        if (data.divisionalCharts?.some((chart: any) => chart.chartType === 'D1')) {
          setSelectedDivisionalChart('D1');
        }

        return data;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get Vedic chart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDivisionalChart = useCallback(async (chartType: 'D1' | 'D2' | 'D4' | 'D9' | 'D10' | 'D11') => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.getDivisionalChart(chartType);
      const data = result.data || result;

      if (data) {
        setDivisionalChart(chartType, data);
        return data;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get divisional chart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNakshatra = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.getNakshatra();
      const data = result.data || result;

      if (data) {
        if (data.nakshatra || data.data?.nakshatra) {
          setNakshatra({
            name: data.nakshatra || data.data?.nakshatra,
            pada: data.nakshatraPada || data.data?.nakshatraPada,
            lord: data.nakshatraLord || data.data?.nakshatraLord,
            degree: 0,
            padaDegree: 0,
          });
        }
        return data;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get nakshatra');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDivisionalChart = useCallback((type: 'D1' | 'D2' | 'D4' | 'D9' | 'D10' | 'D11' | null) => {
    setSelectedDivisionalChart(type);
  }, []);

  return {
    natalChart,
    selectedDivisionalChart,
    divisionalCharts,
    nakshatra,
    ayanamsa,
    ayanamsaType,
    isLoading,
    error,
    calculateVedicChart,
    getVedicChart,
    getDivisionalChart,
    getNakshatra,
    selectDivisionalChart,
    clear,
  };
};
