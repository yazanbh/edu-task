import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import * as Linking from 'expo-linking';
import { 
  getAssignmentById, 
  getAssignmentSubmissions, 
  getStudentSubmission,
  deleteAssignment 
} from '@/lib/firebase-service';
import { Assignment, Submission, Grade } from '@/types/firebase';
import { format, isBefore, differenceInDays, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';

const gradeColors: Record<Grade, string> = {
  'D': '#22C55E',
  'M': '#3B82F6',
  'P': '#F59E0B',
  'U': '#EF4444',
  'NS': '#6B7280',
};
const getFileTypeIcon = (url: string) => {
  const lower = url.toLowerCase();

  if (lower.includes('.pdf')) return { icon: 'doc.fill', color: '#EF4444' };
  if (lower.includes('.doc') || lower.includes('.docx'))
    return { icon: 'doc.text.fill', color: '#2563EB' };
  if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.jpeg'))
    return { icon: 'photo.fill', color: '#22C55E' };

  return { icon: 'paperclip', color: '#6B7280' };
};
export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      const assignmentData = await getAssignmentById(id);
      setAssignment(assignmentData);
      
      if (isTeacher) {
        const submissionsList = await getAssignmentSubmissions(id);
        setSubmissions(submissionsList);
      } else {
        const submission = await getStudentSubmission(id, user.uid);
        setMySubmission(submission);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user, isTeacher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'حذف الواجب',
      'هل أنت متأكد من حذف هذا الواجب؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssignment(id!);
              router.back();
            } catch (error) {
              console.error('Error deleting assignment:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الواجب');
            }
          },
        },
      ]
    );
  };

  const getDeadlineInfo = () => {
    if (!assignment) return null;
    
    const deadline = assignment.deadline.toDate();
    const now = new Date();
    const isPast = isBefore(deadline, now);
    
    if (isPast) {
      return { text: 'انتهى الموعد', color: colors.error, icon: 'xmark.circle.fill' as const };
    }
    
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);
    
    if (hoursLeft < 24) {
      return { text: `متبقي ${hoursLeft} ساعة`, color: colors.error, icon: 'clock.fill' as const };
    }
    if (daysLeft <= 3) {
      return { text: `متبقي ${daysLeft} أيام`, color: colors.warning, icon: 'clock.fill' as const };
    }
    return { text: `متبقي ${daysLeft} يوم`, color: colors.success, icon: 'clock.fill' as const };
  };

  const renderSubmissionItem = ({ item }: { item: Submission }) => (
    <TouchableOpacity
      className="bg-surface rounded-xl p-4 border border-border mb-3"
      onPress={() => router.push(`/grade-submission/${item.id}` as any)}
      style={{ opacity: 1 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{item.studentName}</Text>
          <Text className="text-sm text-muted">
            {item.submittedAt && format(item.submittedAt.toDate(), 'dd MMM - HH:mm', { locale: ar })}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            {item.status === 'late' && (
              <View className="bg-error/20 px-2 py-0.5 rounded">
                <Text className="text-xs text-error">متأخر</Text>
              </View>
            )}
            {item.status === 'graded' && item.grade && (
              <View 
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: gradeColors[item.grade as Grade] + '20' }}
              >
                <Text style={{ color: gradeColors[item.grade as Grade] }} className="text-xs font-semibold">
                  {item.grade}
                </Text>
              </View>
            )}
          </View>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
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

  if (!assignment) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
        <Text className="text-lg font-semibold text-foreground mt-4">لم يتم العثور على الواجب</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">العودة</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const deadlineInfo = getDeadlineInfo();
  const deadline = assignment.deadline.toDate();
  const isPast = isBefore(deadline, new Date());

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
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
              <Text className="text-xl font-bold text-foreground">{assignment.title}</Text>
              <Text className="text-sm text-muted">{assignment.className}</Text>
            </View>
            {isTeacher && (
              <TouchableOpacity
                className="w-10 h-10 items-center justify-center rounded-full bg-error/10"
                onPress={handleDelete}
              >
                <IconSymbol name="trash.fill" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {/* Deadline Card */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <IconSymbol name="calendar" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">الموعد النهائي</Text>
              </View>
              {deadlineInfo && (
                <View className="flex-row items-center gap-1">
                  <IconSymbol name={deadlineInfo.icon} size={16} color={deadlineInfo.color} />
                  <Text style={{ color: deadlineInfo.color }} className="text-sm font-medium">
                    {deadlineInfo.text}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-lg text-foreground">
              {format(deadline, 'EEEE, d MMMM yyyy - HH:mm', { locale: ar })}
            </Text>
          </View>
        </View>

        {/* Description */}
        {assignment.description && (
          <View className="p-4 border-b border-border">
            <Text className="text-sm font-medium text-muted mb-2">الوصف والتعليمات</Text>
            <Text className="text-foreground leading-6">{assignment.description}</Text>
          </View>
        )}
        {/* Attachments */}
{assignment.attachments && assignment.attachments.length > 0 && (
  <View className="p-4 border-b border-border">
    <Text className="text-sm font-medium text-muted mb-3">
      مرفقات الواجب
    </Text>

    <View className="gap-3">
      {assignment.attachments.map((url: string, index: number) => {
        const file = getFileTypeIcon(url);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => Linking.openURL(url)}
            className="bg-surface border border-border rounded-2xl p-4 flex-row items-center"
          >
            {/* Icon */}
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: file.color + '20' }}
            >
              <IconSymbol
                name={file.icon as any}
                size={26}
                color={file.color}
              />
            </View>

            {/* File Info */}
            <View className="flex-1">
              <Text
                className="text-foreground font-semibold"
                numberOfLines={1}
              >
                ملف الواجب {index + 1}
              </Text>
              <Text className="text-xs text-muted mt-1">
                اضغط لفتح أو تحميل الملف
              </Text>
            </View>

            {/* Download Icon */}
            <IconSymbol
              name="arrow.down.doc.fill"
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
)}


        {/* Teacher View - Submissions */}
        {isTeacher && (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">التسليمات</Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary font-medium">{submissions.length}</Text>
              </View>
            </View>
            
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <View key={submission.id}>
                  {renderSubmissionItem({ item: submission })}
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <IconSymbol name="tray.fill" size={48} color={colors.muted} />
                <Text className="text-muted mt-4">لا توجد تسليمات بعد</Text>
              </View>
            )}
          </View>
        )}

        {/* Student View - Submission Status */}
        {!isTeacher && (
          <View className="p-4">
            {mySubmission ? (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                  <Text className="text-lg font-semibold text-foreground">تم التسليم</Text>
                </View>
                <Text className="text-sm text-muted mb-2">
                  {mySubmission.submittedAt && format(mySubmission.submittedAt.toDate(), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                </Text>
                {mySubmission.status === 'late' && (
                  <View className="bg-error/10 px-3 py-2 rounded-lg mb-3">
                    <Text className="text-error text-sm">تم التسليم متأخراً</Text>
                  </View>
                )}
                {mySubmission.status === 'graded' && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-sm font-medium text-muted mb-2">التقييم</Text>
                    <View className="flex-row items-center gap-3">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: gradeColors[mySubmission.grade as Grade] + '20' }}
                      >
                        <Text 
                          className="text-xl font-bold"
                          style={{ color: gradeColors[mySubmission.grade as Grade] }}
                        >
                          {mySubmission.grade}
                        </Text>
                      </View>
                      {mySubmission.feedback && (
                        <View className="flex-1">
                          <Text className="text-sm text-foreground">{mySubmission.feedback}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View>
                {!isPast ? (
                  <View className="gap-3">
                    <TouchableOpacity
                      className="bg-primary py-4 rounded-xl items-center"
                      onPress={() => router.push(`/ai-assistant/${id}` as any)}
                    >
                      <Text className="text-background font-semibold text-lg">المساعد الذكي</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-primary py-4 rounded-xl items-center"
                      onPress={() => router.push(`/submit-assignment/${id}` as any)}
                    >
                      <Text className="text-background font-semibold text-lg">تسليم الواجب</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="bg-error/10 p-4 rounded-xl items-center">
                    <IconSymbol name="xmark.circle.fill" size={32} color={colors.error} />
                    <Text className="text-error font-semibold mt-2">انتهى موعد التسليم</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
