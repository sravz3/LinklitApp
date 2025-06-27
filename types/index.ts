export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  collectionId?: string;
  isCompleted: boolean;
  reminder?: Date;
  createdAt: Date;
  updatedAt: Date;
  favicon?: string;
  preview?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  linkCount: number;
}

export interface Reminder {
  id: string;
  linkId: string;
  scheduledFor: Date;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  notificationId?: string;
}