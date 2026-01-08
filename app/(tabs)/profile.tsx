import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, signOut } = useAuth();

  const isTeacher = user?.role === 'teacher';

  const handleSignOut = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل الخروج', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'tray.fill',
      title: 'الرسائل',
      onPress: () => router.push('/messages' as any),
    },
    {
      icon: 'bell.fill',
      title: 'الإشعارات',
      onPress: () => router.push('/notifications' as any),
    },
    {
      icon: 'gear',
      title: 'الإعدادات',
      onPress: () => router.push('/settings' as any),
    },
    {
      icon: 'info.circle.fill',
      title: 'عن التطبيق',
      onPress: () => Alert.alert('EduTask', 'نظام إدارة المهام التعليمية\nالإصدار 1.0.0'),
    },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Header */}
        <View className="items-center mb-8">
          <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: isTeacher ? colors.teacher + '20' : colors.student + '20' }}
          >
            <IconSymbol 
              name={isTeacher ? 'person.fill' : 'graduationcap.fill'} 
              size={48} 
              color={isTeacher ? colors.teacher : colors.student} 
            />
          </View>
          <Text className="text-2xl font-bold text-foreground">{user?.displayName}</Text>
          <Text className="text-base text-muted">{user?.email}</Text>
          <View 
            className="mt-2 px-4 py-1 rounded-full"
            style={{ backgroundColor: isTeacher ? colors.teacher + '20' : colors.student + '20' }}
          >
            <Text 
              className="text-sm font-medium"
              style={{ color: isTeacher ? colors.teacher : colors.student }}
            >
              {isTeacher ? 'معلم' : 'طالب'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center p-4 ${
                index < menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
              onPress={item.onPress}
            >
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                <IconSymbol name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text className="flex-1 text-base text-foreground">{item.title}</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-error/10 py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={handleSignOut}
        >
          <IconSymbol name="arrow.right.square.fill" size={20} color={colors.error} />
          <Text className="text-error font-semibold">تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
