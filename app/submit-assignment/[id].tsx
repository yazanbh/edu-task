import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { getAssignmentById, createSubmission, createNotification, uploadSubmissionFile } from '@/lib/firebase-service';
import { Assignment } from '@/types/firebase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SelectedFile {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
}

export default function SubmitAssignmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    if (!id) return;
    try {
      const data = await getAssignmentById(id);
      setAssignment(data);
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          mimeType: asset.mimeType,
        }));
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الملف');
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!assignment || !user) return;

    if (files.length === 0 && !notes.trim()) {
      Alert.alert('خطأ', 'يرجى إرفاق ملف أو كتابة ملاحظات');
      return;
    }

    setSubmitting(true);
    try {
      // First create the submission to get its ID
      const submissionId = await createSubmission({
        assignmentId: id!,
        assignmentTitle: assignment.title,
        studentId: user.uid,
        studentName: user.displayName,
        classId: assignment.classId,
        files: [],
        notes: notes.trim(),
      });

      // Upload files to Firebase Storage
      const fileUrls: string[] = [];
      for (const file of files) {
        try {
          const fileData = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'base64' as any,
          });
          const binaryString = atob(fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new (window as any).Blob([bytes], { type: file.mimeType || 'application/octet-stream' }) as any;
          const url = await uploadSubmissionFile(
            submissionId,
            file.name,
            blob
          );
          fileUrls.push(url);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }

      // Update submission with file URLs if any were uploaded
      if (fileUrls.length > 0) {
        await updateDoc(doc(db, 'submissions', submissionId), {
          files: fileUrls,
        });
      }

      // Notify teacher
      await createNotification({
        userId: assignment.teacherId,
        title: 'تسليم جديد',
        body: `قام ${user.displayName} بتسليم: ${assignment.title}`,
        type: 'submission',
        data: { assignmentId: id!, classId: assignment.classId },
      });

      Alert.alert('تم', 'تم تسليم الواجب بنجاح', [
        { 
          text: 'عرض تسليماتي', 
          onPress: () => {
            // Navigate to submissions tab with refresh
            router.replace('/(tabs)/submissions' as any);
          }
        },
        {
          text: 'العودة',
          onPress: () => router.back(),
          style: 'cancel'
        }
      ]);
    } catch (error: any) {
      console.error('Error submitting:', error);
      if (error.message === 'Already submitted') {
        Alert.alert('تنبيه', 'لقد قمت بتسليم هذا الواجب مسبقاً');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تسليم الواجب');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  const deadline = assignment.deadline?.toDate ? assignment.deadline.toDate() : new Date();

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
            <Text className="text-xl font-bold text-foreground">تسليم الواجب</Text>
            <Text className="text-sm text-muted">{assignment.title}</Text>
          </View>
        </View>

        {/* Assignment Info */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <IconSymbol name="calendar" size={18} color={colors.primary} />
            <Text className="text-sm text-muted">الموعد النهائي</Text>
          </View>
          <Text className="text-foreground font-medium">
            {format(deadline, 'EEEE, d MMMM yyyy - HH:mm', { locale: ar })}
          </Text>
        </View>

        {/* Assignment Attachments */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-3">المرفقات من المعلم</Text>
            <View className="gap-2">
              {assignment.attachments.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                  onPress={() => {
                    // In a real app, you'd open the file
                    Alert.alert('تحميل الملف', 'سيتم فتح الملف في المتصفح');
                  }}
                >
                  <IconSymbol name="doc.fill" size={24} color={colors.primary} />
                  <View className="flex-1 mx-3">
                    <Text className="text-foreground font-medium">
                      ملف من المعلم #{index + 1}
                    </Text>
                    <Text className="text-xs text-muted">اضغط لتحميل</Text>
                  </View>
                  <IconSymbol name="arrow.down.doc.fill" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* File Upload */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-3">الملفات المرفقة</Text>
          
          <TouchableOpacity
            className="border-2 border-dashed border-border rounded-xl p-6 items-center"
            onPress={handlePickFile}
          >
            <IconSymbol name="arrow.up.doc.fill" size={40} color={colors.primary} />
            <Text className="text-foreground font-medium mt-3">اضغط لاختيار ملف</Text>
            <Text className="text-sm text-muted mt-1">PDF, صور, Word</Text>
          </TouchableOpacity>

          {/* Selected Files */}
          {files.length > 0 && (
            <View className="mt-4 gap-2">
              {files.map((file, index) => (
                <View 
                  key={index}
                  className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                >
                  <IconSymbol name="doc.fill" size={24} color={colors.primary} />
                  <View className="flex-1 mx-3">
                    <Text className="text-foreground font-medium" numberOfLines={1}>
                      {file.name}
                    </Text>
                    {file.size && (
                      <Text className="text-xs text-muted">{formatFileSize(file.size)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    className="w-8 h-8 items-center justify-center rounded-full bg-error/10"
                    onPress={() => handleRemoveFile(index)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-3">ملاحظات (اختياري)</Text>
          <View className="bg-surface border border-border rounded-xl">
            <TextInput
              className="p-4 text-foreground text-base"
              placeholder="أضف ملاحظات أو تعليقات..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center active:opacity-80"
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-lg">تسليم الواجب</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
