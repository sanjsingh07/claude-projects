import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Image } from 'react-native';
import { getItems, deleteItem, InventoryItem } from '../database/db';
import { useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

const InventoryScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Items');
  const isFocused = useIsFocused();

  const filters = ['All Items', 'Listed', 'Sold', 'Pending', 'Electronics', 'Collectibles', 'Apparel'];

  useEffect(() => {
    if (isFocused) {
      loadItems();
    }
  }, [isFocused]);

  const loadItems = async () => {
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Purge Record",
      "Confirm deletion of this data point.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteItem(id);
            loadItems();
          } 
        }
      ]
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All Items' || 
                          item.status === activeFilter || 
                          item.category?.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Sold': return { bg: 'rgba(0,230,118,0.2)', text: Colors.primaryContainer, border: 'rgba(0,230,118,0.3)' };
      case 'Listed': return { bg: 'rgba(0,104,237,0.2)', text: Colors.secondary, border: 'rgba(0,104,237,0.3)' };
      case 'Pending': return { bg: 'rgba(255,186,121,0.2)', text: Colors.tertiary, border: 'rgba(255,186,121,0.3)' };
      default: return { bg: Colors.glass, text: Colors.onSurface, border: Colors.glassStroke };
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const sStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => navigation.navigate('ScanTab', { screen: 'Result', params: { result: item, isSavedItem: true } })}
      >
        <View style={styles.itemMain}>
          <View style={styles.itemImageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImage, { backgroundColor: '#222' }]} />
            )}
          </View>
          
          <View style={styles.itemDetails}>
            <Text style={[Typography.bodyMd, { color: '#fff', fontWeight: 'bold' }]} numberOfLines={1}>{item.productName}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Added: {new Date(item.createdAt).toLocaleDateString()} • {item.category || 'General'}</Text>
          </View>
        </View>

        <View style={styles.itemMetrics}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabelMobile}>Buy Price</Text>
            <Text style={[Typography.dataMono, { color: '#fff' }]}>${item.buyPrice?.toFixed(2) || '0.00'}</Text>
          </View>
          
          <View style={[styles.metricColumn, { alignItems: 'center' }]}>
            <View style={[styles.statusBadge, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}>
               <Text style={[Typography.labelBold, { color: sStyle.text, fontSize: 10 }]}>{item.status}</Text>
            </View>
          </View>
          
          <View style={[styles.metricColumn, { alignItems: 'flex-end' }]}>
            <Text style={styles.metricLabelMobile}>Total Profit</Text>
            <Text style={[Typography.headlineMd, { color: Colors.primaryContainer, textShadowColor: 'rgba(0, 230, 118, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
               {item.estimatedProfit >= 0 ? '+' : '-'}${Math.abs(item.estimatedProfit).toFixed(2)}
            </Text>
            <Text style={[Typography.labelBold, { color: Colors.primaryContainer, fontSize: 12, marginTop: 2 }]}>{item.roi?.toFixed(1) || '0.0'}% ROI</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.menuIcon, { color: Colors.primaryContainer }]}>☰</Text>
          <Text style={[styles.logoText, Typography.headlineMd, { color: Colors.primaryContainer }]}>AI FLIPPER</Text>
        </View>
        <View style={styles.profilePicContainer}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6HeP0YBwIf3qIHKQ7wLhbTW1JlEdNaOvb3aqGq8UVoLEfbfC9BnW3_TpB_swQggMiC6YBKvqXRr9iyxzSAMMyHa9v0X1TZUgHEUbvBTryiW5FSSi1sIc5MYtq8lm4O6z5hJxljAckxaGMClNdzbikuxxlgiJRrCaUwegqAC3vIbYFH9RcCIgiLpPrgIYz9k_hjKSU_pYxHltZFXW28FTawdCOfM52IG1VR6rfKJus-Qve_4CM0eAQW6pgS0nyNQrYwhcUlleZqjlq' }} style={styles.profilePic} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginRight: Spacing.sm }}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {filters.map((filter, index) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity 
                  key={index}
                  style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[Typography.labelBold, { color: isActive ? Colors.onPrimaryContainer : 'rgba(255,255,255,0.6)' }]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[Typography.headlineMd, { color: Colors.surfaceContainerHighest }]}>DATABASE EMPTY</Text>
            <Text style={[Typography.bodyMd, { color: Colors.outline, marginTop: 8 }]}>No items match your criteria.</Text>
          </View>
        }
      />
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
  profilePic: {
    width: '100%',
    height: '100%',
  },
  searchSection: {
    paddingTop: 100 + Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    marginHorizontal: Spacing.containerMargin,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  filtersContainer: {
    height: 40,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primaryContainer,
  },
  filterPillInactive: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  listContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: 120,
  },
  itemCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: Colors.white05,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  },
  metricColumn: {
    flex: 1,
  },
  metricLabelMobile: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});

export default InventoryScreen;
