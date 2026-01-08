import { Timestamp } from 'firebase/firestore';

export type UserRole = 'teacher' | 'student';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AssignmentStatus = 'draft' | 'published' | 'closed';
export type GradingType = 'PMDU' | 'points';

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  title: string;
  description: string;
  deadline: Timestamp;
  attachments: string[];
  gradingType: GradingType;
  maxPoints?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: AssignmentStatus;
}

export type SubmissionStatus = 'submitted' | 'late' | 'graded';
export type Grade = 'P' | 'M' | 'D' | 'U' | 'NS';

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  files: string[];
  notes: string;
  submittedAt: Timestamp;
  status: SubmissionStatus;
  grade?: Grade | number;
  feedback?: string;
  gradedAt?: Timestamp;
  gradedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'assignment' | 'submission' | 'grade' | 'deadline' | 'class';
  data?: Record<string, string>;
  read: boolean;
  createdAt: Timestamp;
}
