import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorScheme';
import { StorageService } from '@/utils/storage';
import { NotificationService } from '@/utils/notifications';
import { LinkPreviewService } from '@/utils/linkPreview';
import { Collection, Link } from '@/types';
import { Colors } from '@/constants/colors';
import { Link as LinkIcon, Clock, Tag, Save, ArrowLeft, ExternalLink, Trash2, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

const { width: screenWidth } = Dimensions.get('window');

export default function AddScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ editLinkId?: string }>();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reminder, setReminder] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  
  // Separate state for the picker that doesn't cause re-renders
  const [pickerState, setPickerState] = useState({
    selectedDate: new Date(),
    selectedHour: 9,
    selectedMinute: 0,
    isAM: true,
    currentMonth: new Date()
  });

  const resetForm = useCallback(() => {
    setIsEditMode(false);
    setEditingLink(null);
    setUrl('');
    setTitle('');
    setDescription('');
    setSelectedCollection('');
    setReminder(null);
    setLoading(false);
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      console.log('Loading collections...');
      const savedCollections = await StorageService.getCollections();
      console.log('Loaded collections:', savedCollections.length);
      setCollections(savedCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }, []);

  // Handle focus effect - this runs every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Add screen focused, params:', params);
      const editLinkId = params?.editLinkId;
      
      // Always reload collections when screen comes into focus
      loadCollections();
      
      if (editLinkId && typeof editLinkId === 'string') {
        // We're in edit mode
        loadLinkForEditing(editLinkId);
      } else {
        // We're in create mode - reset everything
        resetForm();
      }
    }, [params?.editLinkId, resetForm, loadCollections])
  );

  // Also load collections on mount to ensure they're available immediately
  useEffect(() => {
    loadCollections();
    requestNotificationPermissions();
  }, [loadCollections]);

  const loadLinkForEditing = async (editLinkId: string) => {
    try {
      const links = await StorageService.getLinks();
      const linkToEdit = links.find(l => l.id === editLinkId);
      
      if (linkToEdit) {
        setIsEditMode(true);
        setEditingLink(linkToEdit);
        setUrl(linkToEdit.url);
        setTitle(linkToEdit.title);
        setDescription(linkToEdit.description || '');
        setSelectedCollection(linkToEdit.collectionId || '');
        setReminder(linkToEdit.reminder ? new Date(linkToEdit.reminder) : null);
      } else {
        // Link not found, reset to create mode
        resetForm();
      }
    } catch (error) {
      console.error('Error loading link for editing:', error);
      resetForm();
    }
  };

  const requestNotificationPermissions = async () => {
    await NotificationService.requestPermissions();
  };

  const handleUrlChange = async (text: string) => {
    setUrl(text);
    
    // Auto-fetch preview if URL is valid and not in edit mode
    if (!isEditMode && isValidUrl(text) && !title) {
      try {
        const preview = await LinkPreviewService.getPreview(text);
        setTitle(preview.title);
      } catch (error) {
        console.error('Error fetching preview:', error);
      }
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSaveLink = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && editingLink) {
        // Update existing link
        const updatedLink: Partial<Link> = {
          url: url.trim(),
          title: title.trim() || editingLink.title,
          description: description.trim() || undefined,
          collectionId: selectedCollection || undefined,
          reminder: reminder || undefined,
          updatedAt: new Date(),
        };

        console.log('Updating link with ID:', editingLink.id);
        console.log('Updated data:', updatedLink);

        await StorageService.updateLink(editingLink.id, updatedLink);

        // Handle reminder notifications
        if (editingLink.reminder && !reminder) {
          // Reminder was removed
          await NotificationService.cancelNotification(`link_${editingLink.id}`);
        } else if (reminder) {
          // Reminder was added or updated
          await NotificationService.cancelNotification(`link_${editingLink.id}`);
          await NotificationService.scheduleNotification(
            'Link Reminder',
            `Remember to check: ${updatedLink.title}`,
            reminder,
            `link_${editingLink.id}`
          );
        }

        console.log('Link updated successfully');

        // Show success message and navigate back
        if (Platform.OS === 'web') {
          // For web, use a simple alert and navigate immediately
          alert('Link updated successfully!');
          router.back();
        } else {
          Alert.alert('Success', 'Link updated successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      } else {
        // Create new link
        const preview = await LinkPreviewService.getPreview(url);
        
        const newLink: Link = {
          id: Date.now().toString(),
          url: url.trim(),
          title: title.trim() || preview.title,
          description: description.trim(),
          collectionId: selectedCollection || undefined,
          isCompleted: false,
          reminder: reminder || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          favicon: preview.favicon,
        };

        await StorageService.addLink(newLink);

        // Schedule notification if reminder is set
        if (reminder) {
          await NotificationService.scheduleNotification(
            'Link Reminder',
            `Remember to check: ${newLink.title}`,
            reminder,
            `link_${newLink.id}`
          );
        }

        // Reset form after successful creation
        resetForm();

        if (Platform.OS === 'web') {
          alert('Link saved successfully!');
        } else {
          Alert.alert('Success', 'Link saved successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving link:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save link. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = () => {
    if (!editingLink) return;

    const confirmDelete = () => {
      Alert.alert(
        'Delete Link',
        'Are you sure you want to delete this link? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                await StorageService.deleteLink(editingLink.id);
                await NotificationService.cancelNotification(`link_${editingLink.id}`);
                
                if (Platform.OS === 'web') {
                  alert('Link deleted successfully!');
                  router.back();
                } else {
                  Alert.alert('Success', 'Link deleted successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                  ]);
                }
              } catch (error) {
                console.error('Error deleting link:', error);
                if (Platform.OS === 'web') {
                  alert('Failed to delete link.');
                } else {
                  Alert.alert('Error', 'Failed to delete link.');
                }
              }
            }
          }
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
        StorageService.deleteLink(editingLink.id)
          .then(() => {
            NotificationService.cancelNotification(`link_${editingLink.id}`);
            alert('Link deleted successfully!');
            router.back();
          })
          .catch((error) => {
            console.error('Error deleting link:', error);
            alert('Failed to delete link.');
          });
      }
    } else {
      confirmDelete();
    }
  };

  const handleOpenLink = async () => {
    if (url && isValidUrl(url)) {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch (error) {
        console.error('Error opening link:', error);
      }
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Quick reminder options
  const setQuickReminder = (type: 'hour' | 'tomorrow' | 'week') => {
    const reminderTime = new Date();
    
    switch (type) {
      case 'hour':
        reminderTime.setHours(reminderTime.getHours() + 1);
        break;
      case 'tomorrow':
        reminderTime.setDate(reminderTime.getDate() + 1);
        reminderTime.setHours(9, 0, 0, 0);
        break;
      case 'week':
        reminderTime.setDate(reminderTime.getDate() + 7);
        reminderTime.setHours(9, 0, 0, 0);
        break;
    }
    
    setReminder(reminderTime);
    setShowReminderOptions(false);
  };

  const showCustomDateTimePicker = () => {
    // Initialize with current reminder or default to tomorrow 9 AM
    const defaultTime = reminder || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    })();
    
    // Set time picker values
    const hours24 = defaultTime.getHours();
    const minutes = defaultTime.getMinutes();
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const ampm = hours24 < 12;
    
    setPickerState({
      selectedDate: new Date(defaultTime),
      currentMonth: new Date(defaultTime),
      selectedHour: hours12,
      selectedMinute: minutes,
      isAM: ampm
    });
    
    setShowReminderOptions(false);
    setShowDateTimePicker(true);
  };

  const handleSetReminder = () => {
    console.log('Reminder button clicked');
    setShowReminderOptions(true);
  };

  const handleDateTimeConfirm = (localPickerState: typeof pickerState) => {
    // Convert 12-hour to 24-hour format
    let hour24 = localPickerState.selectedHour;
    if (localPickerState.isAM && localPickerState.selectedHour === 12) {
      hour24 = 0;
    } else if (!localPickerState.isAM && localPickerState.selectedHour !== 12) {
      hour24 = localPickerState.selectedHour + 12;
    }
    
    // Combine date and time
    const combinedDateTime = new Date(localPickerState.selectedDate);
    combinedDateTime.setHours(hour24, localPickerState.selectedMinute, 0, 0);
    
    // Check if the selected time is in the future
    if (combinedDateTime <= new Date()) {
      if (Platform.OS === 'web') {
        alert('Please select a future date and time for your reminder.');
      } else {
        Alert.alert('Invalid Time', 'Please select a future date and time for your reminder.');
      }
      return;
    }
    
    setReminder(combinedDateTime);
    setShowDateTimePicker(false);
  };

  const formatReminderText = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) {
      return `Today at ${timeStr}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeStr}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} at ${timeStr}`;
    }
  };

  // Reminder Options Modal
  const ReminderOptionsModal = () => (
    <Modal
      visible={showReminderOptions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowReminderOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.reminderOptionsModal, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Set Reminder
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReminderOptions(false)}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.reminderOptionsContent}>
            <Text style={[styles.reminderOptionsSubtitle, { color: colors.textMuted }]}>
              {Platform.OS === 'web' 
                ? 'Choose when you\'d like to be reminded about this link:'
                : 'When would you like to be reminded?'
              }
            </Text>

            {reminder && (
              <TouchableOpacity
                style={[styles.reminderOption, styles.removeReminderOption, { 
                  backgroundColor: colors.error + '15',
                  borderColor: colors.error + '30'
                }]}
                onPress={() => {
                  setReminder(null);
                  setShowReminderOptions(false);
                }}
              >
                <X size={20} color={colors.error} />
                <Text style={[styles.reminderOptionText, { color: colors.error }]}>
                  Remove Reminder
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.reminderOption, { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={() => setQuickReminder('hour')}
            >
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.reminderOptionText, { color: colors.text }]}>
                In 1 hour
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reminderOption, { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={() => setQuickReminder('tomorrow')}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.reminderOptionText, { color: colors.text }]}>
                Tomorrow 9 AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reminderOption, { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={() => setQuickReminder('week')}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.reminderOptionText, { color: colors.text }]}>
                Next week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reminderOption, { 
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary + '30'
              }]}
              onPress={showCustomDateTimePicker}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.reminderOptionText, { color: colors.primary }]}>
                Custom Date & Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Date/Time picker component with batched updates
  const DateTimePicker = () => {
    // Local state for the picker that doesn't affect parent component
    const [localPickerState, setLocalPickerState] = useState(pickerState);

    // Update local state when modal opens
    useEffect(() => {
      if (showDateTimePicker) {
        setLocalPickerState(pickerState);
      }
    }, [showDateTimePicker, pickerState]);

    // Calendar helpers
    const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Update functions that only modify local state
    const updateSelectedDate = (date: Date) => {
      setLocalPickerState(prev => ({ ...prev, selectedDate: date }));
    };

    const updateSelectedHour = (hour: number) => {
      setLocalPickerState(prev => ({ ...prev, selectedHour: hour }));
    };

    const updateSelectedMinute = (minute: number) => {
      setLocalPickerState(prev => ({ ...prev, selectedMinute: minute }));
    };

    const updateIsAM = (isAM: boolean) => {
      setLocalPickerState(prev => ({ ...prev, isAM: isAM }));
    };

    const updateCurrentMonth = (month: Date) => {
      setLocalPickerState(prev => ({ ...prev, currentMonth: month }));
    };

    // Generate calendar days
    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(localPickerState.currentMonth);
      const firstDay = getFirstDayOfMonth(localPickerState.currentMonth);
      const today = new Date();
      
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(localPickerState.currentMonth.getFullYear(), localPickerState.currentMonth.getMonth(), day);
        const isSelected = localPickerState.selectedDate.toDateString() === date.toDateString();
        const isPast = date < today && date.toDateString() !== today.toDateString();
        
        days.push(
          <TouchableOpacity
            key={day}
            style={[
              styles.calendarDay,
              isSelected && { backgroundColor: colors.primary },
              isPast && { opacity: 0.3 }
            ]}
            onPress={() => !isPast && updateSelectedDate(date)}
            disabled={isPast}
          >
            <Text style={[
              styles.calendarDayText,
              { color: isSelected ? colors.card : colors.text },
              isPast && { color: colors.textMuted }
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        );
      }
      
      return days;
    };

    // Generate time lists
    const renderHourList = () => {
      const hours = Array.from({ length: 12 }, (_, i) => i + 1);
      
      return (
        <ScrollView 
          style={styles.timeList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeListContent}
        >
          {hours.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.timeItem,
                localPickerState.selectedHour === hour && { backgroundColor: colors.primary }
              ]}
              onPress={() => updateSelectedHour(hour)}
            >
              <Text style={[
                styles.timeItemText,
                { color: localPickerState.selectedHour === hour ? colors.card : colors.text }
              ]}>
                {hour.toString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    };

    const renderMinuteList = () => {
      const minutes = Array.from({ length: 60 }, (_, i) => i);
      
      return (
        <ScrollView 
          style={styles.timeList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeListContent}
        >
          {minutes.map((minute) => (
            <TouchableOpacity
              key={minute}
              style={[
                styles.timeItem,
                localPickerState.selectedMinute === minute && { backgroundColor: colors.primary }
              ]}
              onPress={() => updateSelectedMinute(minute)}
            >
              <Text style={[
                styles.timeItemText,
                { color: localPickerState.selectedMinute === minute ? colors.card : colors.text }
              ]}>
                {minute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    };

    // Calculate preview date/time
    const getPreviewDateTime = () => {
      let hour24 = localPickerState.selectedHour;
      if (localPickerState.isAM && localPickerState.selectedHour === 12) {
        hour24 = 0;
      } else if (!localPickerState.isAM && localPickerState.selectedHour !== 12) {
        hour24 = localPickerState.selectedHour + 12;
      }
      const combined = new Date(localPickerState.selectedDate);
      combined.setHours(hour24, localPickerState.selectedMinute, 0, 0);
      return combined;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newMonth = new Date(localPickerState.currentMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      updateCurrentMonth(newMonth);
    };

    const handleConfirm = () => {
      // Pass the local picker state to the confirm handler
      handleDateTimeConfirm(localPickerState);
    };

    return (
      <Modal
        visible={showDateTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateTimePicker(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalKeyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Set Reminder Date & Time
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDateTimePicker(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.pickerContainer}>
                  {/* Date Picker Section */}
                  <View style={styles.datePickerSection}>
                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Select Date</Text>
                    
                    {/* Month Navigation */}
                    <View style={styles.monthNavigation}>
                      <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={() => navigateMonth('prev')}
                      >
                        <ChevronLeft size={20} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.monthTitle, { color: colors.text }]}>
                        {localPickerState.currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={() => navigateMonth('next')}
                      >
                        <ChevronRight size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendar}>
                      {/* Day headers */}
                      <View style={styles.calendarHeader}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <Text key={index} style={[styles.calendarHeaderText, { color: colors.textMuted }]}>
                            {day}
                          </Text>
                        ))}
                      </View>
                      
                      {/* Calendar days */}
                      <View style={styles.calendarGrid}>
                        {renderCalendarDays()}
                      </View>
                    </View>
                  </View>

                  {/* Time Picker Section */}
                  <View style={styles.timePickerSection}>
                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Select Time</Text>
                    
                    <View style={styles.timePickerContainer}>
                      {/* Hour */}
                      <View style={styles.timeColumn}>
                        <Text style={[styles.timeColumnLabel, { color: colors.textMuted }]}>Hour</Text>
                        {renderHourList()}
                      </View>
                      
                      {/* Minute */}
                      <View style={styles.timeColumn}>
                        <Text style={[styles.timeColumnLabel, { color: colors.textMuted }]}>Min</Text>
                        {renderMinuteList()}
                      </View>
                      
                      {/* AM/PM */}
                      <View style={styles.timeColumn}>
                        <Text style={[styles.timeColumnLabel, { color: colors.textMuted }]}>Period</Text>
                        <View style={styles.ampmColumn}>
                          <TouchableOpacity
                            style={[
                              styles.ampmOption,
                              localPickerState.isAM && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => updateIsAM(true)}
                          >
                            <Text style={[
                              styles.ampmText,
                              { color: localPickerState.isAM ? colors.card : colors.text }
                            ]}>
                              AM
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.ampmOption,
                              !localPickerState.isAM && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => updateIsAM(false)}
                          >
                            <Text style={[
                              styles.ampmText,
                              { color: !localPickerState.isAM ? colors.card : colors.text }
                            ]}>
                              PM
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Preview */}
                <View style={[styles.previewSection, { 
                  backgroundColor: colors.primaryMuted,
                  borderColor: colors.primary + '30'
                }]}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={[styles.previewText, { color: colors.primary }]}>
                    {Platform.OS === 'web' 
                      ? `Reminder will appear in the app on ${formatReminderText(getPreviewDateTime())}`
                      : `Reminder will be set for ${formatReminderText(getPreviewDateTime())}`
                    }
                  </Text>
                </View>
              </View>

              {/* Modal Actions */}
              <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }]}
                  onPress={() => setShowDateTimePicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton, { 
                    backgroundColor: colors.primary
                  }]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.card }]}>
                    Set Reminder
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  const collectionColors = Object.values(Colors.light.collections);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {isEditMode && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isEditMode ? 'Edit Link' : 'Save New Link'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {isEditMode ? 'Update your saved link' : 'Add a link to save for later'}
              </Text>
            </View>
            {isEditMode && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteLink}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {/* Link Preview (Edit Mode) */}
          {isEditMode && editingLink && (
            <View style={styles.section}>
              <View style={[styles.linkPreview, { 
                backgroundColor: colors.card,
                borderColor: colors.border
              }]}>
                <View style={styles.linkHeader}>
                  {editingLink.favicon && (
                    <Image source={{ uri: editingLink.favicon }} style={styles.favicon} />
                  )}
                  <View style={styles.linkInfo}>
                    <Text style={[styles.linkUrl, { color: colors.primary }]} numberOfLines={1}>
                      {editingLink.url}
                    </Text>
                    <TouchableOpacity
                      style={[styles.openButton, { backgroundColor: colors.primaryMuted }]}
                      onPress={handleOpenLink}
                    >
                      <ExternalLink size={14} color={colors.primary} />
                      <Text style={[styles.openButtonText, { color: colors.primary }]}>
                        Open Link
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* URL Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              <LinkIcon size={16} color={colors.textMuted} /> URL
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="https://example.com"
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={handleUrlChange}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Link title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!loading}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {title.length}/100 characters
            </Text>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Add a note about this link..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={300}
              editable={!loading}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {description.length}/300 characters
            </Text>
          </View>

          {/* Collection Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              <Tag size={16} color={colors.textMuted} /> Collection (Optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.collectionsList}>
                <TouchableOpacity
                  style={[
                    styles.collectionChip,
                    {
                      backgroundColor: !selectedCollection ? colors.primary : colors.surface,
                      borderColor: !selectedCollection ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedCollection('')}
                  disabled={loading}
                >
                  <Text style={[
                    styles.collectionChipText,
                    { color: !selectedCollection ? colors.card : colors.text }
                  ]}>
                    None
                  </Text>
                </TouchableOpacity>
                
                {collections.map((collection, index) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={[
                      styles.collectionChip,
                      {
                        backgroundColor: selectedCollection === collection.id 
                          ? collection.color 
                          : colors.surface,
                        borderColor: selectedCollection === collection.id 
                          ? collection.color 
                          : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedCollection(collection.id)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.collectionChipText,
                      { 
                        color: selectedCollection === collection.id 
                          ? colors.card 
                          : colors.text 
                      }
                    ]}>
                      {collection.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.reminderButton, { 
                backgroundColor: reminder ? colors.primaryMuted : colors.surface,
                borderColor: reminder ? colors.primary : colors.border,
              }]}
              onPress={handleSetReminder}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Clock size={16} color={reminder ? colors.primary : colors.textMuted} />
              <Text style={[
                styles.reminderButtonText,
                { color: reminder ? colors.primary : colors.textMuted }
              ]}>
                {reminder 
                  ? formatReminderText(reminder)
                  : Platform.OS === 'web' 
                    ? 'Set reminder (will appear in app)'
                    : 'Set reminder (optional)'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.saveContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: url.trim() && !loading ? colors.primary : colors.border,
              }
            ]}
            onPress={handleSaveLink}
            disabled={!url.trim() || loading}
          >
            <Save size={16} color={colors.card} />
            <Text style={[styles.saveButtonText, { color: colors.card }]}>
              {loading 
                ? (isEditMode ? 'Saving...' : 'Saving...') 
                : (isEditMode ? 'Save Changes' : 'Save Link')
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Options Modal */}
        <ReminderOptionsModal />

        {/* Date Time Picker Modal */}
        <DateTimePicker />
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
    marginBottom: 24,
  },
  linkPreview: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
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
    height: 80,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  collectionsList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  collectionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  collectionChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderOptionsModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  reminderOptionsContent: {
    padding: 20,
  },
  reminderOptionsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  removeReminderOption: {
    marginBottom: 20,
  },
  reminderOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  modalKeyboardAvoid: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 20,
  },
  datePickerSection: {
    flex: 1,
  },
  timePickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    height: 200,
  },
  timeColumn: {
    flex: 1,
  },
  timeColumnLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeList: {
    flex: 1,
    borderRadius: 8,
  },
  timeListContent: {
    paddingVertical: 4,
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 2,
    alignItems: 'center',
  },
  timeItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  ampmColumn: {
    flex: 1,
    gap: 8,
  },
  ampmOption: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  ampmText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  previewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // No additional styles needed
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});