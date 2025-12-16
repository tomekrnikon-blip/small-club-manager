import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Notification preferences
  const [matchReminders, setMatchReminders] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [callupNotifications, setCallupNotifications] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [newsUpdates, setNewsUpdates] = useState(false);
  
  // Channels
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  
  // SMS API Key
  const [twilioApiKey, setTwilioApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleSaveApiKey = () => {
    if (twilioApiKey.trim()) {
      Alert.alert('Sukces', 'Klucz API Twilio został zapisany. Powiadomienia SMS są teraz aktywne.');
      setSmsEnabled(true);
      setShowApiKeyInput(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Powiadomienia</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Types */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Rodzaje powiadomień</ThemedText>
          
          <View style={styles.settingCard}>
            <SettingRow
              icon="football"
              title="Przypomnienia o meczach"
              subtitle="48h i 24h przed meczem"
              value={matchReminders}
              onValueChange={setMatchReminders}
            />
            <SettingRow
              icon="fitness"
              title="Przypomnienia o treningach"
              subtitle="24h przed treningiem"
              value={trainingReminders}
              onValueChange={setTrainingReminders}
            />
            <SettingRow
              icon="people"
              title="Powołania"
              subtitle="Powiadomienia o powołaniach na mecz"
              value={callupNotifications}
              onValueChange={setCallupNotifications}
            />
            <SettingRow
              icon="cash"
              title="Przypomnienia o płatnościach"
              subtitle="Dla rodziców w szkółce"
              value={paymentReminders}
              onValueChange={setPaymentReminders}
            />
            <SettingRow
              icon="newspaper"
              title="Aktualności klubu"
              subtitle="Ogłoszenia i nowości"
              value={newsUpdates}
              onValueChange={setNewsUpdates}
              isLast
            />
          </View>
        </View>

        {/* Channels */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kanały powiadomień</ThemedText>
          
          <View style={styles.settingCard}>
            <SettingRow
              icon="mail"
              title="Email"
              subtitle="Powiadomienia na adres email"
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
            <SettingRow
              icon="notifications"
              title="Push"
              subtitle="Powiadomienia w aplikacji"
              value={pushEnabled}
              onValueChange={setPushEnabled}
            />
            <SettingRow
              icon="chatbubble"
              title="SMS"
              subtitle={smsEnabled ? 'Aktywne' : 'Wymaga klucza API Twilio'}
              value={smsEnabled}
              onValueChange={(value) => {
                if (value && !twilioApiKey) {
                  setShowApiKeyInput(true);
                } else {
                  setSmsEnabled(value);
                }
              }}
              isLast
            />
          </View>
        </View>

        {/* SMS API Configuration */}
        {showApiKeyInput && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Konfiguracja SMS (Twilio)</ThemedText>
            
            <View style={styles.apiKeyCard}>
              <ThemedText style={styles.apiKeyInfo}>
                Aby włączyć powiadomienia SMS, wprowadź swój klucz API Twilio. 
                Koszty SMS będą naliczane na Twoje konto Twilio.
              </ThemedText>
              
              <TextInput
                style={styles.apiKeyInput}
                value={twilioApiKey}
                onChangeText={setTwilioApiKey}
                placeholder="Twilio API Key"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
              
              <View style={styles.apiKeyButtons}>
                <Pressable 
                  style={styles.cancelButton}
                  onPress={() => setShowApiKeyInput(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.saveButton, !twilioApiKey.trim() && styles.saveButtonDisabled]}
                  onPress={handleSaveApiKey}
                  disabled={!twilioApiKey.trim()}
                >
                  <ThemedText style={styles.saveButtonText}>Zapisz</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Możesz wybrać preferowany kanał wysyłania powiadomień podczas tworzenia każdego powiadomienia.
          </ThemedText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color="#22c55e" />
      </View>
      <View style={styles.settingInfo}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#22c55e' }}
        thumbColor="#fff"
      />
    </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    color: '#fff',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  apiKeyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  apiKeyInfo: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 16,
  },
  apiKeyInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  apiKeyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
