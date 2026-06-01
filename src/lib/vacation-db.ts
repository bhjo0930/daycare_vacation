import type { LeaveRequest, LeaveStatus, LeaveType, StaffMember } from "@/lib/vacation-data";

export type StaffRow = {
  id: string;
  name: string;
  role: string;
  classroom: string;
  annual_allowance: number | string;
  used_days: number | string;
};

export type LeaveRow = {
  id: string;
  staff_id: string;
  type: "annual" | "half_day" | "sick" | "family";
  start_date: string;
  end_date: string;
  days: number | string;
  reason: string;
  status: LeaveStatus;
  substitute: string | null;
};

export function toDbLeaveType(type: LeaveType): LeaveRow["type"] {
  return type === "half-day" ? "half_day" : type;
}

export function fromDbLeaveType(type: LeaveRow["type"]): LeaveType {
  return type === "half_day" ? "half-day" : type;
}

export function mapStaffRow(row: StaffRow): StaffMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    classroom: row.classroom,
    annualAllowance: Number(row.annual_allowance),
    usedDays: Number(row.used_days),
  };
}

export function mapLeaveRow(row: LeaveRow): LeaveRequest {
  return {
    id: row.id,
    staffId: row.staff_id,
    type: fromDbLeaveType(row.type),
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.days),
    reason: row.reason,
    status: row.status,
    substitute: row.substitute ?? undefined,
  };
}

export function staffToInsert(staff: Omit<StaffMember, "id">) {
  return {
    name: staff.name,
    role: staff.role,
    classroom: staff.classroom,
    annual_allowance: staff.annualAllowance,
    used_days: staff.usedDays,
  };
}

export function staffToUpdate(staff: StaffMember) {
  return staffToInsert(staff);
}

export function leaveToInsert(request: Omit<LeaveRequest, "id">) {
  return {
    staff_id: request.staffId,
    type: toDbLeaveType(request.type),
    start_date: request.startDate,
    end_date: request.endDate,
    days: request.days,
    reason: request.reason,
    status: request.status,
    substitute: request.substitute ?? null,
  };
}

export function leaveToUpdate(request: LeaveRequest) {
  return leaveToInsert(request);
}

export function apiError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}
