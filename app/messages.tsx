import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeConversations,
  Conversation,
} from '@/lib/firebase-service-messaging';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  /* =========================
     Realtime Conversations
  ========================= */

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const unsubscribe = subscribeConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  /* =========================
     Search Filter
  ========================= */

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.participantName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  /* =========================
     Render Item
  ========================= */

  const renderConversationItem = ({
    item,
  }: {
    item: Conversation;
  }) => (
    <TouchableOpacity
      className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center"
      onPress={() =>
        router.push(
          `/message-detail/${item.participantId}?name=${encodeURIComponent(
            item.participantName
          )}` as any
        )
      }
    >
      <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-3">
        <IconSymbol name="person.fill" size={24} color={colors.primary} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">
            {item.participantName}
          </Text>
          <Text className="text-xs text-muted">
            {format(item.lastMessageTime, 'HH:mm', { locale: ar })}
          </Text>
        </View>

        <Text
          className="text-sm text-muted mt-1"
          numberOfLines={1}
        >
          {item.lastMessage || 'لا توجد رسائل بعد'}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View className="bg-primary rounded-full w-6 h-6 items-center justify-center ml-2">
          <Text className="text-white text-xs font-bold">
            {item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  /* =========================
     UI
  ========================= */

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

    <Text className="text-2xl font-bold text-foreground">
      الرسائل
    </Text>
  </View>

  {/* Search */}
  <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 py-2">
    <IconSymbol
      name="magnifyingglass"
      size={20}
      color={colors.muted}
    />
    <TextInput
      className="flex-1 text-foreground ml-2 py-1"
      placeholder="البحث عن محادثة..."
      placeholderTextColor={colors.muted}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  </View>
</View>

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <IconSymbol
              name="bubble.left.fill"
              size={48}
              color={colors.muted}
            />
            <Text className="text-muted mt-4">
              {searchQuery
                ? 'لا توجد محادثات مطابقة'
                : 'لا توجد محادثات'}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
