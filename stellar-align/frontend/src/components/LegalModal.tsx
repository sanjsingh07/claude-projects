import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@theme/theme';
import { StellarText } from './StellarCard';
import { StellarBackground } from './StellarBackground';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

interface LegalSection {
  title: string;
  content: string;
  list?: string[];
}

interface LegalContent {
  sections: LegalSection[];
}

export const LegalModal: React.FC<LegalModalProps> = ({ visible, onClose, type }) => {
  const content = type === 'privacy' ? privacyPolicy : termsOfService;
  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <StellarBackground />
        <View style={styles.header}>
          <StellarText variant="heading3" serif italic style={styles.title}>
            {title}
          </StellarText>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.stellarFg} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <StellarText variant="caption" color={colors.stellarMuted} style={styles.lastUpdated}>
            Last Updated: May 18, 2026
          </StellarText>

          {content.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <StellarText variant="heading4" serif italic style={styles.sectionTitle}>
                {section.title}
              </StellarText>
              <StellarText variant="body" color={colors.stellarMuted} style={styles.sectionText}>
                {section.content}
              </StellarText>
              {section.list && (
                <View style={styles.list}>
                  {section.list.map((item, i) => (
                    <View key={i} style={styles.listItem}>
                      <View style={styles.bullet} />
                      <StellarText variant="body" color={colors.stellarMuted} style={styles.listItemText}>
                        {item}
                      </StellarText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          <View style={styles.footer}>
            <StellarText style={styles.footerLogo}>✧</StellarText>
            <StellarText variant="heading4" serif italic style={styles.footerName}>
              Stellar Align
            </StellarText>
            <StellarText variant="caption" color={colors.stellarMuted} align="center">
              Precision Astrology for the Modern Age
            </StellarText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const privacyPolicy: LegalContent = {
  sections: [
    {
      title: '1. Information We Collect',
      content: 'To provide personalized astrology insights, we collect your:',
      list: [
        'Birth date, time, and location (to calculate your natal chart)',
        'Email address (for account creation and notifications)',
        'Device information and usage data'
      ]
    },
    {
      title: '2. How We Use Your Data',
      content: 'Your birth data is used exclusively to generate your natal chart and daily horoscopes using high-precision astronomical calculations and our AI models. We do not sell your personal data to third parties.'
    },
    {
      title: '3. AI Processing',
      content: 'Your astrological data is processed by advanced AI models to provide personalized readings. This data is anonymized before being sent to AI providers and is not used to train their models.'
    },
    {
      title: '4. Security',
      content: 'We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.'
    },
    {
      title: '5. Contact Us',
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@stellaralign.com.'
    }
  ]
};

const termsOfService: LegalContent = {
  sections: [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using Stellar Align, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.'
    },
    {
      title: '2. Description of Service',
      content: 'Stellar Align provides personalized astrology content, natal chart analysis, and compatibility reports generated through astronomical calculations and AI interpretation.'
    },
    {
      title: '3. Not Professional Advice',
      content: 'The content provided by Stellar Align is for entertainment and informational purposes only. It is not intended to be a substitute for professional medical, legal, financial, or psychological advice.'
    },
    {
      title: '4. User Accounts',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'
    },
    {
      title: '5. Intellectual Property',
      content: 'All content, logos, and software used in Stellar Align are the property of Stellar Align or its licensors and are protected by intellectual property laws.'
    },
    {
      title: '6. Limitation of Liability',
      content: 'Stellar Align shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.'
    }
  ]
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  title: {
    fontSize: 24,
    color: colors.stellarFg,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.stellarSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  lastUpdated: {
    marginBottom: 32,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.stellarFg,
    marginBottom: 12,
  },
  sectionText: {
    lineHeight: 24,
    opacity: 0.9,
  },
  list: {
    marginTop: 12,
    paddingLeft: 8,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.stellarViolet,
    marginTop: 8,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    marginTop: 40,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 32,
    color: colors.stellarViolet,
    marginBottom: 8,
  },
  footerName: {
    fontSize: 20,
    color: colors.stellarFg,
    marginBottom: 4,
  },
});
