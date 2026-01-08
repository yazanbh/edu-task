import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase-service';
import { Notification } from '@/types/firebase';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

const notificationIcons: Record<string, string> = {
  assignment: 'doc.fill',
  submission: 'tray.fill',
  grade: 'star.fill',
  deadline: 'clock.fill',
  class: 'folder.fill',
};

const notificationColors: Record<string, string> = {
  assignment: '#3B82F6',
  submission: '#22C55E',
  grade: '#F59E0B',
  deadline: '#EF4444',
  class: '#7C3AED',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on type
    if (notification.data) {
      if (notification.type === 'assignment' && notification.data.assignmentId) {
        router.push(`/assignment/${notification.data.assignmentId}` as any);
      } else if (notification.type === 'submission' && notification.data.assignmentId) {
        router.push(`/assignment/${notification.data.assignmentId}` as any);
      } else if (notification.type === 'grade' && notification.data.submissionId) {
        router.push(`/submission/${notification.data.submissionId}` as any);
      } else if (notification.type === 'class' && notification.data.classId) {
        router.push(`/class/${notification.data.classId}` as any);
      }
    }
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ar });
    }
    if (isYesterday(date)) {
      return 'أمس';
    }
    return format(date, 'd MMM', { locale: ar });
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconName = notificationIcons[item.type] || 'bell.fill';
    const iconColor = notificationColors[item.type] || colors.primary;
    const createdAt = item.createdAt?.toDate();
    
    return (
      <TouchableOpacity
        className={`p-4 border-b border-border ${!item.read ? 'bg-primary/5' : ''}`}
        onPress={() => handleNotificationPress(item)}
        style={{ opacity: 1 }}
      >
        <View className="flex-row">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: iconColor + '20' }}
          >
            <IconSymbol name={iconName as any} size={20} color={iconColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className={`font-semibold ${!item.read ? 'text-foreground' : 'text-muted'}`}>
                {item.title}
              </Text>
              {createdAt && (
                <Text className="text-xs text-muted">{formatDate(createdAt)}</Text>
              )}
            </View>
            <Text className="text-sm text-muted" numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          {!item.read && (
            <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-2" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">الإشعارات</Text>
          {unreadCount > 0 && (
            <View className="bg-primary px-2 py-0.5 rounded-full ml-2">
              <Text className="text-white text-xs font-semibold">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text className="text-primary font-medium">قراءة الكل</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <IconSymbol name="bell.fill" size={64} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">لا توجد إشعارات</Text>
            <Text className="text-muted mt-2">ستظهر الإشعارات الجديدة هنا</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
