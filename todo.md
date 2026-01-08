# EduTask - Project TODO

## Setup & Configuration
- [x] Configure Firebase SDK
- [x] Setup Firebase Authentication
- [x] Setup Firestore Database
- [x] Setup Firebase Storage
- [x] Update theme colors
- [x] Generate app logo

## Authentication
- [x] Welcome screen
- [x] Login screen
- [x] Register screen with role selection
- [x] Forgot password screen
- [x] Auth state management
- [x] Protected routes

## Teacher Features
- [x] Teacher dashboard
- [x] Create class
- [x] View classes list
- [x] Class detail screen
- [x] Create assignment
- [x] View assignments list
- [x] Assignment detail screen
- [x] View submissions
- [x] Grade submission
- [x] Add feedback
- [x] View student progress
- [ ] Class reports/analytics

## Student Features
- [x] Student dashboard
- [x] Join class with code
- [x] View enrolled classes
- [x] View class assignments
- [x] View assignment details
- [x] Submit assignment
- [x] View submission status
- [x] View grades and feedback
- [x] Submissions history

## Shared Features
- [x] Tab navigation (role-based)
- [x] Notifications screen
- [x] Calendar view
- [x] Profile screen
- [x] Settings screen
- [x] Pull-to-refresh
- [x] Loading states
- [x] Error handling
- [x] Empty states

## Polish
- [x] App icon and splash screen
- [x] Haptic feedback
- [x] Animations
- [x] Dark mode support


## Bugs to Fix
- [x] Class creation not working
- [x] Teacher seeing "تسليماتي" tab (should be hidden)
- [x] Dashboard loading error
- [x] Simplify Firebase queries to avoid composite index requirements
- [x] Hide students list from class detail for students (only show assignments)
- [x] Fix calendar screen for students and teachers
- [x] Add real-time update for submissions screen after submitting
- [x] Add file upload (PDF, DOCX, images) for teachers when creating assignments
- [x] Upload assignment attachments to Firebase Storage
- [x] Upload submission files to Firebase Storage
- [x] Display uploaded files with download links

## New Issues to Fix
- [x] Fix text color contrast in role selection (dark text on dark background)
- [x] Enable RTL (right-to-left) text direction for Arabic throughout app
- [x] Fix calendar statistics - showing wrong counts for assignments


## New Features to Add
- [x] Performance reports screen for teachers (student statistics)
- [x] Direct messaging system between teachers and students
- [x] Messages screen with conversation list
- [x] Message detail screen with chat interface

## New Features in Progress
- [x] Add file/image attachments to messages
- [x] Upload attachments to Firebase Storage
- [x] Display attachments in message bubbles
- [x] Download/preview attachments from messages


## Bugs to Fix
- [x] Allow sending message with attachment only (no text)
- [x] Fix Blob conversion error when uploading attachments


## AI Assistant Feature (In Progress)
- [x] Setup Google Gemini API integration
- [x] Create AI service functions for chat
- [x] Create AI assistant chat screen
- [x] Implement context awareness with assignment content
- [x] Add streaming chat responses
- [x] Test AI assistant end-to-end
