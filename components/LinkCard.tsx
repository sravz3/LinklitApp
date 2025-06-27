import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Link, Collection } from '@/types';
import { useThemeColors } from '@/hooks/useColorScheme';
import { ExternalLink, Clock, Check, Pencil, Trash2, Folder, RotateCcw } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

interface LinkCardProps {
  link: Link;
  onToggleComplete: (linkId: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (linkId: string) => void;
  showCollection?: boolean;
  collection?: Collection;
}

export function LinkCard({ 
  link, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  showCollection = true,
  collection 
}: LinkCardProps) {
  const colors = useThemeColors();

  const handleOpenLink = async () => {
    try {
      await WebBrowser.openBrowserAsync(link.url);
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleEditPress = () => {
    // Navigate to add screen with edit mode - use push to maintain navigation stack
    router.push({
      pathname: '/(tabs)/add',
      params: { editLinkId: link.id }
    });
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(link.id)
        }
      ]
    );
  };

  const formatReminderDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    const timeStr = date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    // If the reminder is in the past, show it differently
    if (diffMs < 0) {
      const pastDays = Math.abs(diffDays);
      if (pastDays === 0) {
        return `Overdue (was today at ${timeStr})`;
      } else if (pastDays === 1) {
        return `Overdue (was yesterday at ${timeStr})`;
      } else {
        return `Overdue (was ${date.toLocaleDateString()} at ${timeStr})`;
      }
    }
    
    // Future reminders
    if (diffMinutes < 60) {
      if (diffMinutes <= 1) {
        return `Reminder in 1 minute`;
      }
      return `Reminder in ${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      if (diffHours === 1) {
        return `Reminder in 1 hour`;
      }
      return `Reminder in ${diffHours} hours`;
    } else if (diffDays === 0) {
      return `Today at ${timeStr}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeStr}`;
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      return `${dayName} at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} at ${timeStr}`;
    }
  };

  const getReminderStyle = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Overdue - red color
      return {
        color: colors.error,
        backgroundColor: colors.error + '15',
        borderColor: colors.error + '30'
      };
    } else if (diffMs < 60 * 60 * 1000) {
      // Less than 1 hour - urgent orange
      return {
        color: colors.warning,
        backgroundColor: colors.warning + '15',
        borderColor: colors.warning + '30'
      };
    } else {
      // Normal reminder - primary blue
      return {
        color: colors.primary,
        backgroundColor: colors.primaryMuted,
        borderColor: colors.primary + '30'
      };
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.card,
      borderColor: colors.border,
      opacity: link.isCompleted ? 0.6 : 1
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {link.favicon && (
            <Image source={{ uri: link.favicon }} style={styles.favicon} />
          )}
          <Text 
            style={[styles.title, { 
              color: colors.text,
              textDecorationLine: link.isCompleted ? 'line-through' : 'none'
            }]}
            numberOfLines={2}
          >
            {link.title}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditPress}
          >
            <Pencil size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeletePress}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      {link.description && (
        <Text 
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {link.description}
        </Text>
      )}

      {/* Metadata Container - Ensures vertical stacking */}
      <View style={styles.metadataContainer}>
        {/* Collection Badge */}
        {showCollection && collection && (
          <View style={styles.collectionBadge}>
            <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
              <Folder size={12} color={collection.color} />
            </View>
            <Text style={[styles.collectionName, { color: colors.textMuted }]}>
              {collection.name}
            </Text>
          </View>
        )}

        {/* Reminder Badge - Always below collection */}
        {link.reminder && (
          <View style={[
            styles.reminderBadge,
            getReminderStyle(new Date(link.reminder))
          ]}>
            <Clock size={12} color={getReminderStyle(new Date(link.reminder)).color} />
            <Text style={[
              styles.reminderText,
              { color: getReminderStyle(new Date(link.reminder)).color }
            ]}>
              {formatReminderDateTime(new Date(link.reminder))}
            </Text>
          </View>
        )}
      </View>

      {/* Footer - Actions Only */}
      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primaryMuted }]}
            onPress={handleOpenLink}
          >
            <ExternalLink size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Open
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryActionButton, { 
              backgroundColor: link.isCompleted ? colors.surface : colors.success + '20'
            }]}
            onPress={() => onToggleComplete(link.id)}
          >
            {link.isCompleted ? (
              <>
                <RotateCcw size={16} color={colors.textMuted} />
                <Text style={[styles.actionText, { color: colors.textMuted }]}>
                  Undo
                </Text>
              </>
            ) : (
              <>
                <Check size={16} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>
                  Mark Done
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  favicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 28,
  },
  metadataContainer: {
    marginLeft: 28,
    marginBottom: 12,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  collectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  collectionName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reminderText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
});