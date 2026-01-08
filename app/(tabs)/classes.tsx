import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherClasses, getStudentClasses, getClassByCode, joinClass } from '@/lib/firebase-service';
import { Class } from '@/types/firebase';

export default function ClassesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const loadClasses = useCallback(async () => {
    // Wait for auth and ensure user has uid
    if (authLoading) return;
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const data = isTeacher 
        ? await getTeacherClasses(user.uid)
        : await getStudentClasses(user.uid);
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isTeacher, authLoading]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const handleJoinClass = async () => {
    if (!classCode.trim() || !user || !user.uid) return;
    
    setJoining(true);
    try {
      const classData = await getClassByCode(classCode.trim());
      if (!classData) {
        Alert.alert('خطأ', 'لم يتم العثور على الصف بهذا الكود');
        return;
      }
      
      if (classData.studentIds.includes(user.uid)) {
        Alert.alert('تنبيه', 'أنت مسجل في هذا الصف بالفعل');
        return;
      }
      
      await joinClass(classData.id, user.uid);
      Alert.alert('تم', `تم الانضمام إلى ${classData.name} بنجاح`);
      setShowJoinModal(false);
      setClassCode('');
      loadClasses();
    } catch (error) {
      console.error('Error joining class:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الانضمام للصف');
    } finally {
      setJoining(false);
    }
  };

  const renderClassItem = ({ item }: { item: Class }) => (
    <TouchableOpacity
      className="bg-surface rounded-xl p-4 border border-border mb-3"
      onPress={() => router.push(`/class/${item.id}` as any)}
      style={{ opacity: 1 }}
    >
      <View className="flex-row items-center">
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: isTeacher ? colors.teacher + '20' : colors.student + '20' }}
        >
          <IconSymbol 
            name="book.fill" 
            size={24} 
            color={isTeacher ? colors.teacher : colors.student} 
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{item.name}</Text>
          <Text className="text-sm text-muted">{item.subject}</Text>
          {isTeacher && (
            <View className="flex-row items-center gap-1 mt-1">
              <IconSymbol name="person.2.fill" size={14} color={colors.muted} />
              <Text className="text-xs text-muted">{item.studentIds.length} طالب</Text>
            </View>
          )}
        </View>
        <View className="items-end">
          {isTeacher && (
            <View className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary font-medium">{item.code}</Text>
            </View>
          )}
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Join Class Modal */}
      {showJoinModal && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center p-6">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-foreground mb-4">الانضمام لصف</Text>
            <Text className="text-sm text-muted mb-4">أدخل كود الصف للانضمام</Text>
            
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-center text-lg tracking-widest mb-4"
              placeholder="XXXXXX"
              placeholderTextColor={colors.muted}
              value={classCode}
              onChangeText={(text) => setClassCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border py-3 rounded-xl items-center"
                onPress={() => {
                  setShowJoinModal(false);
                  setClassCode('');
                }}
              >
                <Text className="text-foreground font-semibold">إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-xl items-center"
                onPress={handleJoinClass}
                disabled={joining || classCode.length < 6}
              >
                {joining ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">انضمام</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-foreground">الصفوف</Text>
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-xl flex-row items-center gap-2"
              onPress={() => {
                if (isTeacher) {
                  router.push('/create-class' as any);
                } else {
                  setShowJoinModal(true);
                }
              }}
            >
              <IconSymbol name="plus" size={18} color="#FFFFFF" />
              <Text className="text-white font-semibold">
                {isTeacher ? 'صف جديد' : 'انضمام'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <IconSymbol name="folder.fill" size={64} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">لا توجد صفوف</Text>
            <Text className="text-muted mt-2 text-center">
              {isTeacher 
                ? 'قم بإنشاء صف جديد للبدء'
                : 'انضم لصف باستخدام الكود من معلمك'
              }
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
