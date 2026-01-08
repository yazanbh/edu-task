import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Class, Assignment, Submission, User, Notification, Grade } from '@/types/firebase';

// Generate unique class code
export function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==================== CLASS FUNCTIONS ====================

export async function createClass(data: {
  name: string;
  subject: string;
  teacherId: string;
  teacherName: string;
}): Promise<string> {
  const code = generateClassCode();
  const classRef = await addDoc(collection(db, 'classes'), {
    ...data,
    code,
    studentIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return classRef.id;
}

export async function getClassById(classId: string): Promise<Class | null> {
  const docRef = doc(db, 'classes', classId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Class;
  }
  return null;
}

export async function getClassByCode(code: string): Promise<Class | null> {
  const q = query(collection(db, 'classes'), where('code', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Class;
  }
  return null;
}

// Simplified query - no orderBy to avoid composite index
export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  const q = query(
    collection(db, 'classes'), 
    where('teacherId', '==', teacherId)
  );
  const querySnapshot = await getDocs(q);
  const classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  // Sort in memory instead of using orderBy
  return classes.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc
  });
}

export async function getStudentClasses(studentId: string): Promise<Class[]> {
  const q = query(
    collection(db, 'classes'), 
    where('studentIds', 'array-contains', studentId)
  );
  const querySnapshot = await getDocs(q);
  const classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  // Sort in memory
  return classes.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc
  });
}

export async function joinClass(classId: string, studentId: string): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    studentIds: arrayUnion(studentId),
    updatedAt: serverTimestamp(),
  });
}

export async function leaveClass(classId: string, studentId: string): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    studentIds: arrayRemove(studentId),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClass(classId: string): Promise<void> {
  await deleteDoc(doc(db, 'classes', classId));
}

// ==================== ASSIGNMENT FUNCTIONS ====================

export async function createAssignment(data: {
  classId: string;
  className: string;
  teacherId: string;
  title: string;
  description: string;
  deadline: Date;
  attachments: string[];
  gradingType: 'PMDU' | 'points';
  maxPoints?: number;
  status: 'draft' | 'published';
}): Promise<string> {
  const assignmentRef = await addDoc(collection(db, 'assignments'), {
    ...data,
    deadline: Timestamp.fromDate(data.deadline),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return assignmentRef.id;
}

export async function getAssignmentById(assignmentId: string): Promise<Assignment | null> {
  const docRef = doc(db, 'assignments', assignmentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Assignment;
  }
  return null;
}

// Simplified query - no orderBy to avoid composite index
export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  const q = query(
    collection(db, 'assignments'), 
    where('classId', '==', classId)
  );
  const querySnapshot = await getDocs(q);
  const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  // Sort in memory
  return assignments.sort((a, b) => {
    const aTime = a.deadline?.toMillis?.() || 0;
    const bTime = b.deadline?.toMillis?.() || 0;
    return aTime - bTime; // asc
  });
}

// Simplified query - no orderBy to avoid composite index
export async function getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
  const q = query(
    collection(db, 'assignments'), 
    where('teacherId', '==', teacherId)
  );
  const querySnapshot = await getDocs(q);
  const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  // Sort in memory
  return assignments.sort((a, b) => {
    const aTime = a.deadline?.toMillis?.() || 0;
    const bTime = b.deadline?.toMillis?.() || 0;
    return aTime - bTime; // asc
  });
}

export async function getStudentAssignments(studentId: string): Promise<Assignment[]> {
  // First get all classes the student is in
  const classes = await getStudentClasses(studentId);
  const classIds = classes.map(c => c.id);
  
  if (classIds.length === 0) return [];
  
  // Get assignments for all classes
  const assignments: Assignment[] = [];
  for (const classId of classIds) {
    const classAssignments = await getClassAssignments(classId);
    assignments.push(...classAssignments.filter(a => a.status === 'published'));
  }
  
  // Sort by deadline
  return assignments.sort((a, b) => {
    const aTime = a.deadline?.toMillis?.() || 0;
    const bTime = b.deadline?.toMillis?.() || 0;
    return aTime - bTime;
  });
}

export async function updateAssignment(assignmentId: string, data: Partial<Assignment>): Promise<void> {
  const assignmentRef = doc(db, 'assignments', assignmentId);
  await updateDoc(assignmentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'assignments', assignmentId));
}

// ==================== SUBMISSION FUNCTIONS ====================

