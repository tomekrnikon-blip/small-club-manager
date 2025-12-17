import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type TabType = 'schedule' | 'attendance' | 'payments' | 'messages';

export default function ParentPanelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Get children linked to this parent
  const { data: children, isLoading: loadingChildren, refetch } = trpc.parentChildren.getMyChildren.useQuery();
  
  // Get clubs for context
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Get upcoming events for children
  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const { data: trainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get all players for linking
  const { data: allPlayers } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id && showLinkModal }
  );

  const linkChild = trpc.parentChildren.linkChild.useMutation({
    onSuccess: () => {
      refetch();
      setShowLinkModal(false);
      Alert.alert('Sukces', 'Dziecko zostało dodane. Oczekuje na weryfikację przez trenera.');
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message);
    },
  });

  const unlinkChild = trpc.parentChildren.unlink.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Sukces', 'Powiązanie zostało usunięte');
    },
  });

  // Filter upcoming events for children
  const upcomingEvents = useMemo(() => {
    if (!children || children.length === 0 || !matches || !trainings) return [];
    
    const childPlayerIds = children.map((c: any) => c.playerId);
    const now = new Date();
    const events: any[] = [];

    // Add matches
    matches.forEach((m: any) => {
      const date = new Date(m.matchDate);
      if (date >= now) {
        events.push({
          type: 'match',
          id: m.id,
          title: `Mecz vs ${m.opponent}`,
          date,
          location: m.location,
          time: m.matchTime,
        });
      }
    });

    // Add trainings
    trainings.forEach((t: any) => {
      const date = new Date(t.trainingDate);
      if (date >= now) {
        events.push({
          type: 'training',
          id: t.id,
          title: 'Trening',
          date,
          location: t.location,
          time: t.startTime,
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  }, [children, matches, trainings]);

  // Mock attendance data
  const attendanceData = useMemo(() => {
    if (!children || children.length === 0) return [];
    
    return children.map((child: any) => ({
      childId: child.playerId,
      childName: child.player?.name || 'Zawodnik',
      trainingAttendance: 85,
      matchAttendance: 92,
      lastTraining: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastMatch: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }));
  }, [children]);

  // Mock payment data
  const paymentData = useMemo(() => {
    if (!children || children.length === 0) return [];
    
    return children.map((child: any) => ({
      childId: child.playerId,
      childName: child.player?.name || 'Zawodnik',
      monthlyFee: 200,
      paid: true,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lastPayment: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    }));
  }, [children]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleLinkChild = (playerId: number) => {
    linkChild.mutate({ playerId });
  };

  const handleUnlinkChild = (id: number, name: string) => {
    Alert.alert(
      'Usuń powiązanie',
      `Czy na pewno chcesz usunąć powiązanie z ${name}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => unlinkChild.mutate({ id }) },
      ]
    );
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'schedule', label: 'Harmonogram', icon: 'event' },
    { key: 'attendance', label: 'Obecności', icon: 'how-to-reg' },
    { key: 'payments', label: 'Płatności', icon: 'payments' },
    { key: 'messages', label: 'Wiadomości', icon: 'chat' },
  ];

  if (loadingChildren) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Panel Rodzica</ThemedText>
        <Pressable onPress={() => setShowLinkModal(true)} style={styles.addBtn}>
          <MaterialIcons name="person-add" size={24} color={AppColors.primary} />
        </Pressable>
      </View>

      {/* Children Cards */}
      {children && children.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.childrenScroll}
          contentContainerStyle={styles.childrenContent}
        >
          {children.map((child: any) => (
            <Pressable
              key={child.id}
              style={styles.childCard}
              onLongPress={() => handleUnlinkChild(child.id, child.player?.name)}
            >
              <View style={styles.childAvatar}>
                <MaterialIcons name="person" size={24} color={AppColors.primary} />
              </View>
              <ThemedText style={styles.childName} numberOfLines={1}>
                {child.player?.name || 'Zawodnik'}
              </ThemedText>
              {!child.isVerified && (
                <View style={styles.pendingBadge}>
                  <ThemedText style={styles.pendingText}>Oczekuje</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noChildrenBox}>
          <MaterialIcons name="family-restroom" size={48} color="#64748b" />
          <ThemedText style={styles.noChildrenText}>
            Nie masz jeszcze powiązanych dzieci
          </ThemedText>
          <Pressable style={styles.linkBtn} onPress={() => setShowLinkModal(true)}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <ThemedText style={styles.linkBtnText}>Dodaj dziecko</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.key ? AppColors.primary : '#64748b'} 
            />
            <ThemedText style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'schedule' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Nadchodzące wydarzenia</ThemedText>
            {upcomingEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="event-busy" size={48} color="#64748b" />
                <ThemedText style={styles.emptyText}>Brak nadchodzących wydarzeń</ThemedText>
              </View>
            ) : (
              upcomingEvents.map((event, index) => (
                <View key={`${event.type}-${event.id}`} style={styles.eventCard}>
                  <View style={[
                    styles.eventIcon,
                    { backgroundColor: event.type === 'match' ? '#a855f7' : '#f59e0b' }
                  ]}>
                    <MaterialIcons 
                      name={event.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                    <ThemedText style={styles.eventMeta}>
                      {formatDate(event.date)} • {event.time || '—'} • {event.location || 'Brak lokalizacji'}
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Frekwencja dzieci</ThemedText>
            {attendanceData.map((data: any) => (
              <View key={data.childId} style={styles.attendanceCard}>
                <ThemedText style={styles.attendanceChildName}>{data.childName}</ThemedText>
                <View style={styles.attendanceStats}>
                  <View style={styles.attendanceStat}>
                    <ThemedText style={styles.attendanceValue}>{data.trainingAttendance}%</ThemedText>
                    <ThemedText style={styles.attendanceLabel}>Treningi</ThemedText>
                  </View>
                  <View style={styles.attendanceStat}>
                    <ThemedText style={styles.attendanceValue}>{data.matchAttendance}%</ThemedText>
                    <ThemedText style={styles.attendanceLabel}>Mecze</ThemedText>
                  </View>
                </View>
                <View style={styles.lastEvents}>
                  <ThemedText style={styles.lastEventText}>
                    Ostatni trening: {formatDate(data.lastTraining)}
                  </ThemedText>
                  <ThemedText style={styles.lastEventText}>
                    Ostatni mecz: {formatDate(data.lastMatch)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'payments' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Status płatności</ThemedText>
            {paymentData.map((data: any) => (
              <View key={data.childId} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <ThemedText style={styles.paymentChildName}>{data.childName}</ThemedText>
                  <View style={[
                    styles.paymentStatus,
                    { backgroundColor: data.paid ? '#22c55e' : '#ef4444' }
                  ]}>
                    <ThemedText style={styles.paymentStatusText}>
                      {data.paid ? 'Opłacone' : 'Do zapłaty'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentRow}>
                    <ThemedText style={styles.paymentLabel}>Składka miesięczna:</ThemedText>
                    <ThemedText style={styles.paymentAmount}>{data.monthlyFee} PLN</ThemedText>
                  </View>
                  <View style={styles.paymentRow}>
                    <ThemedText style={styles.paymentLabel}>Termin płatności:</ThemedText>
                    <ThemedText style={styles.paymentDate}>{formatDate(data.dueDate)}</ThemedText>
                  </View>
                  <View style={styles.paymentRow}>
                    <ThemedText style={styles.paymentLabel}>Ostatnia płatność:</ThemedText>
                    <ThemedText style={styles.paymentDate}>{formatDate(data.lastPayment)}</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'messages' && (
          <View>
            <ThemedText style={styles.sectionTitle}>Wiadomości od trenera</ThemedText>
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak nowych wiadomości</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Tutaj pojawią się wiadomości od trenera dotyczące Twojego dziecka
              </ThemedText>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Link Child Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Dodaj dziecko</ThemedText>
              <Pressable onPress={() => setShowLinkModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <ThemedText style={styles.modalDesc}>
              Wybierz zawodnika, który jest Twoim dzieckiem. Po wybraniu, trener będzie musiał zweryfikować powiązanie.
            </ThemedText>

            <FlatList
              data={allPlayers?.filter((p: any) => 
                !children?.some((c: any) => c.playerId === p.id)
              )}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.playerOption}
                  onPress={() => handleLinkChild(item.id)}
                >
                  <View style={styles.playerAvatar}>
                    <MaterialIcons name="person" size={20} color="#64748b" />
                  </View>
                  <View style={styles.playerInfo}>
                    <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                    <ThemedText style={styles.playerPosition}>{item.position}</ThemedText>
                  </View>
                  <MaterialIcons name="add-circle" size={24} color={AppColors.primary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyText}>Brak dostępnych zawodników</ThemedText>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  addBtn: {
    padding: Spacing.xs,
  },
  childrenScroll: {
    maxHeight: 120,
  },
  childrenContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  childCard: {
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: 100,
    marginRight: Spacing.sm,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  childName: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  noChildrenBox: {
    alignItems: "center",
    padding: Spacing.xl,
    margin: Spacing.lg,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
  },
  noChildrenText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  linkBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  tabLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  tabLabelActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#475569",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  eventMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  attendanceCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  attendanceChildName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  attendanceStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  attendanceStat: {
    alignItems: "center",
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  attendanceLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  lastEvents: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: Spacing.sm,
  },
  lastEventText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  paymentCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  paymentChildName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  paymentStatus: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  paymentDetails: {
    gap: Spacing.xs,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  paymentDate: {
    fontSize: 13,
    color: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalDesc: {
    fontSize: 13,
    color: "#94a3b8",
    padding: Spacing.lg,
    paddingTop: 0,
  },
  playerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 12,
    color: "#64748b",
  },
});
