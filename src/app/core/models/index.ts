// ── API Response Models ──
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<PaginatedResult<T>> {}

// ── Auth Models ──
export interface LoginRequest { email: string; password: string; schoolCode?: string; }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; role?: string; schoolCode?: string; }
export interface RegisterSchoolRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolName: string;
  phoneNumber?: string;
  schoolAddress?: string;
  schoolEmail?: string;
  schoolPhone?: string;
}
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; school?: SchoolInfo; }
export interface SchoolInfo { id: string; name: string; code: string; }

// ── User Model ──
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  permissions?: string[]; // Dynamic permissions from role
  school?: string | School;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin', // Software owner/developer - manages the SaaS platform
  PRINCIPAL = 'principal', // School's top administrator
  VICE_PRINCIPAL = 'vice_principal',
  TEACHER = 'teacher',
  CLASS_TEACHER = 'class_teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  ACCOUNTANT = 'accountant',
  LIBRARIAN = 'librarian',
  RECEPTIONIST = 'receptionist',
}

// Backward compatibility aliases
export const SUPER_ADMIN = UserRole.PLATFORM_ADMIN;
export const SCHOOL_ADMIN = UserRole.PRINCIPAL;

// ── School Model ──
export interface School {
  _id: string;
  name: string;
  code: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  settings?: SchoolSettings;
  features?: Record<string, boolean>;
  isActive: boolean;
  createdAt?: string;
}

export interface SchoolSettings {
  academicYearStart?: number;
  academicYearEnd?: number;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  workingDays?: string[];
}

// ── Student Model ──
export interface Student {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  admissionNumber: string;
  admissionDate?: string;
  currentClass?: string | ClassModel;
  currentSection?: string;
  currentAcademicYear?: string;
  rollNumber?: string;
  status?: string;
  contact?: { phone?: string; address?: string; };
  photo?: string;
  school?: string;
  parents?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Teacher Model ──
export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[] | Subject[];
  qualification?: string;
  experience?: number;
  joiningDate?: string;
  assignedClasses?: string[];
  school?: string;
  user?: string | User;
  employeeId?: string;
  staffId?: string;
  createdAt?: string;
}

// ── Parent Model ──
export interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relation?: string;
  children?: string[] | Student[];
  occupation?: string;
  address?: string;
  school?: string;
  user?: string | User;
  createdAt?: string;
}

// ── Class Model ──
export interface ClassSection {
  name: string;
  capacity?: number;
  classTeacher?: string | Teacher;
}

export interface ClassModel {
  _id: string;
  name: string;
  grade?: number;
  sections?: ClassSection[];
  capacity?: number;
  classTeacher?: string | Teacher;
  academicYear?: string;
  school?: string;
  createdAt?: string;
}

// ── Subject Model ──
export interface Subject {
  _id: string;
  name: string;
  code?: string;
  type?: string;
  class?: string | ClassModel;
  teacher?: string | Teacher;
  periodsPerWeek?: number;
  maxMarks?: number;
  school?: string;
}

// ── Academic Year ──
export interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  school?: string;
}

