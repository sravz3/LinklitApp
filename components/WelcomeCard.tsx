import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useColorScheme';
import { Zap, ArrowRight, FolderOpen, X } from 'lucide-react-native';
import { router } from 'expo-router';

interface WelcomeCardProps {
  onDismiss?: () => void;
}

export function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  const colors = useThemeColors();

  const handleViewCollection = () => {
    router.push({
      pathname: '/(tabs)/collections/[id]',
      params: { id: 'default-bolt-hackathon' }
    });
    onDismiss?.();
  };

  const handleAddLink = () => {
    router.push('/(tabs)/add');
    onDismiss?.();
  };

  const handleClose = () => {
    onDismiss?.();
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary + '30'
    }]}>
      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: colors.surface }]}
        onPress={handleClose}
      >
        <X size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Zap size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Linklit!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've created a sample collection to get you started
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
            <FolderOpen size={16} color={colors.primary} />
          </View>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            Check out the "Bolt Hackathon" collection with helpful links
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleViewCollection}
        >
          <Text style={[styles.primaryButtonText, { color: colors.card }]}>
            View Collection
          </Text>
          <ArrowRight size={16} color={colors.card} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryButton, { 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }]}
          onPress={handleAddLink}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Add Your First Link
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 32, // Add padding to avoid overlap with close button
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  content: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});