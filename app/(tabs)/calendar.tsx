import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherAssignments, getStudentAssignments, getStudentSubmissions } from '@/lib/firebase-service';
import { Assignment } from '@/types/firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, addMonths, subMonths, startOfWeek, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CalendarDay {
  date: Date;
  assignments: Assignment[];
  isCurrentMonth: boolean;
}

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const isTeacher = user?.role === 'teacher';

  const loadData = useCallback(async () => {
    // Wait for auth and ensure user has uid
    if (authLoading) return;
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    
    setError(null);
    
    try {
      let data: Assignment[] = [];
      
      if (isTeacher) {
        data = await getTeacherAssignments(user.uid);
      } else {
        data = await getStudentAssignments(user.uid);
        // Also get submissions to mark which assignments are submitted
        try {
          const submissions = await getStudentSubmissions(user.uid);
          setSubmittedIds(new Set(submissions.map(s => s.assignmentId)));
        } catch (subError) {
          console.error('Error loading submissions:', subError);
        }
      }
      
      setAssignments(data);
    } catch (err) {
      console.error('Error loading calendar:', err);
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

  const getDaysInMonth = (): CalendarDay[] => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add empty days at the beginning to align with weekday
    const startDayOfWeek = getDay(start); // 0 = Sunday
    const emptyDays: CalendarDay[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      emptyDays.push({
        date: new Date(0),
        assignments: [],
        isCurrentMonth: false,
      });
    }
    
    const monthDays = days.map(date => ({
      date,
      assignments: assignments.filter(a => {
        if (!a.deadline) return false;
        const deadline = a.deadline?.toDate ? a.deadline.toDate() : new Date();
        return isSameDay(deadline, date);
      }),
      isCurrentMonth: true,
    }));
    
    return [...emptyDays, ...monthDays];
  };

  const getSelectedDateAssignments = () => {
    if (!selectedDate) return [];
    return assignments.filter(a => {
      if (!a.deadline) return false;
      const deadline = a.deadline?.toDate ? a.deadline.toDate() : new Date();
      return isSameDay(deadline, selectedDate);
    });
  };

  const renderDayItem = (item: CalendarDay, index: number) => {
    if (!item.isCurrentMonth) {
      return <View key={index} className="flex-1 aspect-square m-0.5" />;
    }
    
    const isSelected = selectedDate && isSameDay(item.date, selectedDate);
    const hasAssignments = item.assignments.length > 0;
    const isPast = isBefore(item.date, new Date()) && !isToday(item.date);
    
    return (
      <TouchableOpacity
        key={index}
        className={`flex-1 aspect-square items-center justify-center rounded-xl m-0.5 ${
          isSelected ? 'bg-primary' : isToday(item.date) ? 'bg-primary/20' : 'bg-surface'
        }`}
        onPress={() => setSelectedDate(item.date)}
        style={{ opacity: isPast ? 0.5 : 1 }}
      >
        <Text className={`text-sm font-medium ${
          isSelected ? 'text-white' : isToday(item.date) ? 'text-primary' : 'text-foreground'
        }`}>
          {format(item.date, 'd')}
        </Text>
        {hasAssignments && (
          <View className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
            isSelected ? 'bg-white' : 'bg-primary'
          }`} />
        )}
      </TouchableOpacity>
    );
  };

  const renderAssignmentItem = ({ item }: { item: Assignment }) => {
    if (!item.deadline) return null;
    const deadline = item.deadline?.toDate ? item.deadline.toDate() : new Date();
    const isPast = isBefore(deadline, new Date());
    const isSubmitted = submittedIds.has(item.id);
    
    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 border border-border mb-3"
        onPress={() => router.push(`/assignment/${item.id}` as any)}
        style={{ opacity: 1 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-1">{item.title}</Text>
            <Text className="text-sm text-muted">{item.className}</Text>
            <View className="flex-row items-center gap-2 mt-2">
              <IconSymbol name="clock.fill" size={14} color={isPast ? colors.error : colors.warning} />
              <Text className={`text-sm ${isPast ? 'text-error' : 'text-warning'}`}>
                {format(deadline, 'HH:mm', { locale: ar })}
              </Text>
              {!isTeacher && isSubmitted && (
                <View className="flex-row items-center gap-1 ml-2">
                  <IconSymbol name="checkmark.circle.fill" size={14} color={colors.success} />
                  <Text className="text-sm text-success">تم التسليم</Text>
                </View>
              )}
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (authLoading || loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const days = getDaysInMonth();
  const selectedAssignments = getSelectedDateAssignments();
  const weekDays = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground mb-4">التقويم</Text>
          
          {/* Error Message */}
          {error && (
            <View className="bg-error/10 p-4 rounded-xl mb-4 flex-row items-center gap-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
              <Text className="text-error flex-1">{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text className="text-primary font-semibold">إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4 bg-surface rounded-xl p-3">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full bg-background"
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">
              {format(currentMonth, 'MMMM yyyy', { locale: ar })}
            </Text>
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full bg-background"
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View className="flex-row mb-2">
            {weekDays.map((day, index) => (
              <View key={index} className="flex-1 items-center py-2">
                <Text className="text-xs text-muted font-medium">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap mb-4">
            {days.map((day, index) => (
              <View key={index} style={{ width: '14.28%' }}>
                {renderDayItem(day, index)}
              </View>
            ))}
          </View>

          {/* Selected Date Assignments */}
          <View className="mt-2">
            <Text className="text-lg font-semibold text-foreground mb-3">
              {selectedDate 
                ? format(selectedDate, 'EEEE, d MMMM', { locale: ar })
                : 'اختر يوماً لعرض الواجبات'
              }
            </Text>
            
            {selectedDate && selectedAssignments.length === 0 && (
              <View className="items-center py-8 bg-surface rounded-xl">
                <IconSymbol name="calendar" size={48} color={colors.muted} />
                <Text className="text-muted mt-4">لا توجد واجبات في هذا اليوم</Text>
              </View>
            )}
            
            {selectedAssignments.map((assignment) => (
              <View key={assignment.id}>
                {renderAssignmentItem({ item: assignment })}
              </View>
            ))}
          </View>
          
          {/* Upcoming Assignments Summary */}
          {assignments.length > 0 && (
            <View className="mt-4 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-2">
                ملخص الواجبات
              </Text>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary">{assignments.length}</Text>
                  <Text className="text-xs text-muted">إجمالي</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-warning">
                    {assignments.filter(a => {
                      if (!a.deadline) return false;
                      const deadline = a.deadline?.toDate ? a.deadline.toDate() : new Date();
                      return !isBefore(deadline, new Date());
                    }).length}
                  </Text>
                  <Text className="text-xs text-muted">قادمة</Text>
                </View>
                {!isTeacher && (
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-success">
                      {assignments.filter(a => submittedIds.has(a.id)).length}
                    </Text>
                    <Text className="text-xs text-muted">مسلمة</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
