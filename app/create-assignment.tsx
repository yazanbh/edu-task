import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import { createAssignment, getTeacherClasses, createNotification, uploadAssignmentAttachment } from '@/lib/firebase-service';
import { Class } from '@/types/firebase';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SelectedFile {
  name: string;
  uri: string;
  size?: number;
  type: 'document' | 'image';
  mimeType?: string;
}

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const { classId: preselectedClassId } = useLocalSearchParams<{ classId?: string }>();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [classes, setClasses] = useState<Class[]>([]);
  const [deadline, setDeadline] = useState(addDays(new Date(), 7));
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [attachments, setAttachments] = useState<SelectedFile[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [user, authLoading]);

  const loadClasses = async () => {
    // Wait for auth and ensure user has uid
    if (authLoading) return;
    if (!user || !user.uid) {
      setLoadingClasses(false);
      return;
    }
    try {
      const data = await getTeacherClasses(user.uid);
      setClasses(data);
      if (preselectedClassId) {
        setSelectedClassId(preselectedClassId);
      } else if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handlePickDocument = async () => {
    setShowAttachmentOptions(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: SelectedFile[] = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          type: 'document',
          mimeType: asset.mimeType,
        }));
        setAttachments([...attachments, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الملف');
    }
  };

  const handlePickImage = async () => {
    setShowAttachmentOptions(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles: SelectedFile[] = result.assets.map((asset: ImagePicker.ImagePickerAsset, index: number) => ({
          name: `صورة_${attachments.length + index + 1}.jpg`,
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',
        }));
        setAttachments([...attachments, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: SelectedFile) => {
    if (file.type === 'image') return 'photo.fill';
    if (file.mimeType?.includes('pdf')) return 'doc.fill';
    if (file.mimeType?.includes('word')) return 'doc.fill';
    return 'doc.fill';
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الواجب');
      return;
    }

    if (!selectedClassId) {
      Alert.alert('خطأ', 'يرجى اختيار الصف');
      return;
    }

    // Ensure user exists with uid
    if (!user || !user.uid || !selectedClass) {
      Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      // First create the assignment to get its ID
      const assignmentId = await createAssignment({
        classId: selectedClassId,
        className: selectedClass.name,
        teacherId: user.uid,
        title: title.trim(),
        description: description.trim(),
        deadline: deadline,
        attachments: [],
        gradingType: 'PMDU',
        status: 'published',
      });

      // Upload attachments to Firebase Storage
      const attachmentUrls: string[] = [];
      for (const attachment of attachments) {
        try {
          for (const attachment of attachments) {
  try {
    let blob: Blob;

    if (Platform.OS === 'web') {
      // ✅ Web
      const response = await fetch(attachment.uri);
      blob = await response.blob();
    } else {
      // ✅ Mobile (Android / iOS)
      const fileData = await FileSystem.readAsStringAsync(attachment.uri, {
        encoding: 'base64',
      });

      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      blob = new Blob([bytes], {
        type: attachment.mimeType || 'application/octet-stream',
      });
    }

    const url = await uploadAssignmentAttachment(
      assignmentId,
      attachment.name,
      blob
    );

    attachmentUrls.push(url);
  } catch (error) {
    console.error('Error uploading attachment:', error);
  }
}

        } catch (error) {
          console.error('Error uploading attachment:', error);
        }
      }

      // Update assignment with attachment URLs if any were uploaded
      if (attachmentUrls.length > 0) {
        await updateDoc(doc(db, 'assignments', assignmentId), {
          attachments: attachmentUrls,
        });
      }

      // Send notifications to all students in the class
      for (const studentId of selectedClass.studentIds) {
        await createNotification({
          userId: studentId,
          title: 'واجب جديد',
          body: `تم نشر واجب جديد: ${title.trim()}`,
          type: 'assignment',
          data: { assignmentId, classId: selectedClassId },
        });
      }
      
      Alert.alert('تم', 'تم إنشاء الواجب بنجاح', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating assignment:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الواجب');
    } finally {
      setLoading(false);
    }
  };

  const adjustDeadline = (days: number) => {
    setDeadline(addDays(new Date(), days));
  };

  if (authLoading || loadingClasses) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-6">
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
              >
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">إنشاء واجب جديد</Text>
            </View>

            {/* Class Picker Modal */}
            {showClassPicker && (
              <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center p-6">
                <View className="bg-background rounded-2xl p-4 w-full max-w-sm max-h-96">
                  <Text className="text-xl font-bold text-foreground mb-4">اختر الصف</Text>
                  <ScrollView>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        className={`p-4 rounded-xl mb-2 border ${
                          selectedClassId === cls.id ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                        }`}
                        onPress={() => {
                          setSelectedClassId(cls.id);
                          setShowClassPicker(false);
                        }}
                      >
                        <Text className={`font-semibold ${selectedClassId === cls.id ? 'text-primary' : 'text-foreground'}`}>
                          {cls.name}
                        </Text>
                        <Text className="text-sm text-muted">{cls.subject}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    className="mt-4 py-3 border border-border rounded-xl items-center"
                    onPress={() => setShowClassPicker(false)}
                  >
                    <Text className="text-foreground font-semibold">إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Attachment Options Modal */}
            {showAttachmentOptions && (
              <View className="absolute inset-0 bg-black/50 z-50 items-center justify-end p-6">
                <View className="bg-background rounded-2xl p-4 w-full max-w-sm">
                  <Text className="text-xl font-bold text-foreground mb-4 text-center">إضافة مرفق</Text>
                  
                  <TouchableOpacity
                    className="flex-row items-center p-4 bg-surface rounded-xl mb-3 border border-border"
                    onPress={handlePickDocument}
                  >
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                      <IconSymbol name="doc.fill" size={24} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">ملف PDF أو Word</Text>
                      <Text className="text-sm text-muted">اختر ملف من جهازك</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-row items-center p-4 bg-surface rounded-xl mb-3 border border-border"
                    onPress={handlePickImage}
                  >
                    <View className="w-12 h-12 bg-success/10 rounded-full items-center justify-center mr-4">
                      <IconSymbol name="photo.fill" size={24} color={colors.success} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">صورة</Text>
                      <Text className="text-sm text-muted">اختر صورة من المعرض</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="py-3 border border-border rounded-xl items-center mt-2"
                    onPress={() => setShowAttachmentOptions(false)}
                  >
                    <Text className="text-foreground font-semibold">إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Form */}
            <View className="gap-4">
              {/* Class Selection */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">الصف</Text>
                <TouchableOpacity
                  className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-4"
                  onPress={() => setShowClassPicker(true)}
                >
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="folder.fill" size={20} color={colors.muted} />
                    <Text className={selectedClass ? 'text-foreground' : 'text-muted'}>
                      {selectedClass ? selectedClass.name : 'اختر الصف'}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">عنوان الواجب</Text>
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                  <IconSymbol name="doc.fill" size={20} color={colors.muted} />
                  <TextInput
                    className="flex-1 py-4 px-3 text-foreground text-base"
                    placeholder="أدخل عنوان الواجب"
                    placeholderTextColor={colors.muted}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              {/* Description */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">الوصف والتعليمات</Text>
                <View className="bg-surface border border-border rounded-xl px-4">
                  <TextInput
                    className="py-4 text-foreground text-base"
                    placeholder="أدخل وصف الواجب والتعليمات..."
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ minHeight: 100 }}
                  />
                </View>
              </View>

              {/* Attachments */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">المرفقات (اختياري)</Text>
                
                {/* Add Attachment Button */}
                <TouchableOpacity
                  className="border-2 border-dashed border-border rounded-xl p-4 items-center mb-3"
                  onPress={() => setShowAttachmentOptions(true)}
                >
                  <IconSymbol name="plus" size={24} color={colors.primary} />
                  <Text className="text-primary font-medium mt-2">إضافة ملف أو صورة</Text>
                  <Text className="text-xs text-muted mt-1">PDF, Word, صور</Text>
                </TouchableOpacity>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <View className="gap-2">
                    {attachments.map((file, index) => (
                      <View 
                        key={index}
                        className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                      >
                        {file.type === 'image' ? (
                          <Image 
                            source={{ uri: file.uri }} 
                            className="w-12 h-12 rounded-lg mr-3"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-12 h-12 bg-primary/10 rounded-lg items-center justify-center mr-3">
                            <IconSymbol name={getFileIcon(file)} size={24} color={colors.primary} />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-foreground font-medium" numberOfLines={1}>
                            {file.name}
                          </Text>
                          {file.size && (
                            <Text className="text-xs text-muted">{formatFileSize(file.size)}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          className="w-8 h-8 items-center justify-center rounded-full bg-error/10"
                          onPress={() => handleRemoveAttachment(index)}
                        >
                          <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Deadline */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">الموعد النهائي</Text>
                <View className="bg-surface border border-border rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <IconSymbol name="calendar" size={20} color={colors.primary} />
                    <Text className="text-foreground font-semibold">
                      {format(deadline, 'EEEE, d MMMM yyyy', { locale: ar })}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    {[1, 3, 7, 14].map((days) => (
                      <TouchableOpacity
                        key={days}
                        className={`flex-1 py-2 rounded-lg ${
                          Math.round((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === days
                            ? 'bg-primary'
                            : 'bg-border/50'
                        }`}
                        onPress={() => adjustDeadline(days)}
                      >
                        <Text className={`text-center text-sm ${
                          Math.round((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === days
                            ? 'text-white font-semibold'
                            : 'text-muted'
                        }`}>
                          {days === 1 ? 'غداً' : `${days} أيام`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center mt-4 active:opacity-80"
                onPress={handleCreate}
                disabled={loading || !user?.uid}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-lg">نشر الواجب</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
