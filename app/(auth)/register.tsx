import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signUp } = useAuth();
  
  const [role, setRole] = useState<UserRole>('student');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(email, password, displayName, role);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب');
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

            <View className="mb-6">
              <Text className="text-3xl font-bold text-foreground mb-2">إنشاء حساب</Text>
              <Text className="text-base text-muted">أنشئ حسابك للبدء في استخدام التطبيق</Text>
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-3">نوع الحساب</Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  className={`flex-1 p-4 rounded-xl border-2 items-center gap-2 ${
                    role === 'teacher' ? 'border-teacher bg-teacher/10' : 'border-border bg-surface'
                  }`}
                  onPress={() => setRole('teacher')}
                >
                  <IconSymbol 
                    name="person.fill" 
                    size={32} 
                    color={role === 'teacher' ? colors.teacher : colors.muted} 
                  />
                  <Text className={`font-semibold ${role === 'teacher' ? 'text-foreground' : 'text-muted'}`}>
                    معلم
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 p-4 rounded-xl border-2 items-center gap-2 ${
                    role === 'student' ? 'border-student bg-student/10' : 'border-border bg-surface'
                  }`}
                  onPress={() => setRole('student')}
                >
                  <IconSymbol 
                    name="graduationcap.fill" 
                    size={32} 
                    color={role === 'student' ? colors.student : colors.muted} 
                  />
                  <Text className={`font-semibold ${role === 'student' ? 'text-foreground' : 'text-muted'}`}>
                    طالب
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View className="gap-4">
              {/* Name Input */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">الاسم الكامل</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="person.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="أدخل اسمك الكامل"
                    placeholderTextColor={colors.muted}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
              </View>

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
                    placeholder="6 أحرف على الأقل"
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

              {/* Confirm Password Input */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">تأكيد كلمة المرور</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="lock.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="أعد إدخال كلمة المرور"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
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

              {/* Register Button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center mt-2 active:opacity-80"
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-lg">إنشاء الحساب</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6 gap-1">
              <Text className="text-muted">لديك حساب بالفعل؟</Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">تسجيل الدخول</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
