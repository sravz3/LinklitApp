import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  async scheduleNotification(
    title: string,
    body: string,
    scheduledFor: Date,
    identifier?: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: {
          date: scheduledFor,
        },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
};