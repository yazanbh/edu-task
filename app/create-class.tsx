import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { createClass } from '@/lib/firebase-service';

export default function CreateClassScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    // Ensure user exists with uid
    if (!user || !user.uid) {
      Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      const classId = await createClass({
        name: name.trim(),
        subject: subject.trim(),
        teacherId: user.uid,
        teacherName: user.displayName || 'معلم',
      });
      
      Alert.alert('تم', 'تم إنشاء الصف بنجاح', [
        { text: 'حسناً', onPress: () => router.replace(`/class/${classId}` as any) }
      ]);
    } catch (error) {
      console.error('Error creating class:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الصف');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-6">
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
              >
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">إنشاء صف جديد</Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              {/* Class Name */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">اسم الصف</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="folder.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="مثال: الصف الثالث - أ"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Subject */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">المادة</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="book.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="مثال: الرياضيات"
                    placeholderTextColor={colors.muted}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              </View>

              {/* Info */}
              <View className="bg-primary/10 p-4 rounded-xl flex-row items-start gap-3">
                <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                <Text className="flex-1 text-sm text-primary">
                  سيتم إنشاء كود فريد للصف يمكن للطلاب استخدامه للانضمام
                </Text>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center mt-4 active:opacity-80"
                onPress={handleCreate}
                disabled={loading || !user?.uid}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-lg">إنشاء الصف</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
