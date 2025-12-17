import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ threadId?: string; receiverId?: string; receiverName?: string; playerId?: string }>();
  
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // If we have a threadId, show the conversation
  // Otherwise show the threads list
  const isConversation = !!params.threadId || !!params.receiverId;

  const { data: threads, isLoading: loadingThreads, refetch: refetchThreads } = trpc.messages.getThreads.useQuery(
    undefined,
    { enabled: !isConversation }
  );

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = trpc.messages.getThread.useQuery(
    { threadId: params.threadId || '' },
    { enabled: !!params.threadId }
  );

  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery();

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !club) return;

    const receiverId = params.receiverId ? parseInt(params.receiverId) : 
      (messages && messages.length > 0 ? 
        (messages[0].senderId === user?.id ? messages[0].receiverId : messages[0].senderId) : 
        null);

    if (!receiverId) return;

    sendMessage.mutate({
      clubId: club.id,
      receiverId,
      playerId: params.playerId ? parseInt(params.playerId) : undefined,
      content: messageText.trim(),
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Dzisiaj';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Wczoraj';
    }
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  };

  // Threads list view
  if (!isConversation) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Wiadomości</ThemedText>
          {unreadCount && unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {loadingThreads ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : threads && threads.length > 0 ? (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.threadId}
            contentContainerStyle={styles.threadsList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.threadCard}
                onPress={() => router.push({
                  pathname: '/messages',
                  params: { threadId: item.threadId },
                } as any)}
              >
                <View style={styles.threadAvatar}>
                  <MaterialIcons name="person" size={24} color={AppColors.primary} />
                </View>
                <View style={styles.threadInfo}>
                  <View style={styles.threadHeader}>
                    <ThemedText style={styles.threadName} numberOfLines={1}>
                      {item.otherUser?.name || 'Użytkownik'}
                    </ThemedText>
                    <ThemedText style={styles.threadTime}>
                      {formatDate(item.createdAt)}
                    </ThemedText>
                  </View>
                  {item.player && (
                    <ThemedText style={styles.threadPlayer}>
                      dot. {item.player.name}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.threadPreview} numberOfLines={1}>
                    {item.senderId === user?.id ? 'Ty: ' : ''}{item.content}
                  </ThemedText>
                </View>
                {!item.isRead && item.receiverId === user?.id && (
                  <View style={styles.unreadDot} />
                )}
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="#64748b" />
            <ThemedText style={styles.emptyText}>Brak wiadomości</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Rozpocznij rozmowę z trenerem lub rodzicem z panelu rodzica
            </ThemedText>
          </View>
        )}
      </ThemedView>
    );
  }

  // Conversation view
  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {params.receiverName || (messages && messages.length > 0 ? 
            (messages[0].senderId === user?.id ? messages[0].sender?.name : messages[0].sender?.name) : 
            'Rozmowa')}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.conversationContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loadingMessages ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages || []}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.id;
              return (
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                  <ThemedText style={[styles.messageText, isMe && styles.messageTextMe]}>
                    {item.content}
                  </ThemedText>
                  <ThemedText style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                    {formatTime(item.createdAt)}
                  </ThemedText>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyConversation}>
                <ThemedText style={styles.emptyConversationText}>
                  Rozpocznij rozmowę wysyłając wiadomość
                </ThemedText>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Napisz wiadomość..."
            placeholderTextColor="#64748b"
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  centered: {
    flex: 1,
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
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginHorizontal: Spacing.md,
  },
  unreadBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  threadsList: {
    padding: Spacing.lg,
  },
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  threadInfo: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  threadTime: {
    fontSize: 12,
    color: "#64748b",
  },
  threadPlayer: {
    fontSize: 12,
    color: AppColors.primary,
    marginTop: 2,
  },
  threadPreview: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#475569",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  conversationContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  messageBubbleMe: {
    backgroundColor: AppColors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "#1e293b",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageTimeMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  emptyConversation: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyConversationText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#334155",
  },
});
