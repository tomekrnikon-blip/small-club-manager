import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/use-auth';

export default function ClubSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Get first club
  const { data: clubs, isLoading } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];
  
  // Check if user is club owner
  const isOwner = club?.userId === user?.id;
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Twilio configuration
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState<'none' | 'twilio' | 'smsapi'>('none');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [smsapiToken, setSmsapiToken] = useState('');
  const [smsSenderName, setSmsSenderName] = useState('');
  const [isSavingSms, setIsSavingSms] = useState(false);

  const utils = trpc.useUtils();
  
  // Initialize form values when club data loads
  useEffect(() => {
    if (club) {
      setName(club.name || '');
      setLocation(club.location || '');
      setCity(club.city || '');
      setDescription(club.description || '');
      setSmsEnabled(club.smsEnabled || false);
      setSmsProvider((club.smsProvider as any) || 'none');
      setSmsSenderName(club.smsSenderName || '');
      // Note: API keys are not returned for security - only show if they exist
    }
  }, [club]);
  
  const updateClub = trpc.clubs.update.useMutation({
    onSuccess: () => {
      utils.clubs.list.invalidate();
      setIsEditing(false);
      Alert.alert('Sukces', 'Ustawienia klubu zostały zapisane');
    },
    onError: (error: any) => {
      Alert.alert('Błąd', error.message);
    },
  });

  const updateSmsConfig = trpc.clubs.updateSmsConfig.useMutation({
    onSuccess: () => {
      utils.clubs.list.invalidate();
      setIsSavingSms(false);
      Alert.alert('Sukces', 'Konfiguracja SMS została zapisana');
    },
    onError: (error: any) => {
      setIsSavingSms(false);
      Alert.alert('Błąd', error.message);
    },
  });

  const handleSave = () => {
    if (!club) return;
    updateClub.mutate({
      id: club.id,
      name: name.trim(),
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const handleSaveSmsConfig = () => {
    if (!club) return;
    
    if (smsEnabled && smsProvider === 'none') {
      Alert.alert('Błąd', 'Wybierz dostawcę SMS');
      return;
    }
    
    if (smsEnabled && smsProvider === 'twilio') {
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        Alert.alert('Błąd', 'Wypełnij wszystkie pola konfiguracji Twilio');
        return;
      }
    }
    
    if (smsEnabled && smsProvider === 'smsapi') {
      if (!smsapiToken || !smsSenderName) {
        Alert.alert('Błąd', 'Wypełnij wszystkie pola konfiguracji SMSAPI');
        return;
      }
    }
    
    setIsSavingSms(true);
    updateSmsConfig.mutate({
      clubId: club.id,
      smsEnabled,
      smsProvider,
      twilioAccountSid: smsProvider === 'twilio' ? twilioAccountSid : undefined,
      twilioAuthToken: smsProvider === 'twilio' ? twilioAuthToken : undefined,
      twilioPhoneNumber: smsProvider === 'twilio' ? twilioPhoneNumber : undefined,
      smsapiToken: smsProvider === 'smsapi' ? smsapiToken : undefined,
      smsSenderName,
    });
  };

  const testSmsConnection = () => {
    Alert.alert(
      'Test SMS',
      'Funkcja testowania połączenia SMS zostanie uruchomiona. Czy chcesz wysłać testowy SMS?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Wyślij test', 
          onPress: () => {
            // TODO: Implement SMS test
            Alert.alert('Info', 'Funkcja testowania SMS będzie dostępna wkrótce');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#22c55e" />
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="business-outline" size={64} color="#64748b" />
        <ThemedText style={styles.emptyText}>Nie znaleziono klubu</ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Ustawienia klubu</ThemedText>
        <Pressable 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)} 
          style={styles.editButton}
        >
          {updateClub.isPending ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <ThemedText style={styles.editButtonText}>
              {isEditing ? 'Zapisz' : 'Edytuj'}
            </ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Club Logo */}
        <View style={styles.logoSection}>
          <View style={styles.clubLogo}>
            <Ionicons name="football" size={48} color="#22c55e" />
          </View>
          {isEditing && (
            <Pressable style={styles.changeLogoButton}>
              <Ionicons name="camera" size={16} color="#22c55e" />
              <ThemedText style={styles.changeLogoText}>Zmień logo</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje podstawowe</ThemedText>
          
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Nazwa klubu *</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nazwa klubu"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.name}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Miasto</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Miasto"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.city || 'Nie podano'}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Adres / Obiekt sportowy</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Adres lub nazwa obiektu"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.location || 'Nie podano'}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Opis klubu</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Krótki opis klubu..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.description || 'Brak opisu'}</ThemedText>
            )}
          </View>
        </View>

        {/* SMS Configuration - Only for club owner */}
        {isOwner && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Konfiguracja SMS</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Skonfiguruj wysyłanie SMS do zawodników (powołania, przypomnienia)
            </ThemedText>
            
            {/* SMS Enable Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <ThemedText style={styles.toggleLabel}>Włącz SMS</ThemedText>
                <ThemedText style={styles.toggleHint}>
                  Powiadomienia będą wysyłane przez SMS
                </ThemedText>
              </View>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: '#334155', true: 'rgba(34, 197, 94, 0.3)' }}
                thumbColor={smsEnabled ? '#22c55e' : '#64748b'}
              />
            </View>

            {smsEnabled && (
              <>
                {/* Provider Selection */}
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Dostawca SMS</ThemedText>
                  <View style={styles.providerOptions}>
                    <Pressable
                      style={[styles.providerOption, smsProvider === 'twilio' && styles.providerOptionActive]}
                      onPress={() => setSmsProvider('twilio')}
                    >
                      <ThemedText style={[styles.providerText, smsProvider === 'twilio' && styles.providerTextActive]}>
                        Twilio
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.providerOption, smsProvider === 'smsapi' && styles.providerOptionActive]}
                      onPress={() => setSmsProvider('smsapi')}
                    >
                      <ThemedText style={[styles.providerText, smsProvider === 'smsapi' && styles.providerTextActive]}>
                        SMSAPI.pl
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Twilio Configuration */}
                {smsProvider === 'twilio' && (
                  <>
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>Account SID</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={twilioAccountSid}
                        onChangeText={setTwilioAccountSid}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        placeholderTextColor="#64748b"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>Auth Token</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={twilioAuthToken}
                        onChangeText={setTwilioAuthToken}
                        placeholder="Twój Auth Token"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>Numer telefonu Twilio</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={twilioPhoneNumber}
                        onChangeText={setTwilioPhoneNumber}
                        placeholder="+48123456789"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                )}

                {/* SMSAPI Configuration */}
                {smsProvider === 'smsapi' && (
                  <>
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>Token API</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={smsapiToken}
                        onChangeText={setSmsapiToken}
                        placeholder="Twój token SMSAPI"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>Nazwa nadawcy</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={smsSenderName}
                        onChangeText={setSmsSenderName}
                        placeholder="MojKlub (max 11 znaków)"
                        placeholderTextColor="#64748b"
                        maxLength={11}
                      />
                    </View>
                  </>
                )}

                {/* Sender Name for Twilio */}
                {smsProvider === 'twilio' && (
                  <View style={styles.fieldGroup}>
                    <ThemedText style={styles.fieldLabel}>Nazwa nadawcy (opcjonalnie)</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={smsSenderName}
                      onChangeText={setSmsSenderName}
                      placeholder="Nazwa wyświetlana odbiorcy"
                      placeholderTextColor="#64748b"
                      maxLength={11}
                    />
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.smsActions}>
                  <Pressable
                    style={[styles.smsButton, styles.testButton]}
                    onPress={testSmsConnection}
                  >
                    <Ionicons name="flask" size={18} color="#3b82f6" />
                    <ThemedText style={styles.testButtonText}>Testuj połączenie</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.smsButton, styles.saveButton, isSavingSms && styles.buttonDisabled]}
                    onPress={handleSaveSmsConfig}
                    disabled={isSavingSms}
                  >
                    {isSavingSms ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="save" size={18} color="#fff" />
                        <ThemedText style={styles.saveButtonText}>Zapisz konfigurację</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Help Link */}
                <Pressable 
                  style={styles.helpLink}
                  onPress={() => router.push('/help' as any)}
                >
                  <Ionicons name="help-circle" size={16} color="#22c55e" />
                  <ThemedText style={styles.helpLinkText}>
                    Jak skonfigurować Twilio/SMSAPI?
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Club Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Statystyki klubu</ThemedText>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#3b82f6" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Zawodników</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="football" size={24} color="#22c55e" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Meczów</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="fitness" size={24} color="#f59e0b" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Treningów</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="school" size={24} color="#ec4899" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>W szkółce</ThemedText>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        {isOwner && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Strefa niebezpieczna</ThemedText>
            
            <Pressable style={styles.dangerButton}>
              <Ionicons name="trash" size={20} color="#ef4444" />
              <ThemedText style={styles.dangerButtonText}>Usuń klub</ThemedText>
            </Pressable>
            <ThemedText style={styles.dangerHint}>
              Usunięcie klubu jest nieodwracalne. Wszystkie dane zostaną trwale usunięte.
            </ThemedText>
          </View>
        )}

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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 28,
    color: '#fff',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#22c55e',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  clubLogo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  changeLogoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#22c55e',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 16,
  },
  fieldGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
    padding: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    marginTop: 2,
  },
  providerOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  providerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerOptionActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  providerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    fontWeight: '500',
  },
  providerTextActive: {
    color: '#22c55e',
  },
  smsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  smsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  testButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  testButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3b82f6',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  saveButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  helpLinkText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#22c55e',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#ef4444',
  },
  dangerHint: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#94a3b8',
    marginTop: 16,
  },
  backButtonLarge: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
});
