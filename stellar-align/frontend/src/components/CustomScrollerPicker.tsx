import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { colors } from '../theme/theme';

interface WheelPickerProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  width?: number;
  itemHeight?: number;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  data,
  selectedValue,
  onValueChange,
  width = 70,
  itemHeight = 44,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [isReady, setIsReady] = useState(false);
  const visibleItems = 5;
  const height = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  const extendedData = useMemo(() => [
    ...Array(paddingItems).fill(''), 
    ...data, 
    ...Array(paddingItems).fill('')
  ], [data, paddingItems]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (index >= 0 && index < data.length) {
      if (data[index] !== selectedValue) {
        onValueChange(data[index]);
      }
    }
  };

  const handleLayout = () => {
    const index = data.indexOf(selectedValue);
    if (index !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: index * itemHeight,
          animated: false,
        });
        setIsReady(true);
      }, 50);
    } else {
      setIsReady(true);
    }
  };

  return (
    <View style={[styles.wheelContainer, { width, height }]} pointerEvents="box-none">
      <View 
        style={[styles.selectionOverlay, { height: itemHeight, top: (height - itemHeight) / 2 }]} 
        pointerEvents="none" 
      />
      <FlatList
        ref={flatListRef}
        data={extendedData}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const actualIndex = index - paddingItems;
          const isSelected = data[actualIndex] === selectedValue;
          return (
            <View style={[styles.item, { height: itemHeight }]} pointerEvents="none">
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {item}
              </Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onMomentumScrollEnd}
        onLayout={handleLayout}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        scrollEnabled={true}
      />
    </View>
  );
};

interface CustomScrollerPickerProps {
  mode: 'date' | 'time';
  value: Date;
  onSave: (date: Date) => void;
  onClose: () => void;
  title: string;
}

export const CustomScrollerPicker: React.FC<CustomScrollerPickerProps> = ({
  mode,
  value,
  onSave,
  onClose,
  title,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), []);
  
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 130 }, (_, i) => (currentYear - i).toString()), [currentYear]);
  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = useMemo(() => {
    const count = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    return Array.from({ length: count }, (_, i) => (i + 1).toString());
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const newDate = new Date(selectedDate);
    if (type === 'hour') newDate.setHours(parseInt(val));
    else newDate.setMinutes(parseInt(val));
    setSelectedDate(newDate);
  };

  const handleDateChange = (type: 'year' | 'month' | 'day', val: string) => {
    const newDate = new Date(selectedDate);
    if (type === 'year') {
      newDate.setFullYear(parseInt(val));
      const maxDays = getDaysInMonth(newDate.getFullYear(), newDate.getMonth());
      if (newDate.getDate() > maxDays) newDate.setDate(maxDays);
    }
    else if (type === 'month') {
      const monthIdx = months.indexOf(val);
      const maxDays = getDaysInMonth(newDate.getFullYear(), monthIdx);
      if (newDate.getDate() > maxDays) newDate.setDate(maxDays);
      newDate.setMonth(monthIdx);
    }
    else if (type === 'day') newDate.setDate(parseInt(val));
    
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={() => {
            onSave(selectedDate);
            onClose();
          }}>
            <Text style={styles.modalDone}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.pickersContainer}>
          {mode === 'time' ? (
            <View style={styles.timePickers}>
              <WheelPicker
                data={hours}
                selectedValue={selectedDate.getHours().toString().padStart(2, '0')}
                onValueChange={(v) => handleTimeChange('hour', v)}
              />
              <Text style={styles.separator}>:</Text>
              <WheelPicker
                data={minutes}
                selectedValue={selectedDate.getMinutes().toString().padStart(2, '0')}
                onValueChange={(v) => handleTimeChange('minute', v)}
              />
            </View>
          ) : (
            <View style={styles.datePickers}>
              <WheelPicker
                data={months}
                selectedValue={months[selectedDate.getMonth()]}
                onValueChange={(v) => handleDateChange('month', v)}
                width={120}
              />
              <WheelPicker
                key={`days-${days.length}`}
                data={days}
                selectedValue={selectedDate.getDate().toString()}
                onValueChange={(v) => handleDateChange('day', v)}
                width={50}
              />
              <WheelPicker
                data={years}
                selectedValue={years.includes(selectedDate.getFullYear().toString()) ? selectedDate.getFullYear().toString() : years[0]}
                onValueChange={(v) => handleDateChange('year', v)}
                width={80}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 3000,
  },
  modalContent: {
    backgroundColor: colors.stellarSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  modalTitle: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 20,
    color: colors.stellarFg,
  },
  modalDone: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: colors.stellarViolet,
  },
  pickersContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  separator: {
    fontSize: 24,
    color: colors.white,
    marginHorizontal: 10,
    fontFamily: 'InstrumentSerif-Regular',
  },
  wheelContainer: {
    overflow: 'hidden',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.stellarBorder,
    backgroundColor: 'rgba(157, 141, 241, 0.1)',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: colors.stellarMuted,
  },
  itemTextSelected: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'InstrumentSerif-Regular',
  },
});
