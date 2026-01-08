import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentSubmissions } from '@/lib/firebase-service';
import { Submission, Grade } from '@/types/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const gradeColors: Record<Grade, string> = {
  'D': '#22C55E', // Distinction - Green
  'M': '#3B82F6', // Merit - Blue
  'P': '#F59E0B', // Pass - Amber
  'U': '#EF4444', // Unclassified - Red
  'NS': '#6B7280', // Not Submitted - Gray
};

const gradeLabels: Record<Grade, string> = {
  'D': 'ممتاز',
  'M': 'جيد جداً',
  'P': 'مقبول',
  'U': 'غير مصنف',
  'NS': 'لم يسلم',
};

export default function SubmissionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  const loadSubmissions = useCallback(async () => {
    // Wait for auth and ensure user has uid
    if (authLoading) return;
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await getStudentSubmissions(user.uid);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSubmissions();
    }, [loadSubmissions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return s.status !== 'graded';
    if (filter === 'graded') return s.status === 'graded';
    return true;
  });

  const getStatusInfo = (submission: Submission) => {
    if (submission.status === 'graded' && submission.grade) {
      const grade = submission.grade as Grade;
      return {
        text: gradeLabels[grade] || grade,
        color: gradeColors[grade] || colors.muted,
        icon: 'star.fill' as const,
      };
    }
    if (submission.status === 'late') {
      return {
        text: 'متأخر',
        color: colors.error,
        icon: 'clock.fill' as const,
      };
    }
    return {
      text: 'بانتظار التقييم',
      color: colors.warning,
      icon: 'clock.fill' as const,
    };
  };

  const renderSubmissionItem = ({ item }: { item: Submission }) => {
    const statusInfo = getStatusInfo(item);
    const submittedDate = item.submittedAt?.toDate ? item.submittedAt.toDate() : null;
    
    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 border border-border mb-3"
        onPress={() => router.push(`/submission/${item.id}` as any)}
        style={{ opacity: 1 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-1">
              {item.assignmentTitle}
            </Text>
            {submittedDate && (
              <Text className="text-sm text-muted mb-2">
                {format(submittedDate, 'dd MMMM yyyy - HH:mm', { locale: ar })}
              </Text>
            )}
            <View className="flex-row items-center gap-2">
              <IconSymbol name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={{ color: statusInfo.color }} className="text-sm font-medium">
                {statusInfo.text}
              </Text>
            </View>
          </View>
          {item.status === 'graded' && item.grade && (
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: gradeColors[item.grade as Grade] + '20' }}
            >
              <Text 
                className="text-lg font-bold"
                style={{ color: gradeColors[item.grade as Grade] }}
              >
                {item.grade}
              </Text>
            </View>
          )}
        </View>
        {item.feedback && (
          <View className="mt-3 pt-3 border-t border-border">
            <Text className="text-sm text-muted" numberOfLines={2}>
              {item.feedback}
            </Text>
          </View>
        )}
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

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={filteredSubmissions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubmissionItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground mb-4">تسليماتي</Text>
            
            {/* Filter Tabs */}
            <View className="flex-row bg-surface rounded-xl p-1 border border-border">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'pending', label: 'بانتظار التقييم' },
                { key: 'graded', label: 'تم التقييم' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  className={`flex-1 py-2 rounded-lg ${filter === tab.key ? 'bg-primary' : ''}`}
                  onPress={() => setFilter(tab.key as any)}
                >
                  <Text 
                    className={`text-center text-sm font-medium ${
                      filter === tab.key ? 'text-white' : 'text-muted'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <IconSymbol name="doc.fill" size={64} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">لا توجد تسليمات</Text>
            <Text className="text-muted mt-2 text-center">
              ستظهر تسليماتك هنا بعد تسليم الواجبات
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
