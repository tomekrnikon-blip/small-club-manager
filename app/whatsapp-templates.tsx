import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import {
  WhatsAppTemplate,
  getWhatsAppTemplates,
  saveWhatsAppTemplates,
  fillTemplate,
} from "@/lib/whatsapp-service";

const templateTypes = [
  { value: 'training_reminder', label: 'Przypomnienie o treningu' },
  { value: 'match_reminder', label: 'Przypomnienie o meczu' },
  { value: 'callup', label: 'Powołanie' },
  { value: 'attendance', label: 'Obecność' },
  { value: 'custom', label: 'Własny' },
];

export default function WhatsAppTemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<WhatsAppTemplate['type']>('custom');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loaded = await getWhatsAppTemplates();
      setTemplates(loaded);
    } catch (error) {
      console.error('[WhatsApp] Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditContent(template.content);
    setEditType(template.type);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setEditName('');
    setEditContent('');
    setEditType('custom');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editName.trim() || !editContent.trim()) {
      Alert.alert("Błąd", "Wypełnij nazwę i treść szablonu");
      return;
    }

    // Extract variables from content
    const variableMatches = editContent.match(/\{\{(\w+)\}\}/g) || [];
    const variables = variableMatches.map(v => v.replace(/\{\{|\}\}/g, ''));

    const newTemplate: WhatsAppTemplate = {
      id: editingTemplate?.id || `custom_${Date.now()}`,
      name: editName,
      type: editType,
      language: 'pl',
      content: editContent,
      variables,
      approved: false,
    };

    let updatedTemplates: WhatsAppTemplate[];
    if (editingTemplate) {
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? newTemplate : t
      );
    } else {
      updatedTemplates = [...templates, newTemplate];
    }

    try {
      await saveWhatsAppTemplates(updatedTemplates);
      setTemplates(updatedTemplates);
      setShowModal(false);
      Alert.alert("Sukces", "Szablon został zapisany");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać szablonu");
    }
  };

  const handleDelete = (template: WhatsAppTemplate) => {
    Alert.alert(
      "Usuń szablon",
      `Czy na pewno chcesz usunąć szablon "${template.name}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            const updatedTemplates = templates.filter(t => t.id !== template.id);
            try {
              await saveWhatsAppTemplates(updatedTemplates);
              setTemplates(updatedTemplates);
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się usunąć szablonu");
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: WhatsAppTemplate['type']) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: WhatsAppTemplate['type']) => {
    switch (type) {
      case 'training_reminder': return 'fitness-center';
      case 'match_reminder': return 'sports-soccer';
      case 'callup': return 'person-add';
      case 'attendance': return 'fact-check';
      default: return 'message';
    }
  };

  // Preview with sample data
  const getPreview = (content: string) => {
    const sampleData: Record<string, string> = {
      team: 'Seniorzy',
      opponent: 'Orzeł Biały',
      date: '15.01.2025',
      time: '18:00',
      location: 'Stadion Miejski',
    };
    return fillTemplate(content, sampleData);
  };

  if (isLoading) {
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
        <ThemedText style={styles.headerTitle}>Szablony WhatsApp</ThemedText>
        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <MaterialIcons name="add" size={24} color={AppColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
          <ThemedText style={styles.infoText}>
            Użyj {"{{zmienna}}"} aby wstawić dynamiczne wartości. Dostępne zmienne: team, opponent, date, time, location
          </ThemedText>
        </View>

        {/* Templates List */}
        {templates.map((template) => (
          <View key={template.id} style={styles.templateCard}>
            <View style={styles.templateHeader}>
              <View style={styles.templateIcon}>
                <MaterialIcons 
                  name={getTypeIcon(template.type) as any} 
                  size={20} 
                  color={AppColors.primary} 
                />
              </View>
              <View style={styles.templateInfo}>
                <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                <ThemedText style={styles.templateType}>{getTypeLabel(template.type)}</ThemedText>
              </View>
              <View style={styles.templateActions}>
                <Pressable onPress={() => handleEdit(template)} style={styles.actionBtn}>
                  <MaterialIcons name="edit" size={20} color="#64748b" />
                </Pressable>
                <Pressable onPress={() => handleDelete(template)} style={styles.actionBtn}>
                  <MaterialIcons name="delete" size={20} color="#ef4444" />
                </Pressable>
              </View>
            </View>

            <View style={styles.templateContent}>
              <ThemedText style={styles.contentLabel}>Treść:</ThemedText>
              <ThemedText style={styles.contentText}>{template.content}</ThemedText>
            </View>

            <View style={styles.templatePreview}>
              <ThemedText style={styles.previewLabel}>Podgląd:</ThemedText>
              <ThemedText style={styles.previewText}>{getPreview(template.content)}</ThemedText>
            </View>

            {template.variables.length > 0 && (
              <View style={styles.variablesRow}>
                {template.variables.map((v) => (
                  <View key={v} style={styles.variableBadge}>
                    <ThemedText style={styles.variableText}>{v}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {templates.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="description" size={48} color="#64748b" />
            <ThemedText style={styles.emptyText}>Brak szablonów</ThemedText>
            <Pressable onPress={handleAdd} style={styles.emptyBtn}>
              <ThemedText style={styles.emptyBtnText}>Dodaj pierwszy szablon</ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
              </ThemedText>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Nazwa</ThemedText>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="np. Przypomnienie o treningu"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Typ</ThemedText>
                <View style={styles.typeButtons}>
                  {templateTypes.map((type) => (
                    <Pressable
                      key={type.value}
                      style={[
                        styles.typeBtn,
                        editType === type.value && styles.typeBtnActive,
                      ]}
                      onPress={() => setEditType(type.value as WhatsAppTemplate['type'])}
                    >
                      <ThemedText style={[
                        styles.typeBtnText,
                        editType === type.value && styles.typeBtnTextActive,
                      ]}>
                        {type.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Treść wiadomości</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="Wpisz treść wiadomości..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {editContent && (
                <View style={styles.previewBox}>
                  <ThemedText style={styles.previewLabel}>Podgląd:</ThemedText>
                  <ThemedText style={styles.previewText}>{getPreview(editContent)}</ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelBtn} 
                onPress={() => setShowModal(false)}
              >
                <ThemedText style={styles.cancelBtnText}>Anuluj</ThemedText>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <ThemedText style={styles.saveBtnText}>Zapisz</ThemedText>
              </Pressable>
            </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#f59e0b",
    lineHeight: 20,
  },
  templateCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  templateType: {
    fontSize: 13,
    color: "#64748b",
  },
  templateActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  templateContent: {
    marginBottom: Spacing.sm,
  },
  contentLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  templatePreview: {
    backgroundColor: "#0f172a",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  previewLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: "#22c55e",
    lineHeight: 20,
  },
  variablesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  variableBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  variableText: {
    fontSize: 12,
    color: AppColors.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptyBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  typeBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeBtnActive: {
    borderColor: AppColors.primary,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  typeBtnText: {
    fontSize: 13,
    color: "#64748b",
  },
  typeBtnTextActive: {
    color: AppColors.primary,
  },
  previewBox: {
    backgroundColor: "#0f172a",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: "#334155",
    borderRadius: Radius.md,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
