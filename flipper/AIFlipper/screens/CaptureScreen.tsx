import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { getDashboardStats } from '../database/db';
import { Config } from '../constants/Config';

const API_URL = Config.API_URL; 

export default function CaptureScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({ totalProfit: 0, itemsListed: 0, sellThrough: 0, recentScans: [] as any[] });
  const cameraRef = useRef<any>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  const loadStats = async () => {
    const data = await getDashboardStats();
    setStats(data);
  };

  const performSearch = async () => {
    try {
      setIsScanning(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      const response = await fetch(`${API_URL}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo.base64 }),
      });

      const data = await response.json();
      
      if (response.ok) {
        navigation.navigate('Result', { result: data });
      } else {
        Alert.alert("Error", data.error || "Failed to research item");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to the server");
    } finally {
      setIsScanning(false);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={[styles.permissionText, Typography.bodyMd]}>Camera access required for vision processing.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
           <Text style={[styles.buttonText, Typography.labelBold]}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
             <Text style={[styles.menuIcon, { color: Colors.primaryContainer }]}>☰</Text>
          </TouchableOpacity>
          <Text style={[styles.logoText, Typography.headlineMd, { color: Colors.primaryContainer }]}>AI FLIPPER</Text>
        </View>
        <View style={styles.profilePicContainer}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx4gvBpwW8eEKrho4d68kURxcOKfZyYltaGeB-qNVsiK_JdQRchTSw-cBwnXL0BeFrJvsW15oU51NcpWva0O9ySDvKOlaHwHhsuEA7yiNNdu9XbiG4RbVvFciDqFGHVWK1_I_Y_X5gU210se6_VOlbi9iikKpNWAvu8wx-y8Y814PnVvBH8azyGr2GJ0-veX2eNmCFpNj_s-M7L-VVW3WmfMB9swmgUnVeWErRR3X6BeRENKhT5u-uzUPbiinj-5rtOUBiRnzJ9XSL' }} style={styles.profilePic} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Scanning Section */}
        <View style={styles.scannerViewport}>
          {isFocused ? (
            <CameraView style={styles.camera} ref={cameraRef}>
              <View style={styles.overlay}>
                {/* Target Outline */}
                <View style={styles.targetOutline} />
                
                <View style={styles.scanActionContainer}>
                  {isScanning ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={Colors.primaryContainer} />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.scanButton} onPress={performSearch}>
                      <Text style={[styles.scanButtonText, Typography.headlineMd]}>⦿ SCAN ITEM</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.scanHint, Typography.labelBold]}>READY FOR CAPTURE</Text>
                </View>
              </View>
            </CameraView>
          ) : (
            <View style={[styles.camera, { backgroundColor: '#050c06', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>Camera paused</Text>
            </View>
          )}
        </View>

        {/* Quick Inventory Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.glassCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }]}>Total Est. Profit</Text>
                <Text style={[Typography.displayProfit, { color: Colors.primaryContainer }]}>${stats.totalProfit.toFixed(2)}</Text>
              </View>
              <View style={styles.trendBadge}>
                 <Text style={{ fontSize: 24, color: Colors.primaryContainer }}>↗</Text>
              </View>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }]}>Items Listed</Text>
                <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{stats.itemsListed}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }]}>Sell-Through</Text>
                <Text style={[Typography.headlineMd, { color: Colors.secondary }]}>{stats.sellThrough}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Scans Carousel */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>Recent Scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
              <Text style={[Typography.labelBold, { color: Colors.primaryContainer, fontSize: 12 }]}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentCarousel}>
            {stats.recentScans.length > 0 ? stats.recentScans.map((item, idx) => (
              <View key={item.id} style={styles.recentCard}>
                <View style={styles.recentImageContainer}>
                  {item.imageUrl ? (
                     <Image source={{ uri: item.imageUrl }} style={styles.recentImage} />
                  ) : (
                     <View style={[styles.recentImage, { backgroundColor: '#222' }]} />
                  )}
                  <View style={item.estimatedProfit >= 0 ? styles.recentBadgeProfit : styles.recentBadgeLoss}>
                    <Text style={{ color: item.estimatedProfit >= 0 ? Colors.onPrimaryContainer : Colors.onErrorContainer, fontSize: 10, fontWeight: 'bold' }}>
                      {item.estimatedProfit >= 0 ? '+' : '-'}${Math.abs(item.estimatedProfit).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentDetails}>
                  <Text style={[Typography.labelBold, { color: Colors.onSurface, fontSize: 12 }]} numberOfLines={1}>{item.productName}</Text>
                  <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )) : (
              <View style={styles.recentCardEmpty}>
                 <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>No recent scans.</Text>
              </View>
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  primaryButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: BorderRadius.xl,
  },
  buttonText: {
    color: Colors.onPrimaryContainer,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    height: 100, // Accounting for status bar
    paddingTop: 40,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassStroke,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingTop: 100, // Below header
    paddingBottom: 40,
  },
  scannerViewport: {
    width: '100%',
    height: 530,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,21,14,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  targetOutline: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '30%',
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.5)',
    borderRadius: 24,
  },
  scanActionContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    zIndex: 10,
  },
  scanButton: {
    width: '100%',
    maxWidth: 384,
    paddingVertical: 20,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  scanButtonText: {
    color: Colors.onPrimaryContainer,
  },
  scanHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 16,
    letterSpacing: 1.5,
  },
  loadingContainer: {
    backgroundColor: Colors.primaryContainer,
    padding: 20,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: -32,
    zIndex: 20,
  },
  glassCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  trendBadge: {
    backgroundColor: 'rgba(0,230,118,0.1)',
    padding: 12,
    borderRadius: BorderRadius.xl,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: Colors.white05,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.white05,
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.containerMargin,
    marginBottom: Spacing.md,
  },
  recentCarousel: {
    paddingLeft: Spacing.containerMargin,
    paddingRight: Spacing.containerMargin,
    gap: Spacing.md,
  },
  recentCardEmpty: {
    width: 176,
    height: 180,
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentCard: {
    width: 176, // w-44
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    overflow: 'hidden',
  },
  recentImageContainer: {
    height: 128, // h-32
    width: '100%',
    position: 'relative',
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentBadgeProfit: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  recentBadgeLoss: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(147, 0, 10, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  recentDetails: {
    padding: 12,
  },
});
