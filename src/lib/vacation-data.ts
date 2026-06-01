export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveType = "annual" | "half-day" | "sick" | "family";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  classroom: string;
  annualAllowance: number;
  usedDays: number;
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  substitute?: string;
};

export const staffMembers: StaffMember[] = [
  {
    id: "s-001",
    name: "김하늘",
    role: "담임교사",
    classroom: "햇살반",
    annualAllowance: 15,
    usedDays: 5.5,
  },
  {
    id: "s-002",
    name: "이서윤",
    role: "보조교사",
    classroom: "햇살반",
    annualAllowance: 12,
    usedDays: 4,
  },
  {
    id: "s-003",
    name: "박민지",
    role: "담임교사",
    classroom: "바다반",
    annualAllowance: 15,
    usedDays: 8,
  },
  {
    id: "s-004",
    name: "최유진",
    role: "조리사",
    classroom: "공용",
    annualAllowance: 12,
    usedDays: 3,
  },
  {
    id: "s-005",
    name: "정다은",
    role: "원장",
    classroom: "관리",
    annualAllowance: 15,
    usedDays: 2,
  },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: "l-101",
    staffId: "s-001",
    type: "annual",
    startDate: "2026-06-05",
    endDate: "2026-06-05",
    days: 1,
    reason: "가족 일정",
    status: "pending",
    substitute: "이서윤",
  },
  {
    id: "l-102",
    staffId: "s-003",
    type: "annual",
    startDate: "2026-06-12",
    endDate: "2026-06-13",
    days: 2,
    reason: "개인 휴식",
    status: "approved",
    substitute: "대체교사 A",
  },
  {
    id: "l-103",
    staffId: "s-004",
    type: "sick",
    startDate: "2026-06-03",
    endDate: "2026-06-03",
    days: 1,
    reason: "진료",
    status: "approved",
  },
  {
    id: "l-104",
    staffId: "s-002",
    type: "half-day",
    startDate: "2026-06-18",
    endDate: "2026-06-18",
    days: 0.5,
    reason: "오전 반차",
    status: "pending",
    substitute: "김하늘",
  },
];

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "연차",
  "half-day": "반차",
  sick: "병가",
  family: "가족돌봄",
};

export const statusLabels: Record<LeaveStatus, string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "반려",
};
