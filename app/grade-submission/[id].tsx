import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmissionById, gradeSubmission, createNotification } from '@/lib/firebase-service';
import { Submission, Grade } from '@/types/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const grades: { value: Grade; label: string; color: string }[] = [
  { value: 'D', label: 'ممتاز', color: '#22C55E' },
  { value: 'M', label: 'جيد جداً', color: '#3B82F6' },
  { value: 'P', label: 'مقبول', color: '#F59E0B' },
  { value: 'U', label: 'غير مصنف', color: '#EF4444' },
];

export default function GradeSubmissionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    if (!id) return;
    try {
      const data = await getSubmissionById(id);
      setSubmission(data);
      if (data?.grade) {
        setSelectedGrade(data.grade as Grade);
      }
      if (data?.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGrade) {
      Alert.alert('خطأ', 'يرجى اختيار التقييم');
      return;
    }

    if (!submission || !user) return;

    setSaving(true);
    try {
      await gradeSubmission(id!, {
        grade: selectedGrade,
        feedback: feedback.trim(),
        gradedBy: user.uid,
      });

      // Notify student
      await createNotification({
        userId: submission.studentId,
        title: 'تم تقييم واجبك',
        body: `تم تقييم واجب: ${submission.assignmentTitle}`,
        type: 'grade',
        data: { submissionId: id!, assignmentId: submission.assignmentId },
      });

      Alert.alert('تم', 'تم حفظ التقييم بنجاح', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving grade:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ التقييم');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFile = async (uri: string) => {
    try {
      await Linking.openURL(uri);
    } catch (error) {
      Alert.alert('خطأ', 'لا يمكن فتح الملف');
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
            <Text className="text-xl font-bold text-foreground">تقييم التسليم</Text>
            <Text className="text-sm text-muted">{submission.assignmentTitle}</Text>
          </View>
        </View>

        {/* Student Info */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-student/20 rounded-full items-center justify-center mr-3">
              <IconSymbol name="person.fill" size={24} color={colors.student} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{submission.studentName}</Text>
              <Text className="text-sm text-muted">
                {submission.submittedAt && format(submission.submittedAt.toDate(), 'dd MMMM yyyy - HH:mm', { locale: ar })}
              </Text>
            </View>
            {submission.status === 'late' && (
              <View className="bg-error/20 px-3 py-1 rounded-full">
                <Text className="text-error text-sm font-medium">متأخر</Text>
              </View>
            )}
          </View>
        </View>

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

        {/* Student Notes */}
        {submission.notes && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-3">ملاحظات الطالب</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground">{submission.notes}</Text>
            </View>
          </View>
        )}

        {/* Grade Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-3">التقييم</Text>
          <View className="flex-row gap-2">
            {grades.map((grade) => (
              <TouchableOpacity
                key={grade.value}
                className={`flex-1 py-4 rounded-xl items-center border-2 ${
                  selectedGrade === grade.value 
                    ? 'border-transparent' 
                    : 'border-border bg-surface'
                }`}
                style={selectedGrade === grade.value ? { backgroundColor: grade.color } : {}}
                onPress={() => setSelectedGrade(grade.value)}
              >
                <Text 
                  className={`text-2xl font-bold ${
                    selectedGrade === grade.value ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {grade.value}
                </Text>
                <Text 
                  className={`text-xs mt-1 ${
                    selectedGrade === grade.value ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  {grade.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-3">التغذية الراجعة</Text>
          <View className="bg-surface border border-border rounded-xl">
            <TextInput
              className="p-4 text-foreground text-base"
              placeholder="أضف تعليقاً أو ملاحظات للطالب..."
              placeholderTextColor={colors.muted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
            />
          </View>
        </View>

        {/* Quick Feedback Suggestions */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-muted mb-2">تعليقات سريعة</Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              'عمل ممتاز!',
              'يحتاج تحسين',
              'أحسنت',
              'راجع الملاحظات',
              'جهد جيد',
            ].map((text) => (
              <TouchableOpacity
                key={text}
                className="bg-surface border border-border px-3 py-2 rounded-lg"
                onPress={() => setFeedback(prev => prev ? `${prev}\n${text}` : text)}
              >
                <Text className="text-sm text-foreground">{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center active:opacity-80"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-lg">حفظ التقييم</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
