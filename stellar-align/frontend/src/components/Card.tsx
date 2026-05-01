import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  gradient?: boolean;
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  gradient = false,
  colors = ['#6C5CE7', '#A29BFE'] as [string, string, ...string[]],
  style,
  noPadding = false,
}) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradient, style]}
      >
        <View style={[styles.content, noPadding && styles.noPadding]}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, styles.plain, style]}>
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  plain: {
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
