import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1 justify-between p-6">
      <View className="flex-1 items-center justify-center gap-8">
        {/* Logo and Title */}
        <View className="items-center gap-4">
          <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center">
            <IconSymbol name="graduationcap.fill" size={48} color="#FFFFFF" />
          </View>
          <Text className="text-4xl font-bold text-foreground">EduTask</Text>
          <Text className="text-base text-muted text-center px-8">
            نظام إدارة المهام التعليمية للمعلمين والطلاب
          </Text>
        </View>

        {/* Role Icons */}
        <View className="flex-row gap-12 mt-8">
          <View className="items-center gap-2">
            <View className="w-16 h-16 bg-teacher/20 rounded-2xl items-center justify-center">
              <IconSymbol name="person.fill" size={32} color={colors.teacher} />
            </View>
            <Text className="text-sm text-muted">معلم</Text>
          </View>
          <View className="items-center gap-2">
            <View className="w-16 h-16 bg-student/20 rounded-2xl items-center justify-center">
              <IconSymbol name="graduationcap.fill" size={32} color={colors.student} />
            </View>
            <Text className="text-sm text-muted">طالب</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="gap-4 pb-8">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center active:opacity-80"
          onPress={() => router.push('/login' as any)}
        >
          <Text className="text-white font-semibold text-lg">تسجيل الدخول</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border-2 border-primary py-4 rounded-xl items-center active:opacity-80"
          onPress={() => router.push('/register' as any)}
        >
          <Text className="text-primary font-semibold text-lg">إنشاء حساب جديد</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
