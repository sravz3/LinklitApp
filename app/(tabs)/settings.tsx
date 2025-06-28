import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { NotificationService } from '@/utils/notifications';
import { Bell, Trash2, Download, Upload, Info, Star, Moon, Sun, ChevronRight, FileText, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const [linkCount, setLinkCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [links, collections] = await Promise.all([
        StorageService.getLinks(),
        StorageService.getCollections()
      ]);
      setLinkCount(links.length);
      setCollectionCount(collections.length);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleClearAllData = () => {
    const confirmMessage = 'This will permanently delete all your links and collections. This action cannot be undone.';
    
    if (Platform.OS === 'web') {
      if (confirm(confirmMessage)) {
        performClearData();
      }
    } else {
      Alert.alert(
        'Clear All Data',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete All', 
            style: 'destructive',
            onPress: performClearData
          }
        ]
      );
    }
  };

  const performClearData = async () => {
    try {
      await StorageService.saveLinks([]);
      await StorageService.saveCollections([]);
      await NotificationService.cancelAllNotifications();
      setLinkCount(0);
      setCollectionCount(0);
      
      const successMessage = 'All data has been cleared.';
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      const errorMessage = 'Failed to clear data.';
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleExportData = async () => {
    if (Platform.OS !== 'web') {
      const message = 'Data export is only available on web platform.';
      Alert.alert('Not Available', message);
      return;
    }

    setIsExporting(true);
    try {
      const [links, collections] = await Promise.all([
        StorageService.getLinks(),
        StorageService.getCollections()
      ]);
      
      const exportData = {
        links,
        collections,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        appName: 'Linklit'
      };

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linklit-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Your data has been downloaded successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Available', 'Data import is only available on web platform.');
      return;
    }

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate the import data structure
        if (!importData.links || !importData.collections || !importData.version) {
          throw new Error('Invalid backup file format');
        }

        // Show confirmation dialog
        const confirmMessage = `This will replace all your current data with the backup from ${new Date(importData.exportedAt).toLocaleDateString()}.\n\nBackup contains:\n• ${importData.links.length} links\n• ${importData.collections.length} collections\n\nThis action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
          try {
            // Cancel all existing notifications
            await NotificationService.cancelAllNotifications();
            
            // Import the data
            await StorageService.saveLinks(importData.links);
            await StorageService.saveCollections(importData.collections);
            
            // Reschedule notifications for imported links with reminders
            for (const link of importData.links) {
              if (link.reminder && new Date(link.reminder) > new Date()) {
                await NotificationService.scheduleNotification(
                  'Link Reminder',
                  `Remember to check: ${link.title}`,
                  new Date(link.reminder),
                  `link_${link.id}`
                );
              }
            }
            
            // Update stats
            await loadStats();
            
            alert('Your data has been imported successfully!');
          } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error reading import file:', error);
        alert('Invalid backup file. Please select a valid Linklit backup file.');
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  };

  const handleAboutPress = () => {
    const aboutMessage = 'Linklit is a minimalist app for saving and organizing links. Built with love for simplicity and focus.\n\nVersion: 1.0.0\nBuilt with: React Native & Expo\n\nFeatures:\n• Save and organize links\n• Create custom collections\n• Set reminders for links\n• Export/import your data\n• Beautiful, minimal design';
    
    if (Platform.OS === 'web') {
      alert(aboutMessage);
    } else {
      Alert.alert('About Linklit', aboutMessage);
    }
  };

  const handleRatePress = () => {
    const message = 'App Store rating coming soon!';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Thank You!', message);
    }
  };

  const handleNotificationSettings = () => {
    const message = 'Advanced notification settings will be available in a future update.';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Coming Soon', message);
    }
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    danger = false,
    disabled = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow, 
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1
        }
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingTitle, 
            { color: danger ? colors.error : colors.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        onPress && !disabled && <ChevronRight size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Manage your Linklit experience
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
          <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{linkCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Links Saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{collectionCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Collections</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <SettingRow
            icon={<Bell size={20} color={colors.textMuted} />}
            title="Notification Settings"
            subtitle="Manage reminder notifications"
            onPress={handleNotificationSettings}
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          
          <SettingRow
            icon={<Download size={20} color={isExporting ? colors.textMuted : colors.primary} />}
            title="Export Data"
            subtitle={Platform.OS === 'web' 
              ? "Download your links and collections as JSON file" 
              : "Export feature available on web only"
            }
            onPress={Platform.OS === 'web' ? handleExportData : undefined}
            disabled={isExporting || Platform.OS !== 'web'}
            rightElement={isExporting ? (
              <Text style={[styles.statusText, { color: colors.textMuted }]}>Exporting...</Text>
            ) : undefined}
          />
          
          <SettingRow
            icon={<Upload size={20} color={isImporting ? colors.textMuted : colors.success} />}
            title="Import Data"
            subtitle={Platform.OS === 'web' 
              ? "Restore from backup JSON file" 
              : "Import feature available on web only"
            }
            onPress={Platform.OS === 'web' ? handleImportData : undefined}
            disabled={isImporting || Platform.OS !== 'web'}
            rightElement={isImporting ? (
              <Text style={[styles.statusText, { color: colors.textMuted }]}>Importing...</Text>
            ) : undefined}
          />

          {/* Data Format Info */}
          <View style={[styles.infoCard, { 
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primary + '30'
          }]}>
            <FileText size={16} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>
                Backup Format
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Exports are saved as JSON files containing all your links, collections, and settings. 
                Keep your backups safe and import them on any device running Linklit.
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <SettingRow
            icon={<Trash2 size={20} color={colors.error} />}
            title="Clear All Data"
            subtitle="Permanently delete all links and collections"
            onPress={handleClearAllData}
            danger
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <SettingRow
            icon={<Info size={20} color={colors.textMuted} />}
            title="About Linklit"
            subtitle="Version 1.0.0"
            onPress={handleAboutPress}
          />
          <SettingRow
            icon={<Star size={20} color={colors.textMuted} />}
            title="Rate the App"
            subtitle="Help us improve Linklit"
            onPress={handleRatePress}
          />
        </View>

        {/* App Tagline */}
        <View style={styles.footer}>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Light on your phone, heavy on focus.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  statsContainer: {
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
    fontSize: 24,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
  },
});