# EduTask - Mobile App Interface Design

## Overview
EduTask is a comprehensive educational task management system designed for teachers and students. The app follows Apple Human Interface Guidelines (HIG) and is optimized for mobile portrait orientation (9:16) and one-handed usage.

---

## Screen List

### Authentication Screens
1. **Welcome Screen** - App introduction with login/register options
2. **Login Screen** - Email/password authentication
3. **Register Screen** - Account creation with role selection (Teacher/Student)
4. **Forgot Password Screen** - Password reset via email

### Teacher Screens
5. **Teacher Dashboard** - Overview of classes, recent submissions, quick actions
6. **My Classes** - List of all classes managed by teacher
7. **Class Detail** - Students list, assignments, class statistics
8. **Create Class** - Form to create new class with code generation
9. **Assignment List** - All assignments for a class
10. **Create Assignment** - Form with title, description, deadline, attachments
11. **Assignment Detail** - View assignment with submissions list
12. **Submission Review** - Grade and provide feedback on student work
13. **Student Progress** - Individual student performance overview
14. **Reports** - Class analytics and statistics
15. **Teacher Profile** - Account settings and preferences

### Student Screens
16. **Student Dashboard** - Upcoming deadlines, recent grades, notifications
17. **My Classes** - List of enrolled classes
18. **Class View** - Class info and assignments list
19. **Join Class** - Enter class code to join
20. **Assignment View** - Assignment details and submission area
21. **Submit Assignment** - Upload files and submit work
22. **My Submissions** - History of all submissions with grades
23. **My Grades** - Overview of all grades and feedback
24. **Student Profile** - Account settings and preferences

### Shared Screens
25. **Notifications** - All notifications list
26. **Calendar** - Deadlines and important dates
27. **Settings** - App preferences, theme, language

---

## Primary Content and Functionality

### Welcome Screen
- App logo and tagline
- "Login" button (primary)
- "Create Account" button (secondary)
- Role indicator icons (Teacher/Student)

### Login Screen
- Email input field
- Password input field with visibility toggle
- "Login" button
- "Forgot Password?" link
- "Don't have an account? Register" link

### Register Screen
- Role selection (Teacher/Student) - large toggle buttons
- Full name input
- Email input
- Password input with strength indicator
- Confirm password input
- "Create Account" button
- Terms acceptance checkbox

### Teacher Dashboard
- Welcome header with teacher name
- Quick stats cards:
  - Total Classes
  - Pending Submissions
  - This Week's Assignments
- Recent submissions list (last 5)
- Quick action buttons: Create Class, Create Assignment
- Bottom tab navigation

### My Classes (Teacher)
- Search bar
- List of class cards showing:
  - Class name
  - Subject
  - Student count
  - Active assignments count
- Floating action button to create new class

### Class Detail (Teacher)
- Class header with name, subject, class code
- Tab navigation: Students | Assignments | Reports
- Students tab: List with name, email, submission rate
- Assignments tab: List with title, deadline, submission count
- Reports tab: Charts for class performance

### Create Assignment
- Title input
- Description (multi-line)
- Deadline date/time picker
- Attachment upload (multiple files)
- Assign to class selector
- Grading type selector (P/M/D/U or Points)
- "Publish" button

### Student Dashboard
- Welcome header with student name
- Upcoming deadlines card (next 3)
- Recent grades card (last 3)
- Quick stats:
  - Enrolled Classes
  - Pending Assignments
  - Average Grade
- Notifications preview

### Assignment View (Student)
- Assignment title and class name
- Description text
- Deadline with countdown
- Attached files (downloadable)
- Submission status indicator
- "Submit Assignment" button
- Previous submission (if any)

### Submit Assignment
- File upload area (drag/drop on web, picker on mobile)
- Supported formats indicator
- Notes/comments input
- "Submit" button
- Submission confirmation

### Grading Screen (Teacher)
- Student name and submission info
- Submitted files viewer
- Grade selector (P/M/D/U)
- Feedback text area
- "Save Grade" button

---

## Key User Flows

### Teacher: Create and Publish Assignment
1. Teacher opens app → Dashboard
2. Taps "Create Assignment" or navigates to class
3. Fills assignment form (title, description, deadline)
4. Attaches reference files (optional)
5. Selects target class
6. Taps "Publish"
7. Confirmation shown → Assignment appears in class

### Student: Submit Assignment
1. Student opens app → Dashboard
2. Sees pending assignment in "Upcoming" section
3. Taps assignment → Assignment Detail screen
4. Reviews requirements and deadline
5. Taps "Submit Assignment"
6. Uploads file(s)
7. Adds optional notes
8. Taps "Submit"
9. Confirmation shown → Status changes to "Submitted"

