import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getClassById, getClassAssignments, getClassStudents, deleteClass, leaveClass } from '@/lib/firebase-service';
import { Class, Assignment, User } from '@/types/firebase';
import { format, isBefore } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');

  const isTeacher = user?.role === 'teacher';

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const cls = await getClassById(id);
      const assignmentsList = await getClassAssignments(id);
      
      // Only load students list for teachers
      let studentsList: User[] = [];
      if (isTeacher) {
        studentsList = await getClassStudents(id);
      }
      
      setClassData(cls);
      setAssignments(assignmentsList);
      setStudents(studentsList);
    } catch (error) {
      console.error('Error loading class:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isTeacher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleShareCode = async () => {
    if (!classData) return;
    try {
      await Share.share({
        message: `انضم إلى صف "${classData.name}" باستخدام الكود: ${classData.code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeleteClass = () => {
    Alert.alert(
      'حذف الصف',
      'هل أنت متأكد من حذف هذا الصف؟ سيتم حذف جميع الواجبات والتسليمات.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClass(id!);
              router.back();
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الصف');
            }
          },
        },
      ]
    );
  };

  const handleLeaveClass = () => {
    Alert.alert(
      'مغادرة الصف',
      'هل أنت متأكد من مغادرة هذا الصف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مغادرة',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveClass(id!, user!.uid);
              router.back();
            } catch (error) {
              console.error('Error leaving class:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء مغادرة الصف');
            }
          },
        },
      ]
    );
  };

  const renderAssignmentItem = ({ item }: { item: Assignment }) => {
    const deadline = item.deadline?.toDate ? item.deadline.toDate() : new Date();
    const isPast = isBefore(deadline, new Date());
    
    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 border border-border mb-3"
        onPress={() => router.push(`/assignment/${item.id}` as any)}
        style={{ opacity: 1 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-1">{item.title}</Text>
            <View className="flex-row items-center gap-2">
              <IconSymbol name="clock.fill" size={14} color={isPast ? colors.error : colors.warning} />
              <Text className={`text-sm ${isPast ? 'text-error' : 'text-muted'}`}>
                {format(deadline, 'dd MMM yyyy - HH:mm', { locale: ar })}
              </Text>
            </View>
            {item.description && (
              <Text className="text-sm text-muted mt-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <View className={`px-2 py-1 rounded ${item.status === 'published' ? 'bg-success/20' : 'bg-muted/20'}`}>
            <Text className={`text-xs ${item.status === 'published' ? 'text-success' : 'text-muted'}`}>
              {item.status === 'published' ? 'منشور' : 'مسودة'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentItem = ({ item }: { item: User }) => (
    <View className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center">
      <View className="w-10 h-10 bg-student/20 rounded-full items-center justify-center mr-3">
        <IconSymbol name="person.fill" size={20} color={colors.student} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{item.displayName}</Text>
        <Text className="text-sm text-muted">{item.email}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!classData) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">لم يتم العثور على الصف</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">العودة</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="p-4 border-b border-border">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{classData.name}</Text>
            <Text className="text-sm text-muted">{classData.subject}</Text>
          </View>
          {isTeacher ? (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-10 h-10 items-center justify-center rounded-full bg-primary/10"
                onPress={() => router.push(`/reports/${id}` as any)}
              >
                <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 items-center justify-center rounded-full bg-error/10"
                onPress={handleDeleteClass}
              >
                <IconSymbol name="trash.fill" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full bg-error/10"
              onPress={handleLeaveClass}
            >
              <IconSymbol name="arrow.right.square.fill" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Code - Only for teachers */}
        {isTeacher && (
          <TouchableOpacity
            className="flex-row items-center justify-between bg-primary/10 p-3 rounded-xl"
            onPress={handleShareCode}
          >
            <View className="flex-row items-center gap-2">
              <IconSymbol name="qrcode" size={20} color={colors.primary} />
              <Text className="text-primary font-medium">كود الصف:</Text>
              <Text className="text-primary font-bold text-lg tracking-widest">{classData.code}</Text>
            </View>
            <IconSymbol name="paperplane.fill" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Stats - Show different stats for students vs teachers */}
        <View className="flex-row gap-4 mt-4">
          {isTeacher && (
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
              <Text className="text-2xl font-bold text-foreground">{students.length}</Text>
              <Text className="text-sm text-muted">طالب</Text>
            </View>
          )}
          <View className={`${isTeacher ? 'flex-1' : 'flex-1'} bg-surface rounded-xl p-3 border border-border items-center`}>
            <Text className="text-2xl font-bold text-foreground">{assignments.length}</Text>
            <Text className="text-sm text-muted">واجب</Text>
          </View>
        </View>
                  <TouchableOpacity
  className="bg-primary rounded-xl p-3 mt-4"
  onPress={() =>
    router.push(
            `/message-detail/${classData.teacherId}?name=${classData.teacherName}`
    )
  }
>
  <Text className="text-white text-center font-semibold">
    مراسلة معلم المادة
  </Text>
</TouchableOpacity>
   
      </View>

      {/* Tabs - Only show for teachers */}
      {isTeacher && (
        <View className="flex-row p-4 gap-2">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${
              activeTab === 'assignments' ? 'bg-primary' : 'bg-surface border border-border'
            }`}
            onPress={() => setActiveTab('assignments')}
          >
            <Text className={`text-center font-semibold ${
              activeTab === 'assignments' ? 'text-white' : 'text-foreground'
            }`}>
              الواجبات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${
              activeTab === 'students' ? 'bg-primary' : 'bg-surface border border-border'
            }`}
            onPress={() => setActiveTab('students')}
          >
            <Text className={`text-center font-semibold ${
              activeTab === 'students' ? 'text-white' : 'text-foreground'
            }`}>
              الطلاب ({students.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Title for Students */}
      {!isTeacher && (
        <View className="px-4 pt-4">
          <Text className="text-lg font-bold text-foreground">الواجبات</Text>
        </View>
      )}

      {/* Content - For students, only show assignments */}
      {isTeacher ? (
        // Teacher view with tabs
        activeTab === 'assignments' ? (
          <FlatList
            data={assignments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssignmentItem}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListHeaderComponent={
              <TouchableOpacity
                className="bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 mb-4"
                onPress={() => router.push(`/create-assignment?classId=${id}` as any)}
              >
                <IconSymbol name="plus" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold">إضافة واجب</Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={
              <View className="items-center py-8">
                <IconSymbol name="doc.fill" size={48} color={colors.muted} />
                <Text className="text-muted mt-4">لا توجد واجبات</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.uid}
            renderItem={renderStudentItem}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View className="items-center py-8">
                <IconSymbol name="person.fill" size={48} color={colors.muted} />
                <Text className="text-muted mt-4">لا يوجد طلاب مسجلين</Text>
              </View>
            }
          />
        )
      ) : (
        // Student view - only assignments, no tabs
        <FlatList
          data={assignments.filter(a => a.status === 'published')}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignmentItem}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <IconSymbol name="doc.fill" size={48} color={colors.muted} />
              <Text className="text-muted mt-4">لا توجد واجبات منشورة</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
