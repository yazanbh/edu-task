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
import { getClassReport, StudentPerformance } from '@/lib/firebase-service-reports';
import { ClassReport } from '@/lib/firebase-service-reports';

export default function ReportsScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colors = useColors();
  const { user } = useAuth();

  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async () => {
    if (!classId || user?.role !== 'teacher') return;

    try {
      const classReport = await getClassReport(classId);
      setReport(classReport);
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('خطأ', 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [classId, user?.role]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
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

  const renderStudentReport = ({ item }: { item: StudentPerformance }) => (
    <TouchableOpacity
      className="bg-surface rounded-xl p-4 border border-border mb-3"
      onPress={() =>
        router.push(
          `/student-report/${classId}/${item.studentId}` as any
        )
      }
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {item.studentName}
          </Text>
          <Text className="text-sm text-muted">{item.studentEmail}</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">
            {item.averageGrade.toFixed(1)}
          </Text>
          <Text className="text-xs text-muted">متوسط</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-foreground">
            {item.submittedAssignments}
          </Text>
          <Text className="text-xs text-muted">مسلمة</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-foreground">
            {item.gradedAssignments}
          </Text>
          <Text className="text-xs text-muted">مقيمة</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-error">
            {item.lateSubmissions}
          </Text>
          <Text className="text-xs text-muted">متأخرة</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-warning">
            {item.pendingAssignments}
          </Text>
          <Text className="text-xs text-muted">معلقة</Text>
        </View>
      </View>

      {/* Grade distribution */}
      <View className="flex-row gap-2">
        {item.grades.slice(0, 3).map((grade, idx) => (
          <View key={idx} className="flex-1">
            <View
              className="h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: getGradeColor(grade.grade) + '20' }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: getGradeColor(grade.grade) }}
              >
                {grade.grade || '-'}
              </Text>
            </View>
          </View>
        ))}
        {item.grades.length > 3 && (
          <View className="flex-1 bg-muted/20 rounded-lg items-center justify-center">
            <Text className="text-xs font-bold text-muted">
              +{item.grades.length - 3}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!report) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">
          فشل تحميل التقرير
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
            <Text className="text-xl font-bold text-foreground">تقرير الأداء</Text>
            <Text className="text-sm text-muted">{report.className}</Text>
          </View>
        </View>

        {/* Class Statistics */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-primary/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-primary">{report.totalStudents}</Text>
            <Text className="text-xs text-muted mt-1">طالب</Text>
          </View>
          <View className="flex-1 bg-success/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-success">{report.totalAssignments}</Text>
            <Text className="text-xs text-muted mt-1">واجب</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-primary">
              {report.averageClassGrade.toFixed(1)}
            </Text>
            <Text className="text-xs text-muted mt-1">متوسط</Text>
          </View>
        </View>
      </View>

      {/* Students List */}
      <FlatList
        data={report.studentPerformance.sort(
          (a, b) => b.averageGrade - a.averageGrade
        )}
        keyExtractor={(item) => item.studentId}
        renderItem={renderStudentReport}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <IconSymbol name="person.fill" size={48} color={colors.muted} />
            <Text className="text-muted mt-4">لا يوجد طلاب</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