### Teacher: Grade Submission
1. Teacher opens app → Dashboard
2. Sees pending submission in "Recent Submissions"
3. Taps submission → Submission Review screen
4. Views submitted files
5. Selects grade (P/M/D/U)
6. Writes feedback
7. Taps "Save Grade"
8. Student receives notification

### Student: Join Class
1. Student opens app → My Classes
2. Taps "Join Class" button
3. Enters class code (or scans QR)
4. Confirms class details
5. Taps "Join"
6. Class appears in "My Classes"

---

## Color Choices

### Primary Palette
- **Primary**: `#2563EB` (Blue 600) - Main actions, buttons, links
- **Primary Dark**: `#1D4ED8` (Blue 700) - Pressed states
- **Primary Light**: `#DBEAFE` (Blue 100) - Backgrounds, highlights

### Role Colors
- **Teacher Accent**: `#7C3AED` (Violet 600) - Teacher-specific elements
- **Student Accent**: `#059669` (Emerald 600) - Student-specific elements

### Status Colors
- **Success/Pass**: `#22C55E` (Green 500) - Submitted, Distinction, Merit
- **Warning**: `#F59E0B` (Amber 500) - Approaching deadline, Pass
- **Error/Late**: `#EF4444` (Red 500) - Late submission, Unclassified
- **Pending**: `#6B7280` (Gray 500) - Not submitted

### Grade Colors
- **Distinction (D)**: `#22C55E` (Green)
- **Merit (M)**: `#3B82F6` (Blue)
- **Pass (P)**: `#F59E0B` (Amber)
- **Unclassified (U)**: `#EF4444` (Red)
- **Not Submitted (NS)**: `#6B7280` (Gray)

### Neutral Colors
- **Background Light**: `#FFFFFF`
- **Background Dark**: `#111827`
- **Surface Light**: `#F9FAFB`
- **Surface Dark**: `#1F2937`
- **Text Primary Light**: `#111827`
- **Text Primary Dark**: `#F9FAFB`
- **Text Secondary**: `#6B7280`
- **Border Light**: `#E5E7EB`
- **Border Dark**: `#374151`

---

## Navigation Structure

### Tab Bar (Teacher)
1. Dashboard (home icon)
2. Classes (folder icon)
3. Calendar (calendar icon)
4. Notifications (bell icon)
5. Profile (person icon)

### Tab Bar (Student)
1. Dashboard (home icon)
2. Classes (folder icon)
3. Submissions (document icon)
4. Calendar (calendar icon)
5. Profile (person icon)

---

## Typography

- **Headings**: SF Pro Display (iOS) / Roboto (Android)
- **Body**: SF Pro Text (iOS) / Roboto (Android)
- **Sizes**:
  - H1: 28px, Bold
  - H2: 24px, Semibold
  - H3: 20px, Semibold
  - Body: 16px, Regular
  - Caption: 14px, Regular
  - Small: 12px, Regular

---

## Component Patterns

### Cards
- Rounded corners (16px)
- Subtle shadow
- White/Surface background
- 16px padding

### Buttons
- Primary: Filled with primary color, white text
- Secondary: Outlined with primary color
- Destructive: Red background
- Height: 48px (touch-friendly)
- Border radius: 12px

### Input Fields
- Height: 48px
- Border radius: 12px
- Border: 1px solid border color
- Focus: Primary color border
- Error: Red border with message below

### Lists
- FlatList for performance
- Pull-to-refresh enabled
- Empty state illustrations
- Loading skeletons

---

## Firebase Data Structure

### Collections
- `users` - User profiles with role
- `classes` - Class information
- `assignments` - Assignment details
- `submissions` - Student submissions
- `notifications` - Push notification records

### User Document
```
{
  uid: string,
  email: string,
  displayName: string,
  role: 'teacher' | 'student',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Class Document
```
{
  id: string,
  name: string,
  subject: string,
  code: string (unique),
  teacherId: string,
  studentIds: string[],
  createdAt: timestamp
}
```

### Assignment Document
```
{
  id: string,
  classId: string,
  teacherId: string,
  title: string,
  description: string,
  deadline: timestamp,
  attachments: string[],
  gradingType: 'PMDU' | 'points',
  maxPoints?: number,
  createdAt: timestamp,
  status: 'draft' | 'published' | 'closed'
}
```

### Submission Document
```
{
  id: string,
  assignmentId: string,
  studentId: string,
  classId: string,
  files: string[],
  notes: string,
  submittedAt: timestamp,
  status: 'submitted' | 'late' | 'graded',
  grade?: 'P' | 'M' | 'D' | 'U' | 'NS' | number,
  feedback?: string,
  gradedAt?: timestamp,
  gradedBy?: string
}
```
