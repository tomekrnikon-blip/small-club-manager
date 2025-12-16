import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const FAQ_ITEMS = [
  {
    question: 'Jak dodać nowy klub?',
    answer: 'Przejdź do ekranu głównego i kliknij przycisk "Utwórz klub". Wypełnij nazwę klubu i opcjonalne informacje, a następnie zatwierdź.',
  },
  {
    question: 'Jak zaprosić członków do klubu?',
    answer: 'Przejdź do Więcej > Struktura klubu > Zaproś. Wprowadź adres email osoby i wybierz jej rolę (Trener, Zawodnik, Członek zarządu).',
  },
  {
    question: 'Jak zarządzać powołaniami na mecz?',
    answer: 'Otwórz szczegóły meczu i kliknij "Zarządzaj powołaniami". Wybierz zawodników z listy i wyślij powołania. Zawodnicy otrzymają powiadomienia 48h i 24h przed meczem.',
  },
  {
    question: 'Jak śledzić finanse klubu?',
    answer: 'Przejdź do Więcej > Finanse. Możesz dodawać przychody i wydatki, przypisywać kategorie i śledzić bilans klubu.',
  },
  {
    question: 'Czym różni się konto PRO?',
    answer: 'Konto PRO oferuje nielimitowaną liczbę zawodników, zaawansowane statystyki, raporty PDF, integrację SMS i priorytetowe wsparcie.',
  },
  {
    question: 'Jak zgłosić kontuzję zawodnika?',
    answer: 'Przejdź do Więcej > Kontuzje > Dodaj. Wybierz zawodnika, rodzaj kontuzji i przewidywany czas powrotu.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleContact = (type: 'email' | 'website') => {
    if (type === 'email') {
      Linking.openURL('mailto:support@smallclubmanager.app');
    } else {
      Linking.openURL('https://smallclubmanager.app');
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Pomoc</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.actionCard} onPress={() => handleContact('email')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="mail" size={24} color="#3b82f6" />
            </View>
            <ThemedText style={styles.actionTitle}>Email</ThemedText>
            <ThemedText style={styles.actionSubtitle}>Napisz do nas</ThemedText>
          </Pressable>
          
          <Pressable style={styles.actionCard} onPress={() => handleContact('website')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="globe" size={24} color="#22c55e" />
            </View>
            <ThemedText style={styles.actionTitle}>Strona WWW</ThemedText>
            <ThemedText style={styles.actionSubtitle}>Odwiedź nas</ThemedText>
          </Pressable>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <ThemedText style={styles.sectionTitle}>Często zadawane pytania</ThemedText>
          
          {FAQ_ITEMS.map((item, index) => (
            <Pressable
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <ThemedText style={styles.faqQuestion}>{item.question}</ThemedText>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
              {expandedFaq === index && (
                <ThemedText style={styles.faqAnswer}>{item.answer}</ThemedText>
              )}
            </Pressable>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <ThemedText style={styles.sectionTitle}>O aplikacji</ThemedText>
          <View style={styles.appInfoCard}>
            <View style={styles.appLogo}>
              <Ionicons name="football" size={40} color="#22c55e" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.appName}>
              Small Club Manager
            </ThemedText>
            <ThemedText style={styles.appVersion}>Wersja 1.0.0</ThemedText>
            <ThemedText style={styles.appDescription}>
              Kompleksowe narzędzie do zarządzania małymi klubami sportowymi.
              Zarządzaj drużynami, zawodnikami, meczami, treningami i finansami w jednym miejscu.
            </ThemedText>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <Pressable style={styles.legalLink}>
            <ThemedText style={styles.legalText}>Regulamin</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
          <Pressable style={styles.legalLink}>
            <ThemedText style={styles.legalText}>Polityka prywatności</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
          <Pressable style={styles.legalLink}>
            <ThemedText style={styles.legalText}>Licencje open source</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  faqSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  faqItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    lineHeight: 22,
  },
  appInfoSection: {
    marginBottom: 24,
  },
  appInfoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    color: '#fff',
  },
  appVersion: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  legalSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  legalText: {
    fontSize: 15,
    color: '#94a3b8',
  },
});
