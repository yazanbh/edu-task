import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

/* =========================
   Firebase Admin Init
========================= */
initializeApp();
const db = getFirestore();

/* =========================
   Secrets
========================= */
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/* =========================
   Types
========================= */
interface AssignmentAIRequest {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentDeadline?: string;
  attachmentContents?: string[];
  message: string;
}

/* =========================
   Helpers
========================= */
async function extractAttachmentText(name?: string | null): Promise<string> {
  if (!name || typeof name !== 'string') {
    return '';
  }

  if (name.endsWith('.pdf')) {
    return `📄 محتوى مستخرج من ملف PDF: ${name}`;
  }

  if (/\.(jpg|jpeg|png)$/i.test(name)) {
    return `🖼️ نص مستخرج من صورة (OCR): ${name}`;
  }

  return '';
}

/* =========================
   Cloud Function
========================= */
export const assignmentAI = onCall(
  {
    region: 'us-central1',
    secrets: [GEMINI_API_KEY],
  },
  async (request) => {
    /* 🔐 Auth */
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      assignmentId,
      assignmentTitle,
      assignmentDescription,
      assignmentDeadline,
      attachmentContents,
      message,
    } = request.data as AssignmentAIRequest;

    if (!assignmentId || !assignmentTitle || !assignmentDescription || !message) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      /* 📎 Prepare attachments text */
      const extractedAttachments: string[] = [];

      if (attachmentContents?.length) {
        for (const name of attachmentContents ?? []) {
            const text = await extractAttachmentText(name);
            if (text && text.trim()) {
              extractedAttachments.push(text);
            }
          }

      }

      /* 🤖 Load Gemini */
      const ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY.value(),
      });

      /* 🧾 System Prompt */
      const systemPrompt = `
أنت مساعد تعليمي ذكي ومتخصص بمساعدة الطلاب على فهم الواجبات الدراسية.

📘 معلومات الواجب:
- العنوان: ${assignmentTitle}
- الوصف: ${assignmentDescription}
${assignmentDeadline ? `- الموعد النهائي: ${assignmentDeadline}` : ''}

${extractedAttachments.length ? `
📎 مواد مرفقة:
${extractedAttachments.join('\n---\n')}
` : ''}

🎯 قواعد صارمة:
- لا تعطِ الحل النهائي مباشرة
- وجّه الطالب خطوة بخطوة
- شجّع التفكير والتحليل
- اشرح الفكرة وليس الجواب
- استخدم اللغة العربية فقط
`;

const list = await ai.models.list();
console.log("AVAILABLE MODELS:", list);

      /* 🤖 Gemini Call */
const result = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "user", parts: [{ text: message }] },
  ],
});

/* استخراج النص مباشرة */
const reply = typeof result.text === "string" ? result.text : "";


      /* 💾 Save History */
      const messagesRef = db
        .collection('assignmentAIChats')
        .doc(assignmentId)
        .collection('students')
        .doc(request.auth.uid)
        .collection('messages');

      await messagesRef.add({
        role: 'user',
        content: message,
        createdAt: FieldValue.serverTimestamp(),
      });

      await messagesRef.add({
        role: 'assistant',
        content: reply,
        createdAt: FieldValue.serverTimestamp(),
      });

      /* ✅ Response */
      return { reply };

    } catch (err: any) {

      /* تحسين عرض الخطأ للتشخيص */
      console.error('[assignmentAI ERROR]', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response,
      });

      throw new HttpsError(
        'internal',
        'حدث خطأ أثناء معالجة طلب المساعد الذكي'
      );
    }
  }
);
