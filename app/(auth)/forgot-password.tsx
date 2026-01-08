import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('لا يوجد حساب بهذا البريد الإلكتروني');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح');
      } else {
        setError('حدث خطأ أثناء إرسال رابط إعادة التعيين');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenContainer className="flex-1 p-6 justify-center items-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 bg-success/20 rounded-full items-center justify-center">
            <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">تم الإرسال!</Text>
          <Text className="text-base text-muted text-center px-8">
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 px-8 rounded-xl items-center mt-4 active:opacity-80"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold text-lg">العودة لتسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 p-6">
          {/* Header */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mb-4"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">نسيت كلمة المرور؟</Text>
            <Text className="text-base text-muted">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">البريد الإلكتروني</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <IconSymbol name="envelope.fill" size={20} color={colors.muted} />
                <TextInput
                  className="flex-1 py-4 px-3 text-foreground text-base"
                  placeholder="example@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-error/10 p-3 rounded-xl flex-row items-center gap-2">
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                <Text className="text-error flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Reset Button */}
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center mt-4 active:opacity-80"
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-lg">إرسال رابط إعادة التعيين</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
