import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';

import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { cn } from '@/lib/utils';

import { getAssignmentById } from '@/lib/firebase-service';
import { askAssignmentAI } from '@/lib/firebase-service-ai';
import {
  subscribeAssignmentAIHistory,
  AIHistoryMessage,
} from '@/lib/firebase-service-ai-history';

/* ===============================
   Helpers
=============================== */
function normalizeDate(value?: Date | Timestamp): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : value;
}


/* ===============================
   Types
=============================== */
type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type AssignmentContext = {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  attachmentContents: string[];
};

/* ===============================
   Component
=============================== */
export default function AssignmentAIAssistant() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { user } = useAuth(); // user.id: number
  const router = useRouter();
  const colors = useColors();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentContext | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  /* ===============================
     Init – Assignment + History
  =============================== */
  console.log('[Auth]', user);
  if (!loading && !user) {
  return (
    <ScreenContainer className="items-center justify-center">
      <Text className="text-muted">
        يجب تسجيل الدخول لاستخدام المساعد الذكي
      </Text>
    </ScreenContainer>
  );
}
  useEffect(() => {
    if (!assignmentId || !user?.uid) {
      setInitializing(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const data = await getAssignmentById(assignmentId);

        if (!data) {
          setError('لم يتم العثور على الواجب');
          return;
        }

        const deadline = normalizeDate(data.deadline);

        const context: AssignmentContext = {
          id: assignmentId,
          title: data.title,
          description: data.description,
          deadline: deadline
            ? deadline.toLocaleDateString('ar-SA')
            : undefined,
          attachmentContents: data.attachments
            ? data.attachments.map((a: any) => a.name)
            : [],
        };

        setAssignment(context);

        // 🔥 Subscribe to Firestore History
        unsubscribe = subscribeAssignmentAIHistory(
          assignmentId,
          String(user.uid), // ✅ FIX 2
          (history: AIHistoryMessage[]) => {
            if (history.length > 0) {
              // ✅ FIX 1 — Map Firestore → UI model
              const mapped: AIMessage[] = history.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp:
                  m.createdAt instanceof Timestamp
                    ? m.createdAt.toMillis()
                    : Date.now(),
              }));

              setMessages(mapped);
            } else {
              setMessages([
                {
                  role: 'assistant',
                  content: `مرحباً 👋  
أنا مساعدك الذكي لهذا الواجب 📚

📌 العنوان: ${context.title}

اسألني عن:
• شرح المطلوب  
• كيفية البدء  
• أفكار للحل  
• فهم التعليمات  

سأساعدك بدون إعطائك الحل مباشرة.`,
                  timestamp: Date.now(),
                },
              ]);
            }
          }
        );
      } catch {
        setError('فشل تحميل بيانات الواجب');
      } finally {
        setInitializing(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [assignmentId, user?.uid]);

  /* ===============================
     Auto Scroll
  =============================== */
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  /* ===============================
     Send Message
  =============================== */
  const sendMessage = async () => {
    if (!input.trim() || loading || !assignment || !user?.uid) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      await askAssignmentAI({
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        assignmentDescription: assignment.description,
        assignmentDeadline: assignment.deadline,
        attachmentContents: assignment.attachmentContents,
        message: userMessage.content,
      });
      // 🔁 AI reply arrives via Firestore subscription
    } catch {
      setError('حدث خطأ أثناء التواصل مع المساعد الذكي');
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Loading
  =============================== */
  if (initializing) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">جاري تهيئة المساعد الذكي…</Text>
      </ScreenContainer>
    );
  }

  /* ===============================
     UI
  =============================== */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScreenContainer className="flex-1">
        {/* Header */}
        <View className="flex-row items-center border-b border-border pb-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-foreground">
            المساعد الذكي
          </Text>
          <View className="w-8" />
        </View>

        {/* Chat */}
        <ScrollView ref={scrollRef} className="flex-1">
          {messages.map((m, i) => (
            <View
              key={i}
              className={cn(
                'mb-3 flex-row',
                m.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <View
                className={cn(
                  'max-w-xs rounded-2xl px-4 py-3',
                  m.role === 'user'
                    ? 'bg-primary'
                    : 'bg-surface border border-border'
                )}
              >
                <Text
                  className={cn(
                    m.role === 'user'
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && <ActivityIndicator size="small" />}
          {error && (
            <Text className="text-error text-sm mt-2">{error}</Text>
          )}
        </ScrollView>

        {/* Input */}
        <View className="flex-row gap-2 border-t text-foreground border-border pt-4"
          style={{ paddingBottom: 30 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اسأل عن الواجب..."
            className="flex-1 bg-surface border text-foreground border-border rounded-full px-4 py-3"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 rounded-full bg-primary"
          >
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}