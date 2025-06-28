import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { Collection, Link } from '@/types';
import { CollectionCard } from '@/components/CollectionCard';
import { EmptyState } from '@/components/EmptyState';
import { FolderOpen, Plus, Check, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

export default function CollectionsScreen() {
  const colors = useThemeColors();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [savedCollections, savedLinks] = await Promise.all([
        StorageService.getCollections(),
        StorageService.getLinks()
      ]);
      
      // Update link counts for collections
      const collectionsWithCounts = savedCollections.map(collection => ({
        ...collection,
        linkCount: savedLinks.filter(link => link.collectionId === collection.id).length
      }));
      
      setCollections(collectionsWithCounts);
      setLinks(savedLinks);
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

  useEffect(() => {
    let filtered = collections;
    
    switch (filter) {
      case 'active':
        filtered = collections.filter(collection => !collection.isCompleted);
        break;
      case 'completed':
        filtered = collections.filter(collection => collection.isCompleted);
        break;
      default:
        filtered = collections;
    }
    
    setFilteredCollections(filtered);
  }, [collections, filter]);

  const handleCollectionPress = (collection: Collection) => {
    router.push({
      pathname: '/(tabs)/collections/[id]',
      params: { id: collection.id }
    });
  };

  const handleToggleComplete = async (collectionId: string) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
        await StorageService.updateCollection(collectionId, { 
          isCompleted: !collection.isCompleted 
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling collection completion:', error);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    router.push({
      pathname: '/(tabs)/collections/edit',
      params: { collectionId: collection.id }
    });
  };

  const handleCreateCollection = () => {
    router.push('/(tabs)/collections/create');
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
          title: 'No active collections',
          subtitle: 'Collections you mark as done will move to completed',
        };
      case 'completed':
        return {
          title: 'No completed collections',
          subtitle: 'Complete some collections to see them here',
        };
      default:
        return {
          title: 'No collections yet',
          subtitle: 'Create collections to organize your links by topic, project, or any way you like',
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading collections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const emptyStateContent = getEmptyStateContent();
  const activeCount = collections.filter(c => !c.isCompleted).length;
  const completedCount = collections.filter(c => c.isCompleted).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Collections</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {(collections?.length ?? 0)} total • {(activeCount ?? 0)} active • {(completedCount ?? 0)} completed
          </Text>

        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateCollection}
        >
          <Plus size={20} color={colors.card} />
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
          icon={<FolderOpen size={16} color={filter === 'all' ? colors.card : colors.text} />}
        />
      </View>

      {/* Collections List */}
      {filteredCollections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={32} color={colors.textMuted} />}
          title={emptyStateContent.title}
          subtitle={emptyStateContent.subtitle}
          action={
            filter === 'all' ? (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateCollection}
              >
                <Plus size={16} color={colors.card} />
                <Text style={[styles.createButtonText, { color: colors.card }]}>
                  Create Collection
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={filteredCollections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionCard
              collection={item}
              onPress={handleCollectionPress}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditCollection}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});