export async function createSubmission(data: {
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  files: string[];
  notes: string;
}): Promise<string> {
  // Check if already submitted
  const existing = await getStudentSubmission(data.assignmentId, data.studentId);
  if (existing) {
    throw new Error('Already submitted');
  }
  
  // Get assignment to check deadline
  const assignment = await getAssignmentById(data.assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  
  const now = new Date();
  const isLate = now > assignment.deadline.toDate();
  
  const submissionRef = await addDoc(collection(db, 'submissions'), {
    ...data,
    submittedAt: serverTimestamp(),
    status: isLate ? 'late' : 'submitted',
  });
  return submissionRef.id;
}

export async function getSubmissionById(submissionId: string): Promise<Submission | null> {
  const docRef = doc(db, 'submissions', submissionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Submission;
  }
  return null;
}

// Simplified query - no orderBy to avoid composite index
export async function getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  const q = query(
    collection(db, 'submissions'), 
    where('assignmentId', '==', assignmentId)
  );
  const querySnapshot = await getDocs(q);
  const submissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
  // Sort in memory
  return submissions.sort((a, b) => {
    const aTime = a.submittedAt?.toMillis?.() || 0;
    const bTime = b.submittedAt?.toMillis?.() || 0;
    return bTime - aTime; // desc
  });
}

// Simplified query - no orderBy to avoid composite index
export async function getStudentSubmissions(studentId: string): Promise<Submission[]> {
  const q = query(
    collection(db, 'submissions'), 
    where('studentId', '==', studentId)
  );
  const querySnapshot = await getDocs(q);
  const submissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
  // Sort in memory
  return submissions.sort((a, b) => {
    const aTime = a.submittedAt?.toMillis?.() || 0;
    const bTime = b.submittedAt?.toMillis?.() || 0;
    return bTime - aTime; // desc
  });
}

export async function getStudentSubmission(assignmentId: string, studentId: string): Promise<Submission | null> {
  const q = query(
    collection(db, 'submissions'), 
    where('assignmentId', '==', assignmentId),
    where('studentId', '==', studentId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Submission;
  }
  return null;
}

export async function gradeSubmission(submissionId: string, data: {
  grade: Grade | number;
  feedback: string;
  gradedBy: string;
}): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    ...data,
    status: 'graded',
    gradedAt: serverTimestamp(),
  });
}

// ==================== FILE UPLOAD ====================

export async function uploadFile(file: Blob, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadAssignmentAttachment(
  assignmentId: string,
  fileName: string,
  file: Blob
): Promise<string> {
  const path = `assignments/${assignmentId}/${Date.now()}_${fileName}`;
  return await uploadFile(file, path);
}

export async function uploadSubmissionFile(
  submissionId: string,
  fileName: string,
  file: Blob
): Promise<string> {
  const path = `submissions/${submissionId}/${Date.now()}_${fileName}`;
  return await uploadFile(file, path);
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const decodedUrl = decodeURIComponent(fileUrl);
    const pathStart = decodedUrl.indexOf('/o/') + 3;
    const pathEnd = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(pathStart, pathEnd);
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// ==================== USER FUNCTIONS ====================

export async function getUserById(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
}

export async function getClassStudents(classId: string): Promise<User[]> {
  const classData = await getClassById(classId);
  if (!classData || classData.studentIds.length === 0) return [];
  
  const students: User[] = [];
  for (const studentId of classData.studentIds) {
    const student = await getUserById(studentId);
    if (student) students.push(student);
  }
  return students;
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: 'assignment' | 'submission' | 'grade' | 'deadline' | 'class';
  data?: Record<string, string>;
}): Promise<string> {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return notificationRef.id;
}

// Simplified query - no orderBy to avoid composite index
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'), 
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  // Sort in memory
  return notifications.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // desc
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifications = await getUserNotifications(userId);
  for (const notification of notifications) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  }
}

// ==================== STATISTICS ====================

export async function getTeacherStats(teacherId: string): Promise<{
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingSubmissions: number;
}> {
  const classes = await getTeacherClasses(teacherId);
  const assignments = await getTeacherAssignments(teacherId);
  
  let totalStudents = 0;
  let pendingSubmissions = 0;
  
  for (const cls of classes) {
    totalStudents += cls.studentIds.length;
  }
  
  for (const assignment of assignments) {
    const submissions = await getAssignmentSubmissions(assignment.id);
    pendingSubmissions += submissions.filter(s => s.status !== 'graded').length;
  }
  
  return {
    totalClasses: classes.length,
    totalStudents,
    totalAssignments: assignments.length,
    pendingSubmissions,
  };
}

export async function getStudentStats(studentId: string): Promise<{
  totalClasses: number;
  pendingAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
}> {
  const classes = await getStudentClasses(studentId);
  const submissions = await getStudentSubmissions(studentId);
  const assignments = await getStudentAssignments(studentId);
  
  const submittedIds = new Set(submissions.map(s => s.assignmentId));
  const pendingAssignments = assignments.filter(a => !submittedIds.has(a.id)).length;
  
  return {
    totalClasses: classes.length,
    pendingAssignments,
    submittedAssignments: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
    gradedAssignments: submissions.filter(s => s.status === 'graded').length,
  };
}
