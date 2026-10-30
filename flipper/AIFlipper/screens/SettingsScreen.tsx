import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { api } from '../services/ApiClient';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ebayActive, setEbayActive] = useState(true);
  const [amazonActive, setAmazonActive] = useState(true);
  const [mercariActive, setMercariActive] = useState(false);
  const [priceDrops, setPriceDrops] = useState(true);
  const [highDemand, setHighDemand] = useState(true);
  const [defaultFee, setDefaultFee] = useState('13.5');
  const [targetRoi, setTargetRoi] = useState('45.0');

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSettings();
    }
  }, [isFocused]);

  const loadSettings = async () => {
    try {
      setLoadState('loading');
      const data = await api.get<any>('/settings');
      setEbayActive(data.ebayActive ?? true);
      setAmazonActive(data.amazonActive ?? true);
      setMercariActive(data.mercariActive ?? false);
      setPriceDrops(data.priceDrops ?? true);
      setHighDemand(data.highDemand ?? true);
      setDefaultFee(String(data.defaultFee ?? '13.5'));
      setTargetRoi(String(data.targetRoi ?? '45.0'));
      setLoadState('ready');
    } catch (error) {
      // On failure this used to fall through and render the form pre-filled with
      // default values — the user couldn't tell their saved config from a
      // hardcoded 13.5% / 45%, and any edit would silently fail to persist.
      console.warn('Failed to load settings from backend:', error);
      setLoadState('error');
    }
  };

  const comingSoon = (feature: string) => {
    Alert.alert(feature, 'This feature isn’t available yet.');
  };

  const saveSettings = async (updatedFields: any) => {
    try {
      const currentSettings = {
        ebayActive,
        amazonActive,
        mercariActive,
        priceDrops,
        highDemand,
        defaultFee: parseFloat(defaultFee) || 13.5,
        targetRoi: parseFloat(targetRoi) || 45.0,
        ...updatedFields
      };

      await api.post('/settings', currentSettings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    switch (key) {
      case 'ebayActive':
        setEbayActive(value);
        saveSettings({ ebayActive: value });
        break;
      case 'amazonActive':
        setAmazonActive(value);
        saveSettings({ amazonActive: value });
        break;
      case 'mercariActive':
        setMercariActive(value);
        saveSettings({ mercariActive: value });
        break;
      case 'priceDrops':
        setPriceDrops(value);
        saveSettings({ priceDrops: value });
        break;
      case 'highDemand':
        setHighDemand(value);
        saveSettings({ highDemand: value });
        break;
    }
  };

  const handleTextSubmit = (key: string, text: string) => {
    const numericValue = parseFloat(text);
    if (isNaN(numericValue)) {
      Alert.alert("Invalid Input", "Please enter a valid numeric value.");
      return;
    }

    if (key === 'defaultFee') {
      setDefaultFee(text);
      saveSettings({ defaultFee: numericValue });
    } else if (key === 'targetRoi') {
      setTargetRoi(text);
      saveSettings({ targetRoi: numericValue });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "End Session",
      "Sign out of this account? Your synced data stays safe on the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => { logout(); },
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Confirm Factory Reset",
      "Are you sure you want to restore default intelligence parameters?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const defaults = {
              ebayActive: true,
              amazonActive: true,
              mercariActive: false,
              defaultFee: 13.5,
              targetRoi: 45.0,
              priceDrops: true,
              highDemand: true,
            };
            setEbayActive(true);
            setAmazonActive(true);
            setMercariActive(false);
            setPriceDrops(true);
            setHighDemand(true);
            setDefaultFee('13.5');
            setTargetRoi('45.0');
            await saveSettings(defaults);
            Alert.alert("Reset Completed", "Default configuration loaded.");
          }
        }
      ]
    );
  };

  if (loadState === 'loading') {
    return (
      <View style={[styles.container, styles.centerFill]}>
        <ActivityIndicator color={Colors.primaryContainer} size="large" />
      </View>
    );
  }

  if (loadState === 'error') {
    return (
      <View style={[styles.container, styles.centerFill, { paddingHorizontal: Spacing.lg }]}>
        <Text style={[Typography.headlineMd, { color: Colors.error }]}>CAN'T REACH SERVER</Text>
        <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }]}>
          Your configuration couldn't be loaded, so it can't be safely edited right now.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={[Typography.labelBold, { color: Colors.onPrimary }]}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.menuIcon, { color: Colors.primaryContainer }]}>☰</Text>
          <Text style={[styles.logoText, Typography.headlineMd, { color: Colors.primaryContainer }]}>AI FLIPPER</Text>
        </View>
        <View style={styles.profilePicContainer}>
          <View style={{ width: '100%', height: '100%', backgroundColor: Colors.surfaceContainerHighest }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={[Typography.headlineLg, { color: Colors.onSurface }]}>Intelligence Config</Text>
          <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant, marginTop: 4 }]}>Surgical control over your flipping automation logic.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE DATA STREAMS</Text>
          <View style={styles.glassCardList}>
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0,100,210,0.2)' }]}>
                   <Text style={{ fontSize: 20 }}>🛒</Text>
                </View>
                <View>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>eBay API</Text>
                  <Text style={styles.listSubtext}>Real-time sold listings & comps</Text>
                </View>
              </View>
              <Switch value={ebayActive} onValueChange={(val) => handleToggle('ebayActive', val)} trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHighest }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,153,0,0.2)' }]}>
                   <Text style={{ fontSize: 20 }}>📦</Text>
                </View>
                <View>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Amazon FBA</Text>
                  <Text style={styles.listSubtext}>Sales rank & buy box metrics</Text>
                </View>
              </View>
              <Switch value={amazonActive} onValueChange={(val) => handleToggle('amazonActive', val)} trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHighest }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(45,49,250,0.2)' }]}>
                   <Text style={{ fontSize: 20 }}>🏪</Text>
                </View>
                <View>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Mercari Marketplace</Text>
                  <Text style={styles.listSubtext}>Local pickup & direct ship data</Text>
                </View>
              </View>
              <Switch value={mercariActive} onValueChange={(val) => handleToggle('mercariActive', val)} trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHighest }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FINANCIAL ALGORITHMS</Text>
          <View style={styles.gridRow}>
            <View style={styles.glassCardInput}>
              <Text style={styles.inputLabel}>Default Fee %</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.textInput} 
                  value={defaultFee} 
                  keyboardType="numeric" 
                  onChangeText={setDefaultFee}
                  onEndEditing={(e) => handleTextSubmit('defaultFee', e.nativeEvent.text)}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>
            <View style={styles.glassCardInput}>
              <Text style={styles.inputLabel}>Target ROI %</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.textInput} 
                  value={targetRoi} 
                  keyboardType="numeric" 
                  onChangeText={setTargetRoi}
                  onEndEditing={(e) => handleTextSubmit('targetRoi', e.nativeEvent.text)}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
             <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>SHIPPING PRESETS</Text>
             <TouchableOpacity onPress={() => comingSoon('Add Shipping Preset')}><Text style={{ color: Colors.primaryContainer, fontSize: 12, fontWeight: 'bold' }}>+ ADD PRESET</Text></TouchableOpacity>
           </View>
           <View style={styles.glassCardSingle}>
              <View style={styles.listLeft}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>📮</Text>
                <View>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Standard Light (Under 1lb)</Text>
                  <Text style={styles.listSubtext}>$4.25 Flat Rate</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Edit Shipping Preset')}><Text style={{ color: Colors.onSurfaceVariant }}>✎</Text></TouchableOpacity>
           </View>
           <View style={[styles.glassCardSingle, { marginTop: Spacing.sm }]}>
              <View style={styles.listLeft}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>📦</Text>
                <View>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Heavy Cargo (10lb+)</Text>
                  <Text style={styles.listSubtext}>UPS Ground Calculation</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => comingSoon('Edit Shipping Preset')}><Text style={{ color: Colors.onSurfaceVariant }}>✎</Text></TouchableOpacity>
           </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GLOBAL ALERTS</Text>
          <View style={styles.glassCardList}>
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>📉</Text>
                <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Price Drops</Text>
              </View>
              <Switch value={priceDrops} onValueChange={(val) => handleToggle('priceDrops', val)} trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHighest }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
                <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>High-Demand Alerts</Text>
              </View>
              <Switch value={highDemand} onValueChange={(val) => handleToggle('highDemand', val)} trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHighest }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.glassCardSingle}>
            <View style={styles.listLeft}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>👤</Text>
              <View>
                <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>Signed in</Text>
                <Text style={styles.listSubtext}>{user?.email ?? 'Unknown operator'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{ color: Colors.error, fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1 }}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
           <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
              <Text style={styles.dangerButtonText}>FACTORY RESET LOGIC</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerFill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    height: 100,
    paddingTop: 40,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassStroke,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 24,
  },
  logoText: {
    letterSpacing: 2,
  },
  profilePicContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingTop: 100 + Spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  glassCardList: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  listSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.white05,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  glassCardInput: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    color: Colors.onSurface,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 24,
  },
  inputSuffix: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 24,
    color: Colors.onSurfaceVariant,
    marginLeft: Spacing.sm,
  },
  glassCardSingle: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: Colors.error,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    fontSize: 12,
  },
});

export default SettingsScreen;
