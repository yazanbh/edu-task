import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentPerformance, StudentPerformance } from '@/lib/firebase-service-reports';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentReportScreen() {
  const router = useRouter();
  const { classId, studentId } = useLocalSearchParams<{
    classId: string;
    studentId: string;
  }>();
  const colors = useColors();
  const { user } = useAuth();

  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPerformance = useCallback(async () => {
    if (!classId || !studentId || user?.role !== 'teacher') return;

    try {
      const perf = await getStudentPerformance(classId, studentId);
      setPerformance(perf);
    } catch (error) {
      console.error('Error loading performance:', error);
      Alert.alert('خطأ', 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [classId, studentId, user?.role]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformance();
    setRefreshing(false);
  };

  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case 'D':
        return colors.success;
      case 'M':
        return colors.primary;
      case 'P':
        return colors.warning;
      case 'U':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getGradeLabel = (grade: string | null) => {
    switch (grade) {
      case 'D':
        return 'ممتاز';
      case 'M':
        return 'جيد جداً';
      case 'P':
        return 'جيد';
      case 'U':
        return 'ضعيف';
      default:
        return 'لم يتم التقييم';
    }
  };

  const renderGradeItem = ({ item }: { item: any }) => (
    <View className="bg-surface rounded-xl p-4 border border-border mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {item.assignmentName}
          </Text>
          <Text className="text-sm text-muted">
            الموعد النهائي: {format(item.deadline, 'dd MMM yyyy', { locale: ar })}
          </Text>
        </View>
        <View
          className="px-3 py-2 rounded-lg"
          style={{ backgroundColor: getGradeColor(item.grade) + '20' }}
        >
          <Text
            className="font-bold text-sm"
            style={{ color: getGradeColor(item.grade) }}
          >
            {item.grade ? getGradeLabel(item.grade) : 'لم يتم'}
          </Text>
        </View>
      </View>

      {item.submittedAt && (
        <View className="flex-row items-center gap-2">
          <IconSymbol
            name={item.isLate ? 'exclamationmark.circle.fill' : 'checkmark.circle.fill'}
            size={16}
            color={item.isLate ? colors.error : colors.success}
          />
          <Text className="text-sm text-muted">
            {item.isLate ? 'تسليم متأخر' : 'تسليم في الوقت'}:{' '}
            {format(item.submittedAt, 'dd MMM yyyy HH:mm', { locale: ar })}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!performance) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">
          فشل تحميل البيانات
        </Text>
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
            <Text className="text-xl font-bold text-foreground">
              {performance.studentName}
            </Text>
            <Text className="text-sm text-muted">{performance.studentEmail}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-primary/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-primary">
              {performance.averageGrade.toFixed(1)}
            </Text>
            <Text className="text-xs text-muted mt-1">متوسط</Text>
          </View>
          <View className="flex-1 bg-success/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-success">
              {performance.submittedAssignments}
            </Text>
            <Text className="text-xs text-muted mt-1">مسلمة</Text>
          </View>
          <View className="flex-1 bg-warning/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-warning">
              {performance.lateSubmissions}
            </Text>
            <Text className="text-xs text-muted mt-1">متأخرة</Text>
          </View>
        </View>

        {/* Progress */}
        <View className="bg-background rounded-xl p-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-foreground">التقدم</Text>
            <Text className="text-sm font-bold text-primary">
              {Math.round(
                (performance.submittedAssignments / performance.totalAssignments) * 100
              )}
              %
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${(performance.submittedAssignments / performance.totalAssignments) * 100}%`,
              }}
            />
          </View>
        </View>
      </View>

      {/* Grades List */}
      <FlatList
        data={performance.grades}
        keyExtractor={(item) => item.assignmentId}
        renderItem={renderGradeItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <IconSymbol name="doc.fill" size={48} color={colors.muted} />
            <Text className="text-muted mt-4">لا توجد واجبات</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
