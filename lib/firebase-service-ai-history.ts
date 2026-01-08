import { db } from './firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

export interface AIHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Timestamp;
}

export function subscribeAssignmentAIHistory(
  assignmentId: string,
  userId: string,
  callback: (messages: AIHistoryMessage[]) => void
) {
  const q = query(
    collection(
      db,
      'assignmentAIChats',
      assignmentId,
      'students',
      userId,
      'messages'
    ),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => d.data() as AIHistoryMessage);
    callback(msgs);
  });
}
