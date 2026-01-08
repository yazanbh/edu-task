import React, { useState, useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Image,
  Dimensions,
  Modal,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeMessages,
  sendMessage,
  markChatAsRead,
  Message,
  Attachment,
} from '@/lib/firebase-service-messaging';
import { uploadFile } from '@/lib/firebase-service';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function MessageDetailScreen() {
  const { participantId, name } = useLocalSearchParams<{
    participantId: string;
    name?: string;
  }>();

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const screenHeight = Dimensions.get('window').height;
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
  .onUpdate((e) => {
    scale.value = Math.max(1, e.scale);
  })
  .onEnd(() => {
    if (scale.value < 1) {
      scale.value = withSpring(1);
    }
  });

const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    if (e.translationY > 0 && scale.value === 1) {
      translateY.value = e.translationY;
      opacity.value = 1 - e.translationY / 400;
    }
  })
  .onEnd(() => {
    if (translateY.value > 160) {
      runOnJS(setPreviewImage)(null);
      translateY.value = 0;
      opacity.value = 1;
    } else {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
    }
  });
  const composedGesture = Gesture.Simultaneous(
  panGesture,
  pinchGesture
);
  const imageStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: translateY.value },
    { scale: scale.value },
  ],
}));

const blurStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));


  useEffect(() => {
    if (!user?.uid || !participantId) return;

    const unsubscribe = subscribeMessages(
      user.uid,
      participantId,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );

    markChatAsRead(user.uid, participantId, user.uid);

    return () => unsubscribe();
  }, [user?.uid, participantId]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          const fileName = asset.uri.split('/').pop() || `image_${Date.now()}.jpg`;

          const newAttachment: Attachment = {
            name: fileName,
            url: asset.uri,
            type: 'image',
            size: (fileInfo as any).size || 0,
          };

          setSelectedAttachments((prev) => [...prev, newAttachment]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'فشل اختيار الصورة');
    }
  };

  const pickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const fileName = asset.uri.split('/').pop() || `file_${Date.now()}`;

        const newAttachment: Attachment = {
          name: fileName,
          url: asset.uri,
          type: 'file',
          size: (fileInfo as any).size || 0,
        };

        setSelectedAttachments((prev) => [...prev, newAttachment]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('خطأ', 'فشل اختيار الملف');
    }
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSend = async () => {
    if ((!text.trim() && selectedAttachments.length === 0) || !user?.uid) return;

    setSending(true);
    try {
      const senderName =
        user.displayName && user.displayName.trim().length > 0
          ? user.displayName
          : user.email ?? 'مستخدم';

      const recipientNameSafe =
        typeof name === 'string' && name.trim().length > 0 ? name : 'مستخدم';

      // Upload attachments to Firebase Storage
      const uploadedAttachments: Attachment[] = [];

    for (const attachment of selectedAttachments) {
  try {
    const response = await fetch(attachment.url);
    const blob = await response.blob();

    const uploadedUrl = await uploadFile(
      blob,
      `messages/${user.uid}/${participantId}/${Date.now()}_${attachment.name}`
    );

    uploadedAttachments.push({
      name: attachment.name,
      url: uploadedUrl,
      type: attachment.type,
      size: attachment.size,
    });
  } catch (error) {
    console.error(`Error uploading ${attachment.name}:`, error);
  }
}

      // Send message with attachments
      await sendMessage(
        user.uid,
        senderName,
        participantId,
        recipientNameSafe,
        text || '',
        uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      );

      setText('');
      setSelectedAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('خطأ', 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;

    return (
      <View className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'} px-4`}>
        {!isOwn && (
          <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
            <IconSymbol name="person.fill" size={16} color={colors.primary} />
          </View>
        )}

        <View className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Text Content */}
          {item.content && (
            <View
              className={`rounded-2xl px-4 py-2 mb-1 ${
                isOwn ? 'bg-primary' : 'bg-surface border border-border'
              }`}
            >
              <Text className={`text-base ${isOwn ? 'text-white' : 'text-foreground'}`}>
                {item.content}
              </Text>
            </View>
          )}

          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            
  <View className={`gap-2 ${item.content ? 'mt-2' : ''}`}>
    {item.attachments.map((att, idx) => {
      
      // 🟢 صورة
      if (att.type === 'image') {
        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() => setPreviewImage(att.url)}
          >
            <View
              className={`rounded-2xl overflow-hidden ${
                isOwn ? 'bg-primary/20' : 'bg-surface border border-border'
              }`}
            >
              <Image
                source={{ uri: att.url }}
                style={{
                  width: 220,
                  height: 220,
                }}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        );
      }

      // 🔵 ملف عادي
      return (
        <TouchableOpacity
          key={idx}
          className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${
            isOwn ? 'bg-primary/20' : 'bg-surface border border-border'
          }`}
          onPress={() => Linking.openURL(att.url)}
        >
          <IconSymbol name="doc.fill" size={18} color={colors.primary} />
          <View className="flex-1">
            <Text
              className={`text-sm font-medium ${
                isOwn ? 'text-primary' : 'text-foreground'
              }`}
              numberOfLines={1}
            >
              {att.name}
            </Text>
            <Text className="text-xs text-muted">
              {(att.size / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
)}

          {/* Timestamp */}
          <Text
            className={`text-xs mt-1 ${
              isOwn ? 'text-white/70' : 'text-muted'
            }`}
          >
            {new Date(item.createdAt).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isOwn && (
          <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center ml-2">
            <IconSymbol name="person.fill" size={16} color={colors.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScreenContainer className="flex-1">
        {/* Header */}
        <View className="p-4 border-b border-border flex-row items-center">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{name}</Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View className="items-center py-8">
              <IconSymbol name="bubble.left.fill" size={48} color={colors.muted} />
              <Text className="text-muted mt-4">لا توجد رسائل</Text>
            </View>
          }
        />

        {/* Selected Attachments Preview */}
        {selectedAttachments.length > 0 && (
          <View className="border-t border-border bg-surface p-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedAttachments.map((att, idx) => (
                <View
                  key={idx}
                  className="bg-background rounded-lg p-2 mr-2 flex-row items-center gap-2"
                >
                  <IconSymbol
                    name={att.type === 'image' ? 'photo.fill' : 'doc.fill'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text className="text-sm text-foreground max-w-xs" numberOfLines={1}>
                    {att.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeAttachment(idx)}>
                    <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
{/* Fullscreen Image Preview with Blur */}
<Modal
  visible={!!previewImage}
  transparent
  animationType="fade"
  onRequestClose={() => setPreviewImage(null)}
>
  <TouchableOpacity
    activeOpacity={1}
    onPress={() => setPreviewImage(null)}
    style={{ flex: 1 }}
  >
    {/* Blur Background */}
    <BlurView
      intensity={60}
      tint="dark"
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Image Container (prevent closing when tapping image) */}
      <TouchableOpacity activeOpacity={1}>
        <Image
          source={{ uri: previewImage ?? '' }}
          style={{
            width: Dimensions.get('window').width * 0.95,
            height: Dimensions.get('window').height * 0.75,
            borderRadius: 16,
          }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Bottom Close Hint */}
      <Text
        style={{
          marginTop: 16,
          color: '#E5E7EB',
          fontSize: 14,
          opacity: 0.8,
        }}
      >
        اضغط خارج الصورة للإغلاق
      </Text>
    </BlurView>
  </TouchableOpacity>
</Modal>

<Modal
  visible={!!previewImage}
  transparent
  animationType="fade"
>
  <Animated.View style={[{ flex: 1 }, blurStyle]}>
    <BlurView
      intensity={80}
      tint="dark"
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.Image
          source={{ uri: previewImage ?? '' }}
          style={[
            {
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height * 0.8,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </GestureDetector>

      <Text style={{ color: '#ccc', marginTop: 12 }}>
        اسحب للأسفل للإغلاق
      </Text>
    </BlurView>
  </Animated.View>
</Modal>



        {/* Input Area */}
        <View className="p-4 border-t border-border gap-2">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
              onPress={pickImage}
              disabled={sending}
            >
              <IconSymbol name="photo.fill" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
              onPress={pickFile}
              disabled={sending}
            >
              <IconSymbol name="doc.fill" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              className="flex-1 bg-surface border border-border rounded-full px-4 py-3 text-foreground"
              placeholder="اكتب رسالة..."
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              editable={!sending}
              multiline
            />

            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center ${
                (text.trim() || selectedAttachments.length > 0) && !sending
                  ? 'bg-primary'
                  : 'bg-muted/20'
              }`}
              onPress={onSend}
              disabled={(!text.trim() && selectedAttachments.length === 0) || sending}
            >
              {sending ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <IconSymbol
                  name="paperplane.fill"
                  size={18}
                  color={
                    (text.trim() || selectedAttachments.length > 0) && !sending
                      ? '#FFFFFF'
                      : colors.muted
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
    
  );
}
