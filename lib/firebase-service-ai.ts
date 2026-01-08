import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app, 'us-central1');

export interface AssignmentAIRequest {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentDeadline?: string;
  attachmentContents?: string[];
  message: string;
}

export async function askAssignmentAI(
  data: AssignmentAIRequest
): Promise<string> {
  const fn = httpsCallable<AssignmentAIRequest, { reply: string }>(
    functions,
    'assignmentAI'
  );

  const res = await fn(data);
  return res.data.reply;
}