// ── Enrollment ──
export interface Enrollment {
  _id: string;
  student: string | Student;
  class: string | ClassModel;
  section: string;
  academicYear: string | AcademicYear;
  rollNumber?: string;
  status: EnrollmentStatus;
  result?: string; // pass, fail, promoted, retained, pending
  percentage?: number;
  rank?: number;
  enrollmentDate?: string;
  withdrawalDate?: string;
  withdrawalReason?: string;
  remarks?: string;
  enrolledBy?: string | User;
  previousEnrollment?: {
    academicYear: string;
    class: string;
    section: string;
    rollNumber: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
  TRANSFERRED = 'transferred',
  PROMOTED = 'promoted',
  PASSED = 'passed',
  FAILED = 'failed',
  RETAINED = 'retained',
}

// ── Attendance ──
export interface Attendance {
  period?: number;
  remark?: string;
  markedBy?: string | User;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  EXCUSED = 'excused',
}

export interface AttendanceRecord {
  student: string;
  status: AttendanceStatus;
  remark?: string;
}

// ── Exam ──
export interface Exam {
  _id: string;
  name: string;
  examType?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  classes?: string[];
  subjects?: string[];
  school?: string;
  createdAt?: string;
}

// ── Result ──
export interface Result {
  _id: string;
  student: string | Student;
  exam: string | Exam;
  class: string | ClassModel;
  academicYear?: string;
  subjects: ResultSubject[];
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
  grade?: string;
  rank?: number;
  remarks?: string;
  isPublished?: boolean;
}

export interface ResultSubject {
  subject: string | Subject;
  maxMarks: number;
  obtainedMarks: number;
  grade?: string;
  remarks?: string;
}

// ── Fee ──
export interface Fee {
  _id: string;
  student: string | Student;
  academicYear?: string;
  month?: number;
  year?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  status?: FeeStatus;
  dueDate?: string;
  feeComponents?: FeeComponent[];
  payments?: Payment[];
  discounts?: Discount[];
  fines?: Fine[];
}

export enum FeeStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

export interface FeeComponent { name: string; amount: number; dueDate?: string; }
export interface Payment { amount: number; method?: string; date?: string; remarks?: string; }
export interface Discount { amount: number; reason?: string; }
export interface Fine { amount: number; reason?: string; }

// ── Transport ──
export interface Transport {
  _id: string;
  vehicleNumber: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  capacity: number;
  routeName: string;
  routeNumber?: string;
  stops?: TransportStop[];
  driver?: TransportDriver;
  attendant?: TransportAttendant;
  assignedStudents?: string[];
  status?: string;
  monthlyFee?: number;
  currentLocation?: GpsLocation;
  locationHistory?: GpsLocation[];
  maintenanceRecords?: MaintenanceRecord[];
  school?: string;
}

export interface TransportStop { name: string; pickupTime?: string; dropTime?: string; latitude?: number; longitude?: number; order?: number; }
export interface TransportDriver { name: string; phone?: string; licenseNumber?: string; licenseExpiry?: string; }
export interface TransportAttendant { name: string; phone?: string; }
export interface GpsLocation { latitude: number; longitude: number; speed?: number; timestamp?: string; }
export interface MaintenanceRecord { date?: string; type?: string; description?: string; cost?: number; vendor?: string; nextDueDate?: string; }

// ── Transfer ──
export interface Transfer {
  _id: string;
  student: string | Student;
  type?: string;
  status?: string;
  transferDate?: string;
  reason?: string;
  externalSchoolName?: string;
  externalSchoolAddress?: string;
  certificateNumber?: string;
  createdAt?: string;
}

// ── Promotion ──
export interface Promotion {
  _id: string;
  student: string | Student;
  fromClass: string | ClassModel;
  toClass?: string | ClassModel;
  fromAcademicYear: string;
  toAcademicYear?: string;
  fromSection?: string;
  toSection?: string;
  status?: string;
  remarks?: string;
  createdAt?: string;
}

// ── Timetable ──
export interface Timetable {
  _id: string;
  class: string | ClassModel;
  section?: string;
  academicYear?: string;
  schedule?: DaySchedule[];
}

export interface DaySchedule {
  day: string;
  periods: TimetablePeriod[];
}

export interface TimetablePeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject?: string | Subject;
  teacher?: string | Teacher;
  type?: string;
}

// ── Notification ──
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  recipientType?: string;
  recipientIds?: string[];
  isRead?: boolean;
  createdAt?: string;
}

// ── Subscription ──
export interface Subscription {
  _id: string;
  school: string | School;
  plan?: string;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  maxTeachers?: number;
  amount?: number;
  status?: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
  attendanceRate: number;
  feeCollectionRate: number;
  totalFeeCollected: number;
  totalFeePending: number;
  activeTransport: number;
  upcomingExams: number;
}
