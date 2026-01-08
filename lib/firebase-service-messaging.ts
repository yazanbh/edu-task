import { db } from './firebase';
import {
  collection,
  query,
  where,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  increment,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

/* =========================
   Helpers
========================= */

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

/* =========================
   Types
========================= */

export interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'file';
  size: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  read: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

/* =========================
   Send Message
========================= */

export async function sendMessage(
  senderId: string,
  senderName: string,
  recipientId: string,
  recipientName: string,
  content: string,
  attachments?: Attachment[]
) {
  if (!senderId || !recipientId || (!content && (!attachments || attachments.length === 0))) {
    throw new Error('Invalid message data');
  }

  const safeSenderName = senderName || 'مستخدم';
  const safeRecipientName = recipientName || 'مستخدم';

  const chatId = [senderId, recipientId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    {
      participants: [senderId, recipientId],
      participantNames: {
        [senderId]: safeSenderName,
        [recipientId]: safeRecipientName,
      },
lastMessage:
  content && content.trim().length > 0  ? content : attachments && attachments.length > 0  ?
                                         `📎 ${attachments.length} مرفق` : '',      updatedAt: serverTimestamp(),
      unreadCounts: {
        [recipientId]: increment(1),
      },
    },
    { merge: true }
  );

  const messageData: any = {
    senderId,
    senderName: safeSenderName,
    content,
    createdAt: serverTimestamp(),
    read: false,
  };

  if (attachments && attachments.length > 0) {
    messageData.attachments = attachments;
  }

  await addDoc(collection(chatRef, 'messages'), messageData);
}

/* =========================
   Conversations (Realtime)
========================= */

export function subscribeConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const otherId = data.participants.find(
        (id: string) => id !== userId
      );

      return {
        id: docSnap.id,
        participantId: otherId,
        participantName: data.participantNames?.[otherId] ?? 'مستخدم',
        lastMessage: data.lastMessage ?? '',
        lastMessageTime: data.updatedAt?.toDate() ?? new Date(),
        unreadCount: data.unreadCounts?.[userId] ?? 0,
      };
    });

    callback(conversations);
  });
}

/* =========================
   Messages (Realtime)
========================= */

export function subscribeMessages(
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
) {
  const chatId = getChatId(userId1, userId2);

  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((docSnap) => {
      const d = docSnap.data();

      return {
        id: docSnap.id,
        senderId: d.senderId,
        senderName: d.senderName,
        content: d.content,
        attachments: d.attachments??[],
        createdAt:
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate()
            : new Date(),
        read: d.read ?? false,
      };
    });

    callback(messages);
  });
}

/* =========================
   Mark Chat As Read
========================= */

export async function markChatAsRead(
  userId1: string,
  userId2: string,
  readerId: string
) {
  const chatId = getChatId(userId1, userId2);

  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${readerId}`]: 0,
  });
}
