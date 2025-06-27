import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { Collection } from '@/types';
import { Colors } from '@/constants/colors';
import { ArrowLeft, Save, Palette } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CreateCollectionScreen() {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(Colors.light.collections.blue);
  const [loading, setLoading] = useState(false);

  const collectionColors = Object.values(Colors.light.collections);

  const handleSaveCollection = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    setLoading(true);

    try {
      const newCollection: Collection = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkCount: 0,
      };

      await StorageService.addCollection(newCollection);
      
      Alert.alert('Success', 'Collection created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Failed to create collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Collection</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Collection Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Collection Name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="e.g., Work Resources, Recipes, DIY Projects"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {name.length}/50 characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Add a description to help you remember what this collection is for..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {description.length}/200 characters
            </Text>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              <Palette size={16} color={colors.textMuted} /> Collection Color
            </Text>
            <View style={styles.colorGrid}>
              {collectionColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <View style={[styles.colorCheck, { backgroundColor: colors.card }]}>
                      <Text style={[styles.checkMark, { color: color }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Preview</Text>
            <View style={[styles.previewCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                  <View style={[styles.previewIconInner, { backgroundColor: selectedColor }]} />
                </View>
                <View style={styles.previewContent}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    {name || 'Collection Name'}
                  </Text>
                  <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>
                    0 links
                  </Text>
                </View>
              </View>
              {description && (
                <Text style={[styles.previewDescription, { color: colors.textSecondary }]}>
                  {description}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.saveContainer, { 
          backgroundColor: colors.background, 
          borderTopColor: colors.border 
        }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: name.trim() && !loading ? colors.primary : colors.border,
              }
            ]}
            onPress={handleSaveCollection}
            disabled={!name.trim() || loading}
          >
            <Save size={16} color={colors.card} />
            <Text style={[styles.saveButtonText, { color: colors.card }]}>
              {loading ? 'Creating...' : 'Create Collection'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedColor: {
    transform: [{ scale: 1.1 }],
  },
  colorCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewIconInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginLeft: 52,
  },
  saveContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});