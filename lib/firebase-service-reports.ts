import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { Assignment, Submission, User, Grade } from '@/types/firebase';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  averageGrade: number;
  lateSubmissions: number;
  pendingAssignments: number;
  grades: Array<{
    assignmentId: string;
    assignmentName: string;
    grade: any;
    submittedAt: Date | null;
    deadline: Date;
    isLate: boolean;
  }>;
}

export interface ClassReport {
  classId: string;
  className: string;
  totalStudents: number;
  totalAssignments: number;
  averageClassGrade: number;
  studentPerformance: StudentPerformance[];
}

export async function getStudentPerformance(
  classId: string,
  studentId: string
): Promise<StudentPerformance | null> {
  try {
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) return null;

    const student = studentDoc.data() as User;

    // ✅ get assignments (global)
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('classId', '==', classId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Assignment[];

    // ✅ get submissions (global)
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('classId', '==', classId),
      where('studentId', '==', studentId)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const studentSubmissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Submission[];

    let totalGrades = 0;
    let gradedCount = 0;
    let lateSubmissions = 0;
    let submittedCount = studentSubmissions.length;

    const grades = assignments.map((assignment) => {
      const submission = studentSubmissions.find(
        s => s.assignmentId === assignment.id
      );

      const deadline =
        assignment.deadline instanceof Timestamp
          ? assignment.deadline.toDate()
          : new Date(assignment.deadline);

      const submittedAt =
        submission?.submittedAt instanceof Timestamp
          ? submission.submittedAt.toDate()
          : submission?.submittedAt
            ? new Date(submission.submittedAt)
            : null;

      const isLate = submittedAt ? submittedAt > deadline : false;

      if (isLate) lateSubmissions++;

      if (submission?.grade) {
        gradedCount++;
        const gradeValue =
          submission.grade === 'D' ? 4 :
          submission.grade === 'M' ? 3 :
          submission.grade === 'P' ? 2 : 1;
        totalGrades += gradeValue;
      }

      return {
        assignmentId: assignment.id,
        assignmentName: assignment.title,
        grade: submission?.grade ?? null,
        submittedAt,
        deadline,
        isLate,
      };
    });

    const pendingAssignments = assignments.length - submittedCount;
    const averageGrade =
      gradedCount > 0 ? totalGrades / gradedCount : 0;

    return {
      studentId,
      studentName: student.displayName,
      studentEmail: student.email,
      totalAssignments: assignments.length,
      submittedAssignments: submittedCount,
      gradedAssignments: gradedCount,
      averageGrade: Number(averageGrade.toFixed(2)),
      lateSubmissions,
      pendingAssignments,
      grades,
    };
  } catch (error) {
    console.error('Error getting student performance:', error);
    return null;
  }
}

// Get class report with all students' performance
export async function getClassReport(classId: string): Promise<ClassReport | null> {
  try {
    const classDoc = await getDoc(doc(db, 'classes', classId));
    if (!classDoc.exists()) return null;

    const classData = classDoc.data() as any;
    const classStudents: string[] = classData.studentIds || [];

    // assignments (global)
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('classId', '==', classId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Assignment[];

    // ✅ parallel execution
    const performances = await Promise.all(
      classStudents.map((studentId: string) =>
        getStudentPerformance(classId, studentId)
      )
    );

    const studentPerformance: StudentPerformance[] = performances.filter(
      (p): p is StudentPerformance => p !== null
    );

    let totalGrades = 0;
    let totalGradedAssignments = 0;

    studentPerformance.forEach(p => {
      totalGrades += p.averageGrade * p.gradedAssignments;
      totalGradedAssignments += p.gradedAssignments;
    });

    const averageClassGrade =
      totalGradedAssignments > 0
        ? totalGrades / totalGradedAssignments
        : 0;

    return {
      classId,
      className: classData.name,
      totalStudents: classStudents.length,
      totalAssignments: assignments.length,
      averageClassGrade: Number(averageClassGrade.toFixed(2)),
      studentPerformance,
    };
  } catch (error) {
    console.error('Error getting class report:', error);
    return null;
  }
}
