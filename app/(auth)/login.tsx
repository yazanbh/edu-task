import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-surface mb-4"
            >
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>

            <View className="mb-8">
              <Text className="text-3xl font-bold text-foreground mb-2">تسجيل الدخول</Text>
              <Text className="text-base text-muted">أدخل بياناتك للوصول إلى حسابك</Text>
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

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">كلمة المرور</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="lock.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <IconSymbol 
                      name={showPassword ? "eye.slash.fill" : "eye.fill"} 
                      size={20} 
                      color={colors.muted} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <Link href="/forgot-password" asChild>
                <TouchableOpacity className="self-end">
                  <Text className="text-primary font-medium">نسيت كلمة المرور؟</Text>
                </TouchableOpacity>
              </Link>

              {/* Error Message */}
              {error ? (
                <View className="bg-error/10 p-3 rounded-xl flex-row items-center gap-2">
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                  <Text className="text-error flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center mt-4 active:opacity-80"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-lg">تسجيل الدخول</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View className="flex-row justify-center mt-8 gap-1">
              <Text className="text-muted">ليس لديك حساب؟</Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">إنشاء حساب</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
