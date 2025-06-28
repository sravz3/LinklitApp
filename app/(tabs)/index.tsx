import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { Link, Collection } from '@/types';
import { LinkCard } from '@/components/LinkCard';
import { EmptyState } from '@/components/EmptyState';
import { WelcomeCard } from '@/components/WelcomeCard';
import { Link as LinkIcon, Filter, Check, Clock, X, Zap, ExternalLink } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const colors = useThemeColors();
  const [links, setLinks] = useState<Link[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const loadData = async () => {
    try {
      const [savedLinks, savedCollections, welcomeDismissed] = await Promise.all([
        StorageService.getLinks(),
        StorageService.getCollections(),
        StorageService.isWelcomeDismissed()
      ]);
      setLinks(savedLinks);
      setCollections(savedCollections);
      
      // Only show welcome card if it hasn't been permanently dismissed
      if (!welcomeDismissed) {
        const hasDefaultCollection = savedCollections.some(c => c.id === 'default-bolt-hackathon');
        const hasCustomLinks = savedLinks.some(l => !l.id?.startsWith('default-link-'));
        setShowWelcome(hasDefaultCollection && !hasCustomLinks);
      } else {
        // If welcome was dismissed, never show it again
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  useEffect(() => {
    let filtered = links;
    
    switch (filter) {
      case 'active':
        filtered = links.filter(link => !link.isCompleted);
        break;
      case 'completed':
        filtered = links.filter(link => link.isCompleted);
        break;
      default:
        filtered = links;
    }
    
    // Apply reminder-based sorting
    const sortedFiltered = sortLinksByReminder(filtered);
    setFilteredLinks(sortedFiltered);
  }, [links, filter]);

  const handleToggleComplete = async (linkId: string) => {
    try {
      const link = links.find(l => l.id === linkId);
      if (link) {
        await StorageService.updateLink(linkId, { isCompleted: !link.isCompleted });
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling link completion:', error);
    }
  };

  const handleEditLink = (link: Link) => {
    // This function is called from LinkCard, which handles navigation
    console.log('Edit link:', link.id);
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await StorageService.deleteLink(linkId);
      await loadData();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleWelcomeDismiss = async () => {
    try {
      await StorageService.setWelcomeDismissed();
      setShowWelcome(false);
    } catch (error) {
      console.error('Error dismissing welcome card:', error);
      // Still hide the welcome card even if storage fails
      setShowWelcome(false);
    }
  };

  const handleBoltBadgePress = async () => {
    try {
      await Linking.openURL('https://bolt.new/');
    } catch (error) {
      console.error('Error opening Bolt.new:', error);
    }
  };

  const getCollectionForLink = (link: Link): Collection | undefined => {
    return collections.find(c => c.id === link.collectionId);
  };

  const FilterButton = ({ filterType, title, icon }: { 
    filterType: typeof filter, 
    title: string,
    icon: React.ReactNode 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === filterType ? colors.primary : colors.surface,
          borderColor: filter === filterType ? colors.primary : colors.border,
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      {icon}
      <Text style={[
        styles.filterText,
        { color: filter === filterType ? colors.card : colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const getEmptyStateContent = () => {
    switch (filter) {
      case 'active':
        return {
          title: 'No active links',
          subtitle: 'Links you mark as done will move to completed',
        };
      case 'completed':
        return {
          title: 'No completed links',
          subtitle: 'Complete some links to see them here',
        };
      default:
        return {
          title: 'No links saved yet',
          subtitle: 'Save your first link to get started',
        };
    }
  };

  // Get reminder statistics for display
  const getReminderStats = () => {
    const now = new Date();
    const activeLinksWithReminders = filteredLinks.filter(link => 
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
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your links...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const emptyStateContent = getEmptyStateContent();
  const activeCount = links.filter(l => !l.isCompleted).length;
  const completedCount = links.filter(l => l.isCompleted).length;
  const reminderStats = getReminderStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Your Links</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {links.length} total • {activeCount} active • {completedCount} completed
            {reminderStats.totalWithReminders > 0 && (
              <Text style={[styles.reminderStats, { color: colors.primary }]}>
                {' '}• {reminderStats.totalWithReminders} with reminders
              </Text>
            )}
          </Text>
        </View>
        
        {/* Bolt.new Badge */}
        <TouchableOpacity
          style={[styles.boltBadge, { 
            backgroundColor: colors.primary + '10',
            borderColor: colors.primary + '30'
          }]}
          onPress={handleBoltBadgePress}
          activeOpacity={0.7}
        >
          <View style={[styles.boltIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Zap size={12} color={colors.primary} />
          </View>
          <Text style={[styles.boltBadgeText, { color: colors.primary }]}>
            Built on Bolt.new
          </Text>
          <ExternalLink size={10} color={colors.primary} style={styles.boltExternalIcon} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterButton 
          filterType="active" 
          title="Active" 
          icon={<Clock size={16} color={filter === 'active' ? colors.card : colors.text} />}
        />
        <FilterButton 
          filterType="completed" 
          title="Completed" 
          icon={<Check size={16} color={filter === 'completed' ? colors.card : colors.text} />}
        />
        <FilterButton 
          filterType="all" 
          title="All" 
          icon={<LinkIcon size={16} color={filter === 'all' ? colors.card : colors.text} />}
        />
      </View>

      {/* Reminder Summary (only show for active filter with reminders) */}
      {filter === 'active' && reminderStats.totalWithReminders > 0 && (
        <View style={[styles.reminderSummary, { 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }]}>
          <View style={styles.reminderSummaryContent}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.reminderSummaryText, { color: colors.text }]}>
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

      {/* Welcome Card */}
      {showWelcome && (
        <WelcomeCard onDismiss={handleWelcomeDismiss} />
      )}

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <EmptyState
          icon={<LinkIcon size={32} color={colors.textMuted} />}
          title={emptyStateContent.title}
          subtitle={emptyStateContent.subtitle}
        />
      ) : (
        <FlatList
          data={filteredLinks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LinkCard
              link={item}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
              showCollection={true}
              collection={getCollectionForLink(item)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  reminderStats: {
    fontFamily: 'Inter-SemiBold',
  },
  boltBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  boltIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  boltBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
  boltExternalIcon: {
    opacity: 0.7,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
});