import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { saveItem, deleteItem, InventoryItem } from '../database/db';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { api } from '../services/ApiClient';
import { calculateDeal } from '@flipper/shared';

const ResultScreen = ({ route, navigation }: any) => {
  // A params-less navigation (a deep link, a restored back stack) used to throw
  // on this destructure before the component could render, crashing to a blank
  // red screen. Default to an empty object and show a real message below.
  const { result, isSavedItem } = route.params ?? {};
  const { id, productName, category, imageUrl, marketData, analysis } = result ?? {};

  // Identification signals from the Vision service (absent on a saved Vault
  // item, which was never a fresh scan). `confidence` is a real 0-1 score, not
  // the old hardcoded "98% MATCH"; `alternates` are ranked runner-up guesses so
  // a wrong top pick can be corrected without re-scanning.
  const idConfidence: number | undefined =
    typeof result?.confidence === 'number' ? result.confidence : undefined;
  const alternates: Array<{ name: string; score: number }> = Array.isArray(result?.alternates)
    ? result.alternates
    : [];
  const idIsMock = result?.isMock === true;

  const [condition, setCondition] = useState(result?.condition || 'LIKE NEW');
  const [purchaseCost, setPurchaseCost] = useState(String(analysis?.breakdown?.purchaseCost || result?.buyPrice || '50.00'));
  const [status, setStatus] = useState<'Listed' | 'Sold' | 'Pending'>(result?.status || 'Listed');

  // Realized-sale detail, captured only when the item is marked Sold. These feed
  // Iteration 6 analytics (real profit, trend, top sourcing) — before they were
  // recorded the dashboard was seeded with mockup constants. sold_at is stamped
  // server-side to now() when a price is given but no date, so it's not exposed
  // here. source_location is useful on any item, so it lives outside the Sold gate.
  const [soldPrice, setSoldPrice] = useState(
    result?.soldPrice != null ? String(result.soldPrice) : ''
  );
  const [actualFeesPaid, setActualFeesPaid] = useState(
    result?.actualFeesPaid != null ? String(result.actualFeesPaid) : ''
  );
  const [shippingCostPaid, setShippingCostPaid] = useState(
    result?.shippingCostPaid != null ? String(result.shippingCostPaid) : ''
  );
  const [sourceLocation, setSourceLocation] = useState(result?.sourceLocation || '');

  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copyData, setCopyData] = useState<any>(null);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [defaultFee, setDefaultFee] = useState(13.5);
  const [targetRoi, setTargetRoi] = useState(45.0);

  const [altPickerVisible, setAltPickerVisible] = useState(false);
  const [reidentifying, setReidentifying] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get<any>('/settings');
        if (data.defaultFee !== undefined) setDefaultFee(data.defaultFee);
        if (data.targetRoi !== undefined) setTargetRoi(data.targetRoi);
      } catch (error) {
        console.warn('Failed to fetch settings for local calculation:', error);
      }
    };
    fetchSettings();
  }, []);

  // All hooks are above this line, so the early return keeps their order stable.
  if (!result) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={[Typography.headlineMd, { color: Colors.error }]}>NO ITEM DATA</Text>
        <Text style={[Typography.bodyMd, { color: Colors.outline, marginTop: 8, textAlign: 'center' }]}>
          This screen was opened without a scan result. Head back and scan an item.
        </Text>
        <TouchableOpacity style={styles.emptyStateButton} onPress={() => navigation.goBack()}>
          <Text style={[Typography.labelBold, { color: Colors.onPrimary }]}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // The buy/pass math is calculateDeal from @flipper/shared — the exact function
  // the backend runs per scan. This screen re-runs it live as the user edits the
  // purchase cost, so the client can no longer disagree with the server the way
  // the old hand-inlined copy did (it used a 13.5% fee while the server used
  // 12.9%, and used a fixed max-buy divisor that ignored the target ROI).
  const currentAvgSold = marketData?.avgSoldPrice || result.avgSoldPrice || 240.00;
  const currentBuyCost = parseFloat(purchaseCost) || 0;
  const feePercent = defaultFee / 100; // defaultFee is fetched from backend settings above

  const deal = calculateDeal(currentAvgSold, currentBuyCost, feePercent, targetRoi);
  const currentVerdict = deal.verdict;
  const currentConfidence = deal.confidence;
  
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'BUY': return { bg: Colors.primaryContainer, text: Colors.onPrimaryContainer, glow: 'rgba(0, 230, 118, 0.2)' };
      case 'RISKY': return { bg: Colors.tertiary, text: Colors.onTertiary, glow: 'rgba(255, 186, 121, 0.2)' };
      case 'PASS': return { bg: Colors.errorContainer, text: Colors.onErrorContainer, glow: 'rgba(147, 0, 10, 0.2)' };
      default: return { bg: Colors.surfaceContainerHighest, text: Colors.onSurface, glow: 'rgba(255,255,255,0)' };
    }
  };

  const vStyle = getVerdictStyle(currentVerdict);

  // Data provenance. The backend distinguishes real sold comps from current
  // asking prices (which run systematically high) and from sample data served
  // when no API key / no results are available. Nothing used to read these, so
  // every verdict looked equally authoritative — an asking-price ceiling and a
  // fabricated Sony-headphone comp were presented identically to a real sale.
  // Only meaningful for a fresh scan; a saved Vault item carries no marketData.
  const priceBasis: 'sold' | 'asking' | 'none' | undefined = marketData?.priceBasis;
  const isMockData = marketData?.isMock === true;
  const marketNote: string | undefined = marketData?.error;
  const showProvenance = !!marketData && (isMockData || priceBasis === 'asking' || priceBasis === 'none');
  const provenanceIsError = isMockData || priceBasis === 'none';
  const provenanceTitle = isMockData
    ? '⚠ SAMPLE DATA — NOT REAL COMPS'
    : priceBasis === 'asking'
      ? '⚠ ASKING PRICES — NOT SOLD COMPS'
      : '⚠ NO COMPS FOUND';

  const handleSave = async () => {
    try {
      setSaving(true);
      // An empty text input means "not recorded" → send null so analytics can
      // tell it from a genuine $0. The server also nulls every sold field when
      // status isn't Sold, so a mistaken entry can't leave stale sale data behind.
      const toMoney = (s: string): number | null => {
        const t = s.trim();
        if (t === '') return null;
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : null;
      };
      const trimmedSource = sourceLocation.trim();

      const itemToSave: Partial<InventoryItem> = {
        id: id || undefined,
        productName: productName,
        category: category || result.category || 'General',
        imageUrl: imageUrl || marketData?.thumbnail || '',
        condition: condition,
        buyPrice: currentBuyCost,
        avgSoldPrice: currentAvgSold,
        estimatedProfit: deal.estimatedProfit,
        roi: deal.roi,
        verdict: currentVerdict,
        status: status,
        soldPrice: status === 'Sold' ? toMoney(soldPrice) : null,
        actualFeesPaid: status === 'Sold' ? toMoney(actualFeesPaid) : null,
        shippingCostPaid: status === 'Sold' ? toMoney(shippingCostPaid) : null,
        sourceLocation: trimmedSource === '' ? null : trimmedSource,
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

  // "Not this?" correction. Re-runs the backend pipeline with an explicit
  // product name via the manual-entry branch (/identify accepts `productName`),
  // so the market lookup and deal math redo against the right query. Replaces
  // this screen with the corrected result rather than stacking a second one.
  const reidentifyAs = async (name: string) => {
    const chosen = name.trim();
    if (!chosen) return;
    try {
      setAltPickerVisible(false);
      setReidentifying(true);
      const data = await api.post<any>('/identify', { productName: chosen });
      navigation.replace('Result', { result: data });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not re-identify with that name.');
    } finally {
      setReidentifying(false);
    }
  };

  const promptManualEntry = () => {
    setAltPickerVisible(false);
    // Alert.prompt is iOS-only; guard so Android doesn't silently no-op.
    const AlertAny = Alert as any;
    if (typeof AlertAny.prompt === 'function') {
      AlertAny.prompt(
        'Correct the item',
        'Enter the actual product name',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Search', onPress: (text: string) => reidentifyAs(text || '') },
        ],
        'plain-text',
        productName
      );
    } else {
      Alert.alert('Not available', 'Type-to-correct is only available on iOS for now. Pick from the suggestions instead.');
    }
  };

  const handleGenerateListing = async () => {
    try {
      setGeneratingCopy(true);
      const copy = await api.post<any>('/generate-listing', {
        productName,
        category: category || result.category || 'General',
        condition
      });
      setCopyData(copy);
      setCopyModalVisible(true);
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
            {/* The three-dot carousel indicator implied multiple photos; there
                is only ever one scan image, so it's removed. */}
          </View>
          
          <View style={styles.heroInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelBold, { color: Colors.secondary, fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }]} numberOfLines={1}>
                {(category || result.category || "General").toUpperCase()}
              </Text>
              <Text style={[Typography.headlineLg, { color: Colors.onSurface }]} numberOfLines={2}>{productName}</Text>
            </View>
            {idConfidence !== undefined && !idIsMock ? (
              <TouchableOpacity
                style={[styles.matchBadge, idConfidence < 0.5 && styles.matchBadgeLow]}
                onPress={() => setAltPickerVisible(true)}
                disabled={reidentifying}
              >
                {reidentifying ? (
                  <ActivityIndicator color={Colors.primaryContainer} size="small" />
                ) : (
                  <>
                    <Text style={[styles.matchText, idConfidence < 0.5 && { color: Colors.tertiary }]}>
                      {Math.round(idConfidence * 100)}% MATCH
                    </Text>
                    <Text style={styles.matchSub}>NOT THIS?</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Low-confidence / mock nudge — the honest counterpart to the old
              always-98% badge. A weak guess says so and invites a correction. */}
          {idIsMock ? (
            <Text style={styles.idHint}>Sample identification — add Vision credentials for real scans.</Text>
          ) : idConfidence !== undefined && idConfidence < 0.5 ? (
            <Text style={styles.idHint}>Low-confidence match. Tap the badge to pick a better name.</Text>
          ) : null}
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

        {/* Data provenance banner — real sold comps vs asking prices vs sample */}
        {showProvenance && (
          <View style={[styles.provenanceBanner, provenanceIsError ? styles.provenanceError : styles.provenanceWarn]}>
            <Text style={[Typography.labelBold, { color: Colors.onSurface, fontSize: 12, letterSpacing: 0.5 }]}>
              {provenanceTitle}
            </Text>
            {!!marketNote && (
              <Text style={styles.provenanceBody}>{marketNote}</Text>
            )}
          </View>
        )}

        {/* KPI Grid (1:1 with scan_result design mockup) */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Avg Sold</Text>
            <Text style={[Typography.headlineMd, { color: '#fff' }]}>${currentAvgSold.toFixed(0)}</Text>
          </View>
          <View style={[styles.kpiBox, { borderColor: 'rgba(176,198,255,0.2)', borderWidth: 1 }]}>
            <Text style={styles.kpiLabel}>Max Buy</Text>
            <Text style={[Typography.headlineMd, { color: Colors.secondary }]}>${(analysis?.maxBuyPrice || deal.maxBuyPrice).toFixed(0)}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: Colors.onPrimaryContainer }]}>
            <Text style={[styles.kpiLabel, { color: 'rgba(0,230,118,0.6)' }]}>Est. Profit</Text>
            <Text style={[Typography.headlineMd, { color: Colors.primaryContainer }]}>${deal.estimatedProfit.toFixed(0)}</Text>
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

        {/* Realized-sale capture — only when Sold. These are the numbers analytics
            turns into real profit, trend and top-sourcing. Leaving fees/shipping
            blank falls back to the fee estimate rather than counting as $0. */}
        {status === 'Sold' && (
          <View style={styles.soldCard}>
            <Text style={[Typography.labelBold, { color: Colors.primaryContainer, fontSize: 12, letterSpacing: 1.5, marginBottom: Spacing.sm }]}>SALE DETAILS</Text>

            <View style={styles.soldField}>
              <Text style={styles.soldLabel}>Sold Price</Text>
              <TextInput
                style={styles.soldInput}
                value={soldPrice}
                onChangeText={setSoldPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.soldRow}>
              <View style={[styles.soldField, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={styles.soldLabel}>Fees Paid</Text>
                <TextInput
                  style={styles.soldInput}
                  value={actualFeesPaid}
                  onChangeText={setActualFeesPaid}
                  keyboardType="decimal-pad"
                  placeholder="est."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              <View style={[styles.soldField, { flex: 1 }]}>
                <Text style={styles.soldLabel}>Shipping Paid</Text>
                <TextInput
                  style={styles.soldInput}
                  value={shippingCostPaid}
                  onChangeText={setShippingCostPaid}
                  keyboardType="decimal-pad"
                  placeholder="est."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>
          </View>
        )}

        {/* Source location — where the item was picked up. Useful on any item,
            not just sold, and drives the Top Sourcing ranking in analytics. */}
        <View style={styles.conditionSection}>
          <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5, marginBottom: Spacing.xs }]}>SOURCE LOCATION</Text>
          <TextInput
            style={styles.soldInput}
            value={sourceLocation}
            onChangeText={setSourceLocation}
            placeholder="e.g. Goodwill on 5th"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>

        {/* Profit Calculator Card */}
        <View style={styles.profitCard}>
          <View style={styles.profitHeader}>
             <View>
               <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1.5 }]}>ESTIMATED NET PROFIT</Text>
               <Text style={[Typography.displayProfit, { color: Colors.primaryContainer }]}>${deal.estimatedProfit.toFixed(2)}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
               <Text style={[Typography.labelBold, { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }]}>ROI</Text>
               <View style={styles.roiBadge}>
                 <Text style={{ color: Colors.primaryContainer, fontWeight: 'bold', fontSize: 14 }}>{deal.roi.toFixed(0)}%</Text>
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
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Platform Fees ({defaultFee}%)</Text>
               <Text style={[Typography.dataMono, { color: Colors.error }]}>-${deal.breakdown.fees.toFixed(2)}</Text>
             </View>
             <View style={styles.breakdownRow}>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Shipping Estimate</Text>
               <Text style={[Typography.dataMono, { color: Colors.error }]}>-${deal.breakdown.shipping.toFixed(2)}</Text>
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

        {/* Market Comps. The old "+12% / 90d" sparkline was a hardcoded decorative
            wave — no price-history series backs it — so it's gone. The comps
            below are the real sold/asking listings the market lookup returned. */}
        <View style={styles.compSection}>
           <View style={{ marginBottom: Spacing.md }}>
              <Text style={[Typography.labelBold, { color: Colors.onSurface, fontSize: 16 }]}>Market Comps</Text>
           </View>

           {(marketData?.recentComps || result.recentComps || []).length === 0 && (
             <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant, marginBottom: Spacing.md }]}>
               No comparable listings returned for this item.
             </Text>
           )}

           {(marketData?.recentComps || result.recentComps || []).map((comp: any, idx: number) => (
             <View key={idx} style={styles.compCard}>
                <View style={styles.compLeft}>
                   <View style={styles.compIconBox}>
                     <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{comp.icon === 'shopping_bag' || (comp.source || '').includes('eBay') ? '🛒' : comp.icon === 'token' || (comp.source || '').includes('StockX') ? '🟢' : '🏪'}</Text>
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

      {/* "Not this?" — ranked alternates + manual entry. Lets a wrong top guess
          be corrected without re-scanning; each choice re-runs the pipeline. */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={altPickerVisible}
        onRequestClose={() => setAltPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.headlineMd, { color: Colors.primaryContainer }]}>Not this item?</Text>
              <TouchableOpacity onPress={() => setAltPickerVisible(false)}><Text style={{ color: '#fff', fontSize: 24 }}>×</Text></TouchableOpacity>
            </View>
            <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>
              Pick a closer match to re-run comps, or type the real name.
            </Text>
            <ScrollView style={styles.modalScroll}>
              <View style={{ gap: Spacing.sm }}>
                {alternates.length > 0 ? (
                  alternates.map((alt, i) => (
                    <TouchableOpacity key={i} style={styles.altRow} onPress={() => reidentifyAs(alt.name)}>
                      <Text style={[Typography.bodyMd, { color: '#fff', flex: 1 }]} numberOfLines={1}>{alt.name}</Text>
                      <Text style={[Typography.dataMono, { color: Colors.onSurfaceVariant, fontSize: 12 }]}>
                        {Math.round(alt.score * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>
                    No other suggestions — enter the name manually.
                  </Text>
                )}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={promptManualEntry}>
              <Text style={[Typography.labelBold, { color: Colors.onPrimaryContainer }]}>ENTER NAME MANUALLY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <Text style={[Typography.headlineMd, { color: Colors.primaryContainer }]}>Listing Draft</Text>
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
                      {(copyData.suggestedTags || []).map((tag: string, i: number) => (
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
  emptyStateContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateButton: {
    marginTop: 24,
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
  matchBadgeLow: {
    borderColor: 'rgba(255, 186, 121, 0.4)',
  },
  matchText: {
    color: Colors.primaryContainer,
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  idHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
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
  provenanceBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  provenanceError: {
    backgroundColor: 'rgba(147, 0, 10, 0.15)',
    borderColor: 'rgba(255, 180, 171, 0.4)',
  },
  provenanceWarn: {
    backgroundColor: 'rgba(255, 186, 121, 0.12)',
    borderColor: 'rgba(255, 186, 121, 0.4)',
  },
  provenanceBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
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
  soldCard: {
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  soldRow: {
    flexDirection: 'row',
  },
  soldField: {
    gap: 4,
  },
  soldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  soldInput: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.onSurface,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
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
