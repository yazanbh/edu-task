import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
  };

  const handleToggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('sound_enabled', JSON.stringify(value));
  };

  const handleClearCache = () => {
    Alert.alert(
      'مسح ذاكرة التخزين المؤقت',
      'هل أنت متأكد؟ سيتم حذف البيانات المؤقتة.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear only cache-related items, not auth
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(k => k.startsWith('cache_'));
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('تم', 'تم مسح ذاكرة التخزين المؤقت');
            } catch (error) {
              console.error('Error clearing cache:', error);
            }
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'الإشعارات',
      items: [
        {
          icon: 'bell.fill',
          title: 'تفعيل الإشعارات',
          subtitle: 'استلام إشعارات للواجبات والتقييمات',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: handleToggleNotifications,
        },
        {
          icon: 'speaker.wave.2.fill',
          title: 'صوت الإشعارات',
          subtitle: 'تشغيل صوت عند استلام إشعار',
          type: 'switch',
          value: soundEnabled,
          onValueChange: handleToggleSound,
        },
      ],
    },
    {
      title: 'الحساب',
      items: [
        {
          icon: 'person.fill',
          title: 'معلومات الحساب',
          subtitle: user?.email,
          type: 'info',
        },
        {
          icon: 'shield.fill',
          title: 'نوع الحساب',
          subtitle: user?.role === 'teacher' ? 'معلم' : 'طالب',
          type: 'info',
        },
      ],
    },
    {
      title: 'التطبيق',
      items: [
        {
          icon: 'trash.fill',
          title: 'مسح ذاكرة التخزين المؤقت',
          subtitle: 'حذف البيانات المؤقتة',
          type: 'action',
          onPress: handleClearCache,
          destructive: true,
        },
        {
          icon: 'info.circle.fill',
          title: 'الإصدار',
          subtitle: '1.0.0',
          type: 'info',
        },
      ],
    },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">الإعدادات</Text>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className="text-sm font-medium text-muted mb-3 px-1">{section.title}</Text>
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-border' : ''
                  }`}
                  onPress={item.type === 'action' && 'onPress' in item ? item.onPress : undefined}
                  disabled={item.type !== 'action'}
                >
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ 
                      backgroundColor: (item as any).destructive 
                        ? colors.error + '20' 
                        : colors.primary + '20' 
                    }}
                  >
                    <IconSymbol 
                      name={item.icon as any} 
                      size={20} 
                      color={(item as any).destructive ? colors.error : colors.primary} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text 
                      className={`text-base ${
                        (item as any).destructive ? 'text-error' : 'text-foreground'
                      }`}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text className="text-sm text-muted">{item.subtitle}</Text>
                    )}
                  </View>
                  {item.type === 'switch' && 'value' in item && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onValueChange as (value: boolean) => void}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                  {item.type === 'action' && (
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View className="items-center py-8">
          <Text className="text-muted text-sm">EduTask</Text>
          <Text className="text-muted text-xs mt-1">نظام إدارة المهام التعليمية</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
