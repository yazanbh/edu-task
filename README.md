# EduTask - نظام إدارة المهام التعليمية

تطبيق موبايل متقدم لإدارة المهام التعليمية بين المعلمين والطلاب، مع دعم كامل لـ Firebase والتخزين السحابي.

## المتطلبات

قبل البدء، تأكد من تثبيت البرامج التالية على جهازك:

- **Node.js**: الإصدار 18 أو أحدث ([تحميل](https://nodejs.org/))
- **npm** أو **pnpm**: مدير الحزم (يأتي مع Node.js)
- **Git**: نظام التحكم بالإصدارات ([تحميل](https://git-scm.com/))
- **Expo CLI**: للتطوير والاختبار (سيتم تثبيته تلقائياً)

## المكتبات الرئيسية المستخدمة

### Frontend
| المكتبة | الإصدار | الغرض |
|--------|--------|-------|
| React Native | 0.81.5 | إطار العمل الأساسي للتطبيق |
| Expo | 54.0.29 | منصة التطوير والاختبار |
| Expo Router | 6.0.19 | نظام التوجيه والملاحة |
| NativeWind | 4.2.1 | Tailwind CSS لـ React Native |
| React 19 | 19.1.0 | مكتبة واجهات المستخدم |

### Firebase
| المكتبة | الإصدار | الغرض |
|--------|--------|-------|
| Firebase | 11.6.0 | مجموعة خدمات Firebase |
| Firebase Auth | - | نظام المصادقة والتسجيل |
| Firestore | - | قاعدة البيانات السحابية |
| Firebase Storage | - | تخزين الملفات السحابي |

### أدوات إضافية
| المكتبة | الغرض |
|--------|-------|
| date-fns | معالجة التواريخ والأوقات |
| expo-image-picker | اختيار الصور والملفات |
| expo-file-system | إدارة الملفات المحلية |
| TanStack React Query | إدارة حالة البيانات |

## التثبيت والإعداد

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd edutask
```

### 2. تثبيت المكتبات

```bash
# باستخدام pnpm (موصى به)
pnpm install

# أو باستخدام npm
npm install
```

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع وأضف بيانات Firebase:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBQabTWeZkhvtBe6_YKBv4mGdPfrWeU4ro
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=edutask-eed99.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=edutask-eed99
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=edutask-eed99.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=597188434856
EXPO_PUBLIC_FIREBASE_APP_ID=1:597188434856:web:706a8d55f8520815539b9d
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-C0TN12ELB3
```

### 4. تشغيل التطبيق

```bash
# بدء خادم التطوير
pnpm dev

# أو لتطبيق معين
pnpm dev:metro    # للموبايل
pnpm dev:server   # لخادم الـ API
```

## تشغيل التطبيق على أجهزة مختلفة

### على جهاز Android

**الطريقة 1: استخدام Expo Go**
1. ثبّت تطبيق [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) من Google Play
2. شغّل `pnpm dev`
3. امسح رمز QR بكاميرا هاتفك أو من تطبيق Expo Go

**الطريقة 2: البناء المباشر**
```bash
pnpm android
```

### على جهاز iOS

```bash
pnpm ios
```

### على المتصفح (Web)

```bash
pnpm dev
# سيفتح التطبيق تلقائياً على http://localhost:8081
```

## هيكل المشروع

```
edutask/
├── app/                          # شاشات التطبيق
│   ├── (auth)/                   # شاشات المصادقة
│   │   ├── index.tsx             # شاشة الترحيب
│   │   ├── login.tsx             # تسجيل الدخول
│   │   ├── register.tsx          # إنشاء حساب
│   │   └── forgot-password.tsx   # استرجاع كلمة المرور
│   ├── (tabs)/                   # الشاشات الرئيسية
│   │   ├── index.tsx             # لوحة التحكم
│   │   ├── classes.tsx           # الصفوف
│   │   ├── submissions.tsx       # التسليمات
│   │   ├── calendar.tsx          # التقويم
│   │   └── profile.tsx           # الملف الشخصي
│   ├── class/[id].tsx            # تفاصيل الصف
│   ├── assignment/[id].tsx       # تفاصيل الواجب
│   ├── create-class.tsx          # إنشاء صف جديد
│   ├── create-assignment.tsx     # إنشاء واجب جديد
│   └── submit-assignment/[id].tsx # تسليم واجب
├── components/                   # مكونات قابلة لإعادة الاستخدام
│   ├── screen-container.tsx      # حاوية الشاشة الآمنة
│   └── ui/                       # مكونات الواجهة
├── lib/                          # مكتبات مساعدة
│   ├── firebase.ts               # إعدادات Firebase
│   ├── firebase-service.ts       # خدمات Firebase
│   └── trpc.ts                   # عميل TRPC
├── contexts/                     # Context API
│   └── AuthContext.tsx           # سياق المصادقة
├── types/                        # أنواع TypeScript
│   └── firebase.ts               # أنواع Firebase
├── hooks/                        # Hooks مخصصة
│   ├── use-colors.ts             # ألوان الموضوع
│   └── use-auth.ts               # حالة المصادقة
├── tests/                        # اختبارات الوحدة
│   └── firebase-service.test.ts  # اختبارات Firebase
├── assets/                       # الموارد
│   └── images/                   # الصور والأيقونات
├── app.config.ts                 # إعدادات Expo
├── tailwind.config.js            # إعدادات Tailwind
├── theme.config.js               # إعدادات الألوان
└── package.json                  # المكتبات والنصوص

```

## الميزات الرئيسية

### للمعلمين
- ✅ إنشاء صفوف جديدة مع أكواد فريدة للانضمام
- ✅ إنشاء وإدارة الواجبات مع تحديد المواعيد النهائية
- ✅ رفع ملفات مرفقة (PDF, Word, صور)
- ✅ عرض قائمة الطلاب المسجلين
- ✅ تقييم التسليمات مع إضافة تغذية راجعة
- ✅ عرض إحصائيات الصف والطلاب

### للطلاب
- ✅ الانضمام إلى الصفوف باستخدام الكود
- ✅ عرض الواجبات المنشورة
- ✅ تسليم الواجبات مع رفع الملفات
- ✅ عرض الدرجات والتغذية الراجعة
- ✅ تقويم يعرض المواعيد النهائية
- ✅ إشعارات بالواجبات الجديدة

## إعدادات Firebase

### إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد باسم "EduTask"
3. فعّل المصادقة بـ Email/Password
4. أنشئ قاعدة بيانات Firestore
5. فعّل Firebase Storage

### قواعد Firestore الأمان

أضف هذه القواعل في Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Classes collection
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.teacherId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.teacherId == request.auth.uid;
      
      match /assignments/{assignmentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && get(/databases/$(database)/documents/classes/$(classId)).data.teacherId == request.auth.uid;
        allow update, delete: if request.auth != null && get(/databases/$(database)/documents/classes/$(classId)).data.teacherId == request.auth.uid;
      }
      
      match /submissions/{submissionId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.resource.data.studentId == request.auth.uid;
        allow update: if request.auth != null && (resource.data.studentId == request.auth.uid || get(/databases/$(database)/documents/classes/$(classId)).data.teacherId == request.auth.uid);
      }
    }
  }
}
```

### قواعل Firebase Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assignments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /submissions/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## الاختبار

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
pnpm test

# تشغيل الاختبارات مع المراقبة
pnpm test --watch

# تشغيل اختبار معين
pnpm test firebase-service
```

## استكشاف الأخطاء

### المشكلة: خطأ "requires an index"

**الحل:** افتح الرابط الموجود في رسالة الخطأ وأنشئ الفهرس من Firebase Console.

### المشكلة: لا يمكن الاتصال بـ Firebase

**الحل:** تحقق من:
1. متغيرات البيئة في `.env.local`
2. قواعد Firestore والأمان
3. اتصال الإنترنت

### المشكلة: الملفات لا تُرفع

**الحل:** تحقق من:
1. تفعيل Firebase Storage
2. قواعل Firebase Storage الأمان
3. صلاحيات التطبيق على الجهاز

## الأوامر المهمة

```bash
# تثبيت المكتبات
pnpm install

# بدء التطوير
pnpm dev

# بناء للإنتاج
pnpm build

# التحقق من الأخطاء
pnpm check

# تنسيق الكود
pnpm format

# تشغيل الاختبارات
pnpm test

# إنشاء فهارس Firestore
pnpm db:push
```

## الدعم والمساعدة

للمزيد من المعلومات:
- [وثائق Expo](https://docs.expo.dev/)
- [وثائق Firebase](https://firebase.google.com/docs)
- [وثائق React Native](https://reactnative.dev/)
- [وثائق NativeWind](https://www.nativewind.dev/)

## الترخيص

هذا المشروع مرخص تحت MIT License.

---

**ملاحظة:** تأكد من حفظ بيانات Firebase الخاصة بك بأمان ولا تشاركها مع أحد.
