import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Collection } from '@/types';
import { useThemeColors } from '@/hooks/useColorScheme';
import { Folder, Check, Pencil } from 'lucide-react-native';

interface CollectionCardProps {
  collection: Collection;
  onPress: (collection: Collection) => void;
  onToggleComplete: (collectionId: string) => void;
  onEdit: (collection: Collection) => void;
}

export function CollectionCard({ collection, onPress, onToggleComplete, onEdit }: CollectionCardProps) {
  const colors = useThemeColors();

  // Ensure linkCount is always a number
  const linkCount = typeof collection.linkCount === 'number' ? collection.linkCount : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { 
        backgroundColor: colors.card,
        borderColor: colors.border,
        opacity: collection.isCompleted ? 0.6 : 1
      }]}
      onPress={() => onPress(collection)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: collection.color + '20' }]}>
            <Folder size={20} color={collection.color} />
          </View>
          <View style={styles.titleContainer}>
            <Text 
              style={[styles.title, { 
                color: colors.text,
                textDecorationLine: collection.isCompleted ? 'line-through' : 'none'
              }]}
              numberOfLines={1}
            >
              {collection.name}
            </Text>
            <Text style={[styles.linkCount, { color: colors.textMuted }]}>
              {String(linkCount)} {linkCount === 1 ? 'link' : 'links'}
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: collection.isCompleted ? colors.success : colors.surface 
            }]}
            onPress={() => onToggleComplete(collection.id)}
          >
            <Check size={16} color={collection.isCompleted ? colors.card : colors.success} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(collection)}
          >
            <Pencil size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {collection.description && (
        <Text 
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {collection.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  linkCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginLeft: 52,
  },
});