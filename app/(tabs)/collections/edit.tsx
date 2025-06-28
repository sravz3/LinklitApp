import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Save, Palette, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function EditCollectionScreen() {
  const colors = useThemeColors();
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(Colors.light.collections.blue);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const collectionColors = Object.values(Colors.light.collections);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      const collections = await StorageService.getCollections();
      const foundCollection = collections.find(c => c.id === collectionId);
      
      if (!foundCollection) {
        Alert.alert('Error', 'Collection not found', [
          { text: 'OK', onPress: () => navigateToCollections() }
        ]);
        return;
      }

      setCollection(foundCollection);
      setName(foundCollection.name);
      setDescription(foundCollection.description || '');
      setSelectedColor(foundCollection.color);
    } catch (error) {
      console.error('Error loading collection:', error);
      Alert.alert('Error', 'Failed to load collection data');
    } finally {
      setInitialLoading(false);
    }
  };

  const navigateToCollections = () => {
    // Navigate back to collections list
    router.replace('/(tabs)/collections');
  };

  const handleSaveCollection = async () => {
    if (!collection) return;

    if (!name.trim()) {
      const message = 'Please enter a collection name';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    setLoading(true);

    try {
      const updatedCollection: Partial<Collection> = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        updatedAt: new Date(),
      };

      await StorageService.updateCollection(collection.id, updatedCollection);
      
      // Navigate back immediately after successful save
      navigateToCollections();
      
      // Show success message after navigation
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Collection updated successfully!');
        } else {
          Alert.alert('Success', 'Collection updated successfully!');
        }
      }, 100);
    } catch (error) {
      console.error('Error updating collection:', error);
      const message = 'Failed to update collection. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = () => {
    if (!collection) {
      console.log('No collection found for deletion');
      return;
    }

    console.log('Delete button pressed for collection:', collection.name);
    
    const performDelete = async () => {
      console.log('Performing delete for collection:', collection.id);
      setLoading(true);
      
      try {
        // First, get all links and update those that belong to this collection
        const links = await StorageService.getLinks();
        const linksToUpdate = links.filter(link => link.collectionId === collection.id);
        
        console.log(`Found ${linksToUpdate.length} links to update`);
        
        // Update each link to remove the collection reference
        for (const link of linksToUpdate) {
          await StorageService.updateLink(link.id, { 
            collectionId: undefined,
            updatedAt: new Date()
          });
        }

        // Then delete the collection
        await StorageService.deleteCollection(collection.id);
        
        console.log('Collection deleted successfully');
        
        // Navigate back immediately after successful delete
        navigateToCollections();
        
        // Show success message after navigation
        setTimeout(() => {
          if (Platform.OS === 'web') {
            alert('Collection deleted successfully!');
          } else {
            Alert.alert('Success', 'Collection deleted successfully!');
          }
        }, 100);
      } catch (error) {
        console.error('Error deleting collection:', error);
        const message = 'Failed to delete collection. Please try again.';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Error', message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Platform-specific confirmation dialogs
    if (Platform.OS === 'web') {
      const confirmed = confirm(
        `Are you sure you want to delete "${collection.name}"?\n\nThis will delete the collection but keep all links. Links will become uncategorized.\n\nThis action cannot be undone.`
      );
      
      if (confirmed) {
        performDelete();
      }
    } else {
      // Use setTimeout to ensure the Alert shows up properly on mobile
      setTimeout(() => {
        Alert.alert(
          'Delete Collection',
          `Are you sure you want to delete "${collection.name}"?\n\nThis will delete the collection but keep all links. Links will become uncategorized.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => console.log('Delete cancelled')
            },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: performDelete
            }
          ],
          { cancelable: true }
        );
      }, 50);
    }
  };

  const handleBackPress = () => {
    // Navigate back to collections list
    router.back();
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading collection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Collection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Collection</Text>
          <TouchableOpacity
            style={[styles.deleteButton, {
              opacity: loading ? 0.5 : 1
            }]}
            onPress={handleDeleteCollection}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color={loading ? colors.textMuted : colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Collection Stats */}
          <View style={styles.section}>
            <View style={[styles.statsCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {collection.linkCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  {collection.linkCount === 1 ? 'Link' : 'Links'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {collection.isCompleted ? 'Complete' : 'Active'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Status
                </Text>
              </View>
            </View>
          </View>

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
              editable={!loading}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {name.length}/50 characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
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
              editable={!loading}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {description.length}/200 characters
            </Text>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <Palette size={16} color={colors.textMuted} />
              <Text style={[styles.labelText, { color: colors.text }]}>Collection Color</Text>
            </View>
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
                  disabled={loading}
                  activeOpacity={0.7}
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
                    {collection.linkCount} {collection.linkCount === 1 ? 'link' : 'links'}
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
            activeOpacity={0.7}
          >
            <Save size={16} color={colors.card} />
            <Text style={[styles.saveButtonText, { color: colors.card }]}>
              {loading ? 'Saving...' : 'Save Changes'}
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
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  statDivider: {
    width: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});