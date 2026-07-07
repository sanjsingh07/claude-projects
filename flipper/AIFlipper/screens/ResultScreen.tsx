import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { saveItem, deleteItem, InventoryItem } from '../database/db';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { Config } from '../constants/Config';

const ResultScreen = ({ route, navigation }: any) => {
  const { result, isSavedItem } = route.params;
  const { id, productName, category, imageUrl, marketData, analysis } = result;

  const [condition, setCondition] = useState(result.condition || 'LIKE NEW');
  const [purchaseCost, setPurchaseCost] = useState(String(analysis?.breakdown?.purchaseCost || result.buyPrice || '50.00'));
  const [status, setStatus] = useState<'Listed' | 'Sold' | 'Pending'>(result.status || 'Listed');
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copyData, setCopyData] = useState<any>(null);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [defaultFee, setDefaultFee] = useState(13.5);
  const [targetRoi, setTargetRoi] = useState(45.0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${Config.API_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.defaultFee !== undefined) setDefaultFee(data.defaultFee);
          if (data.targetRoi !== undefined) setTargetRoi(data.targetRoi);
        }
      } catch (error) {
        console.warn('Failed to fetch settings for local calculation:', error);
      }
    };
    fetchSettings();
  }, []);

  // Recalculate analysis when condition or purchase cost changes
  const currentAvgSold = marketData?.avgSoldPrice || result.avgSoldPrice || 240.00;
  const currentBuyCost = parseFloat(purchaseCost) || 0;
  
  // Calculate dynamic deal on client side if purchase cost changes
  const defaultFeePercent = defaultFee / 100; // Loaded dynamically from backend settings
  const estShipping = 20.90;
  const fees = currentAvgSold * defaultFeePercent;
  const netRevenue = currentAvgSold - fees - estShipping;
  const estProfit = netRevenue - currentBuyCost;
  const currentRoi = currentBuyCost > 0 ? (estProfit / currentBuyCost) * 100 : 0;
  
  const currentVerdict = estProfit > 0 && currentRoi >= targetRoi ? 'BUY' : estProfit > 0 ? 'RISKY' : 'PASS';
  const currentConfidence = currentRoi >= (targetRoi + 15) ? 'Strong' : currentRoi >= 10 ? 'Medium' : 'Weak';
  
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'BUY': return { bg: Colors.primaryContainer, text: Colors.onPrimaryContainer, glow: 'rgba(0, 230, 118, 0.2)' };
      case 'RISKY': return { bg: Colors.tertiary, text: Colors.onTertiary, glow: 'rgba(255, 186, 121, 0.2)' };
      case 'PASS': return { bg: Colors.errorContainer, text: Colors.onErrorContainer, glow: 'rgba(147, 0, 10, 0.2)' };
      default: return { bg: Colors.surfaceContainerHighest, text: Colors.onSurface, glow: 'rgba(255,255,255,0)' };
    }
  };

  const vStyle = getVerdictStyle(currentVerdict);

  const handleSave = async () => {
    try {
      setSaving(true);
      const itemToSave: Partial<InventoryItem> = {
        id: id || undefined,
        productName: productName,
        category: category || result.category || 'General',
        imageUrl: imageUrl || marketData?.thumbnail || '',
        condition: condition,
        buyPrice: currentBuyCost,
        avgSoldPrice: currentAvgSold,
        estimatedProfit: parseFloat(estProfit.toFixed(2)),
        roi: parseFloat(currentRoi.toFixed(1)),
        verdict: currentVerdict,
        status: status,
        createdAt: result.createdAt || undefined
      };
      
      await saveItem(itemToSave);
      Alert.alert("Success", isSavedItem ? "Inventory item updated" : "Item logged in Vault");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this item from your inventory?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setSaving(true);
              await deleteItem(id);
              Alert.alert("Purged", "Record successfully deleted.");
              navigation.goBack();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete item.");
            } finally {
              setSaving(false);
            }
          } 
        }
      ]
    );
  };

  const handleGenerateListing = async () => {
    try {
      setGeneratingCopy(true);
      const response = await fetch(`${Config.API_URL}/generate-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category: category || result.category || 'General',
          condition
        })
      });
      if (response.ok) {
        const copy = await response.json();
        setCopyData(copy);
        setCopyModalVisible(true);
      } else {
        Alert.alert("Failed", "Could not generate copy listing from server.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection timed out.");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const renderConditionButton = (title: string) => {
    const isSelected = condition === title;
    return (
      <TouchableOpacity 
        style={[
          styles.conditionBtn, 
          isSelected ? styles.conditionBtnActive : styles.conditionBtnInactive
        ]}
        onPress={() => setCondition(title)}
      >
        <Text style={[
          Typography.labelBold, 
          { color: isSelected ? Colors.primaryContainer : 'rgba(255,255,255,0.6)' }
        ]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderStatusButton = (btnStatus: 'Listed' | 'Sold' | 'Pending') => {
    const isSelected = status === btnStatus;
    let activeBg = 'rgba(0, 104, 237, 0.15)';
    let activeBorder = Colors.secondary;
    let activeText = Colors.secondary;

    if (btnStatus === 'Sold') {
      activeBg = 'rgba(0, 230, 118, 0.1)';
      activeBorder = Colors.primaryContainer;
      activeText = Colors.primaryContainer;
    } else if (btnStatus === 'Pending') {
      activeBg = 'rgba(255, 186, 121, 0.1)';
      activeBorder = Colors.tertiary;
      activeText = Colors.tertiary;
    }

    return (
      <TouchableOpacity 
        style={[
          styles.statusBtn, 
          isSelected ? { backgroundColor: activeBg, borderColor: activeBorder, borderWidth: 1 } : styles.conditionBtnInactive
        ]}
        onPress={() => setStatus(btnStatus)}
      >
        <Text style={[
          Typography.labelBold, 
          { color: isSelected ? activeText : 'rgba(255,255,255,0.6)' }
        ]}>{btnStatus.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Text style={[styles.menuIcon, { color: 'rgba(255,255,255,0.6)' }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.logoText, Typography.headlineMd, { color: Colors.primaryContainer }]}>AI FLIPPER</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.profilePicContainer}>
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxshi7DXX9Re5x__P1buZGqxm6-meAZLHk1emoyzgoohZcQ1Wop3DQy4rd_7rp57g9K-pWxq0BiNzBi20L5A4aSZsZNMOb9RmpVrzekNSxk413v0KMGd3iyAu4Oj-2mLXq6veA_XSTm4u1pyVdXuUqkWhggxvvWgudpP0RTJm0UD-9k8ooNhbwFsJYxKC89vu6TGOlLKT6dq5RUTHVHpX7gx0PVzulQ6nEFpEy-9JP306Z-Tj6wWD_lIZP-Sn6I_02VhKIA-sPvrJd' }} style={styles.profilePic} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Product Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            {(imageUrl || marketData?.thumbnail) ? (
               <Image source={{ uri: imageUrl || marketData?.thumbnail }} style={styles.heroImage} resizeMode="cover" />
            ) : (
               <View style={[styles.heroImage, { backgroundColor: '#222' }]} />
            )}
            <View style={styles.heroDots}>
               <View style={[styles.dot, { backgroundColor: Colors.primaryContainer }]} />
               <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
               <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            </View>
          </View>
          
          <View style={styles.heroInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelBold, { color: Colors.secondary, fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }]} numberOfLines={1}>
                {(category || result.category || "General").toUpperCase()}
              </Text>
              <Text style={[Typography.headlineLg, { color: Colors.onSurface }]} numberOfLines={2}>{productName}</Text>
            </View>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>98% MATCH</Text>
            </View>
          </View>
        </View>

        {/* VERDICT CARD (1:1 with scan_result design mockup) */}
        <View style={[styles.verdictCard, { backgroundColor: vStyle.bg, shadowColor: vStyle.bg }]}>
          <Text style={[Typography.labelBold, { color: vStyle.text, letterSpacing: 2.8, fontSize: 10 }]}>VERDICT</Text>
          <Text style={[Typography.displayProfit, { color: vStyle.text, fontSize: 44, marginVertical: 4 }]}>{currentVerdict}</Text>
          <View style={[styles.verdictDivider, { backgroundColor: `${vStyle.text}22` }]} />
          <View style={styles.verdictGrid}>
            <View>
              <Text style={[styles.verdictLabel, { color: `${vStyle.text}AA` }]}>Confidence</Text>
              <Text style={[Typography.headlineMd, { color: vStyle.text }]}>{currentConfidence}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.verdictLabel, { color: `${vStyle.text}AA` }]}>Velocity</Text>
              <Text style={[Typography.headlineMd, { color: vStyle.text }]}>{analysis?.velocity || '4.2 Days'}</Text>
            </View>
          </View>
        </View>

        {/* KPI Grid (1:1 with scan_result design mockup) */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Avg Sold</Text>
            <Text style={[Typography.headlineMd, { color: '#fff' }]}>${currentAvgSold.toFixed(0)}</Text>
          </View>
          <View style={[styles.kpiBox, { borderColor: 'rgba(176,198,255,0.2)', borderWidth: 1 }]}>
            <Text style={styles.kpiLabel}>Max Buy</Text>
            <Text style={[Typography.headlineMd, { color: Colors.secondary }]}>${(analysis?.maxBuyPrice || (netRevenue / 1.45)).toFixed(0)}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: Colors.onPrimaryContainer }]}>
            <Text style={[styles.kpiLabel, { color: 'rgba(0,230,118,0.6)' }]}>Est. Profit</Text>
            <Text style={[Typography.headlineMd, { color: Colors.primaryContainer }]}>${estProfit.toFixed(0)}</Text>
          </View>
        </View>

        {/* Condition Selector */}
        <View style={styles.conditionSection}>
          <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5, marginBottom: Spacing.xs }]}>SELECT CONDITION</Text>
          <View style={styles.conditionRow}>
            {renderConditionButton('NEW')}
            {renderConditionButton('LIKE NEW')}
            {renderConditionButton('USED')}
          </View>
        </View>

        {/* Status Selector (For Inventory Items) */}
        <View style={styles.conditionSection}>
          <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5, marginBottom: Spacing.xs }]}>STATUS IN VAULT</Text>
          <View style={styles.conditionRow}>
            {renderStatusButton('Listed')}
            {renderStatusButton('Sold')}
            {renderStatusButton('Pending')}
          </View>
        </View>

        {/* Profit Calculator Card */}
        <View style={styles.profitCard}>
          <View style={styles.profitHeader}>
             <View>
               <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5 }]}>ESTIMATED NET PROFIT</Text>
               <Text style={[Typography.displayProfit, { color: Colors.primaryContainer }]}>${estProfit.toFixed(2)}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
               <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }]}>ROI</Text>
               <View style={styles.roiBadge}>
                 <Text style={{ color: Colors.primaryContainer, fontWeight: 'bold', fontSize: 14 }}>{currentRoi.toFixed(0)}%</Text>
               </View>
             </View>
          </View>
          
          <View style={styles.breakdownList}>
             <View style={styles.breakdownRow}>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Estimated Sale Price</Text>
               <Text style={[Typography.dataMono, { color: Colors.onSurface }]}>${currentAvgSold.toFixed(2)}</Text>
             </View>
             <View style={styles.breakdownRow}>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Purchase Cost</Text>
               <View style={styles.purchaseInputContainer}>
                 <Text style={[Typography.dataMono, { color: Colors.error, marginRight: 2 }]}>-$</Text>
                 <TextInput 
                   style={styles.purchaseInput} 
                   value={purchaseCost} 
                   onChangeText={setPurchaseCost} 
                   keyboardType="numeric"
                 />
               </View>
             </View>
             <View style={styles.breakdownRow}>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Platform Fees (12.9%)</Text>
               <Text style={[Typography.dataMono, { color: Colors.error }]}>-${fees.toFixed(2)}</Text>
             </View>
             <View style={styles.breakdownRow}>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Shipping Estimate</Text>
               <Text style={[Typography.dataMono, { color: Colors.error }]}>-${estShipping.toFixed(2)}</Text>
             </View>
          </View>

          <View style={styles.bestPlatformRow}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
               <Text style={{ color: Colors.onPrimaryContainer, fontSize: 18 }}>↗</Text>
               <Text style={[Typography.labelBold, { color: Colors.onPrimaryContainer }]}>BEST ON EBAY</Text>
             </View>
             <Text style={{ color: Colors.onPrimaryContainer, fontSize: 18 }}>→</Text>
          </View>
        </View>

        {/* Market Insights (Bento) */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoBox}>
            <Text style={{ fontSize: 24, color: Colors.secondary, marginBottom: 8 }}>⚡</Text>
            <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5 }]}>SALES VELOCITY</Text>
            <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{analysis?.verdict === 'PASS' ? 'LOW' : 'HIGH'}</Text>
          </View>
          <View style={styles.bentoBox}>
            <Text style={{ fontSize: 24, color: Colors.tertiary, marginBottom: 8 }}>📦</Text>
            <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5 }]}>ACTIVE LISTINGS</Text>
            <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{marketData?.listingCount || result.listingCount || 14}</Text>
          </View>
        </View>

        {/* Market Comps & Sparkline Trend (1:1 with scan_result design mockup) */}
        <View style={styles.compSection}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <View>
                <Text style={[Typography.labelBold, { color: Colors.onSurface, fontSize: 16 }]}>Market Comps</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 }}>Price Trend (90d)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: Colors.primaryContainer, fontSize: 14 }}>↗</Text>
                <Text style={[Typography.labelBold, { color: Colors.primaryContainer, fontSize: 14 }]}>+12%</Text>
              </View>
           </View>

           {/* Simple Sparkline Graph */}
           <View style={styles.compsSparkline}>
             <View style={[styles.sparklineBar, { height: '40%' }]} />
             <View style={[styles.sparklineBar, { height: '55%' }]} />
             <View style={[styles.sparklineBar, { height: '45%' }]} />
             <View style={[styles.sparklineBar, { height: '70%' }]} />
             <View style={[styles.sparklineBar, { height: '85%', backgroundColor: 'rgba(0,230,118,0.4)' }]} />
             <View style={[styles.sparklineBar, { height: '75%', backgroundColor: 'rgba(0,230,118,0.6)' }]} />
             <View style={[styles.sparklineBar, { height: '100%', backgroundColor: Colors.primaryContainer }]} />
           </View>

           {(marketData?.recentComps || result.recentComps || []).map((comp: any, idx: number) => (
             <View key={idx} style={styles.compCard}>
                <View style={styles.compLeft}>
                   <View style={styles.compIconBox}>
                     <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{comp.icon === 'shopping_bag' || comp.source.includes('eBay') ? '🛒' : comp.icon === 'token' || comp.source.includes('StockX') ? '🟢' : '🏪'}</Text>
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[Typography.labelBold, { color: Colors.onSurface }]} numberOfLines={1}>{comp.title || comp.source}</Text>
                     <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{comp.date}</Text>
                   </View>
                </View>
                <Text style={[Typography.dataMono, { color: Colors.primaryContainer, fontSize: 16 }]}>{comp.price}</Text>
             </View>
           ))}
        </View>

      </ScrollView>

      {/* Modal for displaying copywriting listing */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={copyModalVisible}
        onRequestClose={() => setCopyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.headlineMd, { color: Colors.primaryContainer }]}>AI Listing Copywriter</Text>
              <TouchableOpacity onPress={() => setCopyModalVisible(false)}><Text style={{ color: '#fff', fontSize: 24 }}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {copyData && (
                <View style={{ gap: Spacing.md }}>
                  <View>
                    <Text style={[Typography.labelBold, { color: Colors.secondary, fontSize: 11 }]}>SUGGESTED TITLE</Text>
                    <View style={styles.modalCard}><Text style={[Typography.bodyMd, { color: '#fff' }]}>{copyData.title}</Text></View>
                  </View>
                  <View>
                    <Text style={[Typography.labelBold, { color: Colors.secondary, fontSize: 11 }]}>SUGGESTED DESCRIPTION</Text>
                    <View style={styles.modalCard}><Text style={[Typography.bodyLg, { color: '#fff', fontSize: 14, lineHeight: 22 }]}>{copyData.description}</Text></View>
                  </View>
                  <View>
                    <Text style={[Typography.labelBold, { color: Colors.secondary, fontSize: 11 }]}>SUGGESTED TAGS</Text>
                    <View style={styles.tagsContainer}>
                      {copyData.suggestedTags.map((tag: string, i: number) => (
                        <View key={i} style={styles.tagChip}><Text style={{ color: Colors.primaryContainer, fontSize: 12 }}>#{tag}</Text></View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCopyModalVisible(false)}>
              <Text style={[Typography.labelBold, { color: Colors.onPrimaryContainer }]}>CLOSE PANEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        {saving ? (
          <ActivityIndicator color={Colors.primaryContainer} size="large" style={{ flex: 1 }} />
        ) : isSavedItem ? (
          <>
            <TouchableOpacity style={styles.passButton} onPress={handleDelete}>
               <Text style={[Typography.labelBold, { color: Colors.error, letterSpacing: 2 }]}>PURGE RECORD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logButton} onPress={handleSave}>
               <Text style={[Typography.labelBold, { color: Colors.onPrimaryContainer, letterSpacing: 2 }]}>UPDATE DETAILS</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.passButton} onPress={() => navigation.goBack()}>
               <Text style={[Typography.labelBold, { color: Colors.error, letterSpacing: 2 }]}>PASS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logButton} onPress={handleSave}>
               <Text style={[Typography.labelBold, { color: Colors.onPrimaryContainer, letterSpacing: 2 }]}>LOG PURCHASE</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Floating Action Button (FAB) for Listing Generation */}
      {!saving && (
        <TouchableOpacity style={styles.fab} onPress={handleGenerateListing} disabled={generatingCopy}>
          {generatingCopy ? (
            <ActivityIndicator color={Colors.onSecondaryContainer} />
          ) : (
            <Text style={{ fontSize: 24 }}>✨</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  menuIcon: {
    fontSize: 24,
  },
  logoText: {
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  profilePicContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryContainer,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingTop: 100 + Spacing.md,
    paddingBottom: 150, // space for bottom action bar
    gap: Spacing.lg,
  },
  heroSection: {
    gap: Spacing.md,
  },
  heroImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchBadge: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  matchText: {
    color: Colors.primaryContainer,
    fontSize: 14,
    fontWeight: 'bold',
  },
  verdictCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  verdictDivider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  verdictGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  verdictLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: '100%',
  },
  kpiBox: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  conditionSection: {
    gap: Spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  conditionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  conditionBtnActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
  },
  conditionBtnInactive: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profitCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  roiBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  breakdownList: {
    borderTopWidth: 1,
    borderTopColor: Colors.white05,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseInput: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BorderRadius.default,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    width: 60,
    textAlign: 'right',
  },
  bestPlatformRow: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoBox: {
    flex: 1,
    backgroundColor: Colors.glass,
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  compSection: {
    paddingBottom: Spacing.lg,
  },
  compsSparkline: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
    marginBottom: Spacing.md,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  compCard: {
    backgroundColor: Colors.glass,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  compLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  compIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.glassStroke,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 100,
  },
  passButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
    paddingVertical: 16,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
  },
  logButton: {
    flex: 2,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 200,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,21,14,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    padding: Spacing.lg,
    maxHeight: '80%',
    gap: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalScroll: {
    marginVertical: Spacing.sm,
  },
  modalCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  tagChip: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
});

export default ResultScreen;
