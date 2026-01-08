import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { getSubmissionById, getAssignmentById } from '@/lib/firebase-service';
import { Submission, Assignment, Grade } from '@/types/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const gradeColors: Record<Grade, string> = {
  'D': '#22C55E',
  'M': '#3B82F6',
  'P': '#F59E0B',
  'U': '#EF4444',
  'NS': '#6B7280',
};

const gradeLabels: Record<Grade, string> = {
  'D': 'ممتاز (Distinction)',
  'M': 'جيد جداً (Merit)',
  'P': 'مقبول (Pass)',
  'U': 'غير مصنف (Unclassified)',
  'NS': 'لم يسلم',
};

export default function SubmissionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const submissionData = await getSubmissionById(id);
      setSubmission(submissionData);
      
      if (submissionData) {
        const assignmentData = await getAssignmentById(submissionData.assignmentId);
        setAssignment(assignmentData);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (uri: string) => {
    try {
      await Linking.openURL(uri);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!submission) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">لم يتم العثور على التسليم</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">العودة</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const grade = submission.grade as Grade;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{submission.assignmentTitle}</Text>
            <Text className="text-sm text-muted">تفاصيل التسليم</Text>
          </View>
        </View>

        {/* Submission Status */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <Text className="text-lg font-semibold text-foreground">تم التسليم</Text>
            {submission.status === 'late' && (
              <View className="bg-error/20 px-2 py-0.5 rounded">
                <Text className="text-xs text-error">متأخر</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-muted">
            {submission.submittedAt && format(submission.submittedAt.toDate(), 'EEEE, d MMMM yyyy - HH:mm', { locale: ar })}
          </Text>
        </View>

        {/* Grade Section */}
        {submission.status === 'graded' && grade && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <Text className="text-sm font-medium text-muted mb-4">التقييم</Text>
            <View className="flex-row items-center gap-4">
              <View 
                className="w-20 h-20 rounded-2xl items-center justify-center"
                style={{ backgroundColor: gradeColors[grade] + '20' }}
              >
                <Text 
                  className="text-4xl font-bold"
                  style={{ color: gradeColors[grade] }}
                >
                  {grade}
                </Text>
              </View>
              <View className="flex-1">
                <Text 
                  className="text-lg font-semibold"
                  style={{ color: gradeColors[grade] }}
                >
                  {gradeLabels[grade]}
                </Text>
                {submission.gradedAt && (
                  <Text className="text-sm text-muted mt-1">
                    تم التقييم: {format(submission.gradedAt.toDate(), 'd MMMM yyyy', { locale: ar })}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Feedback Section */}
        {submission.feedback && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
              <Text className="text-sm font-medium text-foreground">التغذية الراجعة</Text>
            </View>
            <Text className="text-foreground leading-6">{submission.feedback}</Text>
          </View>
        )}

        {/* Submitted Files */}
        {submission.files && submission.files.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-3">الملفات المرفقة</Text>
            <View className="gap-2">
              {submission.files.map((file, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                  onPress={() => handleOpenFile(file)}
                >
                  <IconSymbol name="doc.fill" size={24} color={colors.primary} />
                  <Text className="flex-1 mx-3 text-foreground" numberOfLines={1}>
                    ملف {index + 1}
                  </Text>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {submission.notes && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <Text className="text-sm font-medium text-muted mb-2">ملاحظاتك</Text>
            <Text className="text-foreground">{submission.notes}</Text>
          </View>
        )}

        {/* Assignment Info */}
        {assignment && (
          <TouchableOpacity
            className="bg-primary/10 rounded-xl p-4 flex-row items-center"
            onPress={() => router.push(`/assignment/${assignment.id}` as any)}
          >
            <IconSymbol name="doc.fill" size={24} color={colors.primary} />
            <View className="flex-1 mx-3">
              <Text className="text-primary font-medium">عرض تفاصيل الواجب</Text>
              <Text className="text-sm text-primary/70">{assignment.title}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
