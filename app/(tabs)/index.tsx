import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTeacherStats, 
  getStudentStats, 
  getTeacherAssignments,
  getStudentAssignments,
  getStudentSubmissions
} from '@/lib/firebase-service';
import { Assignment } from '@/types/firebase';
import { format, isBefore, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Stats {
  totalClasses: number;
  totalStudents?: number;
  totalAssignments?: number;
  pendingSubmissions?: number;
  pendingAssignments?: number;
  submittedAssignments?: number;
  gradedAssignments?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentItems, setRecentItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher';

  const loadData = useCallback(async () => {
    // Wait for auth to complete and ensure user exists with uid
    if (authLoading) return;
    if (!user || !user.uid) {
      setLoading(false);
      setError('يرجى تسجيل الدخول');
      return;
    }
    
    setError(null);
    
    try {
      if (isTeacher) {
        const teacherStats = await getTeacherStats(user.uid);
        setStats(teacherStats);
        
        // Get recent assignments with pending submissions
        const assignments = await getTeacherAssignments(user.uid);
        const recentAssignments = assignments.slice(0, 5);
        setRecentItems(recentAssignments);
      } else {
        const studentStats = await getStudentStats(user.uid);
        setStats(studentStats);
        
        // Get upcoming assignments
        const assignments = await getStudentAssignments(user.uid);
        const submissions = await getStudentSubmissions(user.uid);
        const submittedIds = new Set(submissions.map(s => s.assignmentId));
        
        // Filter pending assignments
        const pendingAssignments = assignments
          .filter(a => !submittedIds.has(a.id))
          .slice(0, 5);
        setRecentItems(pendingAssignments);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [user, isTeacher, authLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDeadlineStatus = (deadline: Date) => {
    const now = new Date();
    if (isBefore(deadline, now)) {
      return { text: 'منتهي', color: colors.error };
    }
    if (isBefore(deadline, addDays(now, 1))) {
      return { text: 'اليوم', color: colors.warning };
    }
    if (isBefore(deadline, addDays(now, 3))) {
      return { text: 'قريباً', color: colors.warning };
    }
    return { text: format(deadline, 'dd MMM', { locale: ar }), color: colors.muted };
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
      <View className="flex-row items-center justify-between mb-2">
        <IconSymbol name={icon as any} size={24} color={color} />
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
      </View>
      <Text className="text-sm text-muted">{title}</Text>
    </View>
  );

  const renderAssignmentItem = ({ item }: { item: Assignment }) => {
    const deadline = item.deadline?.toDate ? item.deadline.toDate() : new Date();
    const status = getDeadlineStatus(deadline);
    
    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 border border-border mb-3"
        onPress={() => router.push(`/assignment/${item.id}` as any)}
        style={{ opacity: 1 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-1">{item.title}</Text>
            <Text className="text-sm text-muted mb-2">{item.className}</Text>
            <View className="flex-row items-center gap-2">
              <IconSymbol name="clock.fill" size={14} color={status.color} />
              <Text style={{ color: status.color }} className="text-sm">
                {status.text}
              </Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading while auth is loading
  if (authLoading || loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  // Show error state
  if (error) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={onRefresh}
        >
          <Text className="text-white font-semibold">إعادة المحاولة</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={recentItems}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignmentItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View className="mb-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-sm text-muted">مرحباً،</Text>
                <Text className="text-2xl font-bold text-foreground">{user?.displayName || 'المستخدم'}</Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
                onPress={() => router.push('/notifications' as any)}
              >
                <IconSymbol name="bell.fill" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            {stats && (
              <View className="gap-3 mb-6">
                <View className="flex-row gap-3">
                  {renderStatCard('الصفوف', stats.totalClasses, 'folder.fill', colors.primary)}
                  {isTeacher ? (
                    renderStatCard('الطلاب', stats.totalStudents || 0, 'person.2.fill', colors.student)
                  ) : (
                    renderStatCard('المهام المعلقة', stats.pendingAssignments || 0, 'clock.fill', colors.warning)
                  )}
                </View>
                <View className="flex-row gap-3">
                  {isTeacher ? (
                    <>
                      {renderStatCard('الواجبات', stats.totalAssignments || 0, 'doc.fill', colors.teacher)}
                      {renderStatCard('بانتظار التصحيح', stats.pendingSubmissions || 0, 'tray.fill', colors.warning)}
                    </>
                  ) : (
                    <>
                      {renderStatCard('تم التسليم', stats.submittedAssignments || 0, 'checkmark.circle.fill', colors.success)}
                      {renderStatCard('تم التقييم', stats.gradedAssignments || 0, 'star.fill', colors.primary)}
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            {isTeacher && (
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2"
                  onPress={() => router.push('/create-class' as any)}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold">صف جديد</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2"
                  onPress={() => router.push('/create-assignment' as any)}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold">واجب جديد</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section Title */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              {isTeacher ? 'الواجبات الأخيرة' : 'الواجبات المعلقة'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <IconSymbol name="doc.fill" size={48} color={colors.muted} />
            <Text className="text-muted mt-4 text-center">
              {isTeacher ? 'لا توجد واجبات بعد' : 'لا توجد واجبات معلقة'}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
