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
      // On web, we'll handle reminders through the UI instead of notifications
      return true;
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
      // On web, we don't schedule actual notifications but return a mock ID
      // The reminder will be handled through the UI
      return identifier || `web_reminder_${Date.now()}`;
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
      // On web, we don't need to cancel actual notifications
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
      // On web, we don't need to cancel actual notifications
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  // Web-specific reminder checking
  checkWebReminders(links: any[]): { overdueCount: number; upcomingCount: number } {
    if (Platform.OS !== 'web') {
      return { overdueCount: 0, upcomingCount: 0 };
    }

    const now = new Date();
    const activeLinksWithReminders = links.filter(link => 
      !link.isCompleted && link.reminder
    );
    
    const overdueCount = activeLinksWithReminders.filter(link => 
      new Date(link.reminder).getTime() < now.getTime()
    ).length;
    
    const upcomingCount = activeLinksWithReminders.filter(link => 
      new Date(link.reminder).getTime() >= now.getTime()
    ).length;
    
    return { overdueCount, upcomingCount };
  }
};