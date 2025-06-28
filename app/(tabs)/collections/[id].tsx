import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { Collection, Link } from '@/types';
import { LinkCard } from '@/components/LinkCard';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeft, Link as LinkIcon, Plus, Pencil, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';

export default function CollectionDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCollectionData = async () => {
    try {
      const [savedCollections, savedLinks] = await Promise.all([
        StorageService.getCollections(),
        StorageService.getLinks()
      ]);
      
      const foundCollection = savedCollections.find(c => c.id === id);
      if (!foundCollection) {
        // Navigate back to collections list instead of home
        router.replace('/(tabs)/collections');
        return;
      }
      
      const collectionLinks = savedLinks.filter(link => link.collectionId === id);
      
      // Sort links by reminder priority
      const sortedLinks = sortLinksByReminder(collectionLinks);
      
      setCollection(foundCollection);
      setLinks(sortedLinks);
    } catch (error) {
      console.error('Error loading collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort links by reminder priority
  const sortLinksByReminder = (linksToSort: Link[]): Link[] => {
    return [...linksToSort].sort((a, b) => {
      const aHasReminder = !!a.reminder;
      const bHasReminder = !!b.reminder;
      
      // If both have reminders, sort by reminder date (earliest first)
      if (aHasReminder && bHasReminder) {
        const aReminderTime = new Date(a.reminder!).getTime();
        const bReminderTime = new Date(b.reminder!).getTime();
        return aReminderTime - bReminderTime;
      }
      
      // If only one has a reminder, prioritize the one with reminder
      if (aHasReminder && !bHasReminder) return -1;
      if (!aHasReminder && bHasReminder) return 1;
      
      // If neither has reminders, sort by creation date (newest first)
      const aCreatedTime = new Date(a.createdAt).getTime();
      const bCreatedTime = new Date(b.createdAt).getTime();
      return bCreatedTime - aCreatedTime;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollectionData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadCollectionData();
    }, [id])
  );

  const handleToggleComplete = async (linkId: string) => {
    try {
      const link = links.find(l => l.id === linkId);
      if (link) {
        await StorageService.updateLink(linkId, { isCompleted: !link.isCompleted });
        await loadCollectionData();
      }
    } catch (error) {
      console.error('Error toggling link completion:', error);
    }
  };

  const handleEditLink = (link: Link) => {
    router.push({
      pathname: '/(tabs)/add',
      params: { editLinkId: link.id }
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await StorageService.deleteLink(linkId);
      await loadCollectionData();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleEditCollection = () => {
    if (collection) {
      router.push({
        pathname: '/(tabs)/collections/edit',
        params: { collectionId: collection.id }
      });
    }
  };

  const handleAddLink = () => {
    router.push('/(tabs)/add');
  };

  const handleBackPress = () => {
    // Navigate back to collections list instead of home
    router.back();
  };

  // Get reminder statistics for this collection
  const getReminderStats = () => {
    const now = new Date();
    const activeLinksWithReminders = links.filter(link => 
      !link.isCompleted && link.reminder
    );
    
    const overdueCount = activeLinksWithReminders.filter(link => 
      new Date(link.reminder!).getTime() < now.getTime()
    ).length;
    
    const upcomingCount = activeLinksWithReminders.filter(link => 
      new Date(link.reminder!).getTime() >= now.getTime()
    ).length;
    
    return { overdueCount, upcomingCount, totalWithReminders: activeLinksWithReminders.length };
  };

  if (loading) {
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

  const reminderStats = getReminderStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
              <View style={[styles.collectionIconInner, { backgroundColor: collection.color }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {collection.name}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {links.length} {links.length === 1 ? 'link' : 'links'}
                {reminderStats.totalWithReminders > 0 && (
                  <Text style={[styles.reminderCount, { color: colors.primary }]}>
                    {' '}• {reminderStats.totalWithReminders} with reminders
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditCollection}
        >
          <Pencil size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Collection Description */}
      {collection.description && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {collection.description}
          </Text>
        </View>
      )}

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {links.filter(l => !l.isCompleted).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {links.filter(l => l.isCompleted).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {links.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
        </View>
      </View>

      {/* Reminder Summary (only show if there are reminders) */}
      {reminderStats.totalWithReminders > 0 && (
        <View style={[styles.reminderSummary, { 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }]}>
          <View style={styles.reminderSummaryContent}>
            <Clock size={16} color={colors.primary} /><Text style={[styles.reminderSummaryText, { color: colors.text }]}>
              {reminderStats.overdueCount > 0 && (
                <Text style={{ color: colors.error }}>
                  {reminderStats.overdueCount} overdue
                </Text>
              )}
              {reminderStats.overdueCount > 0 && reminderStats.upcomingCount > 0 && (
                <Text style={{ color: colors.textMuted }}> • </Text>
              )}
              {reminderStats.upcomingCount > 0 && (
                <Text style={{ color: colors.primary }}>
                  {reminderStats.upcomingCount} upcoming
                </Text>
              )}
            </Text>
          </View>
          <Text style={[styles.reminderNote, { color: colors.textMuted }]}>
            Links with reminders appear first
          </Text>
        </View>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <EmptyState
          icon={<LinkIcon size={32} color={colors.textMuted} />}
          title="No links in this collection"
          subtitle="Add some links to this collection to see them here"
          action={
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddLink}
            >
              <Plus size={16} color={colors.card} />
              <Text style={[styles.addButtonText, { color: colors.card }]}>
                Add Link
              </Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LinkCard
              link={item}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
              showCollection={false}
              hideDelete={true} // Hide delete button in collection view
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddLink}
      >
        <Plus size={24} color={colors.card} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionIconInner: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  reminderCount: {
    fontFamily: 'Inter-SemiBold',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
  },
  reminderSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderSummaryText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  reminderNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 24,
  },
  listContent: {
    paddingBottom: 100,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});