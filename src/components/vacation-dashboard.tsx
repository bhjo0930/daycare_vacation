"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  KeyRound,
  LogOut,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  leaveRequests,
  leaveTypeLabels,
  StaffMember,
  staffMembers,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/vacation-data";

const INITIAL_LOGIN_ID = "시립감일꿈꾸는어린이집";
const INITIAL_LOGIN_PASSWORD = "1234";

const leaveTypeStyles: Record<LeaveType, string> = {
  annual: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "half-day": "border-sky-200 bg-sky-50 text-sky-800",
  sick: "border-rose-200 bg-rose-50 text-rose-800",
  family: "border-amber-200 bg-amber-50 text-amber-800",
};

type StaffFormState = {
  name: string;
  role: string;
  classroom: string;
  annualAllowance: string;
  usedDays: string;
};

type VacationDataResponse = {
  staffList: StaffMember[];
  requests: LeaveRequest[];
};

type ToastState = {
  id: number;
  message: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "저장 중 문제가 발생했습니다.");
  }

  return response.json() as Promise<T>;
}

function getStaff(staffId: string, staffList: StaffMember[]) {
  return staffList.find((staff) => staff.id === staffId) ?? staffList[0] ?? staffMembers[0];
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function makeDateString(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function VacationDashboard() {
  const requestFormRef = useRef<HTMLFormElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<"vacations" | "staff">("vacations");
  const [loginForm, setLoginForm] = useState({
    loginId: INITIAL_LOGIN_ID,
    password: INITIAL_LOGIN_PASSWORD,
  });
  const [loginError, setLoginError] = useState("");
  const [staffList, setStaffList] = useState(staffMembers);
  const [requests, setRequests] = useState(leaveRequests);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 5, 1));
  const [selectedClassroom, setSelectedClassroom] = useState("전체");
  const [query, setQuery] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    name: "",
    role: "",
    classroom: "",
    annualAllowance: "15",
    usedDays: "0",
  });
  const [form, setForm] = useState({
    staffId: staffList[0].id,
    type: "annual" as LeaveType,
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    days: "1",
    reason: "",
    substitute: "",
  });

  const loadVacationData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError("");

    try {
      const data = await requestJson<VacationDataResponse>("/api/vacation-data");
      const nextStaffList = data.staffList.length ? data.staffList : staffMembers;

      setStaffList(nextStaffList);
      setRequests(data.requests);
      setForm((current) => ({
        ...current,
        staffId: nextStaffList.some((staff) => staff.id === current.staffId)
          ? current.staffId
          : nextStaffList[0].id,
      }));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void Promise.resolve().then(loadVacationData);
    }
  }, [isAuthenticated, loadVacationData]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2400);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function showToast(message: string) {
    setToast({ id: Date.now(), message });
  }

  const classrooms = ["전체", ...Array.from(new Set(staffList.map((staff) => staff.classroom)))];
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = makeDateString(year, monthIndex, day);
      return { day, date };
    });

    return [...Array<null>(firstWeekday).fill(null), ...monthDays];
  }, [currentMonth]);

  const visibleStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesClassroom =
        selectedClassroom === "전체" || staff.classroom === selectedClassroom;
      const matchesQuery =
        staff.name.includes(query) ||
        staff.role.includes(query) ||
        staff.classroom.includes(query);

      return matchesClassroom && matchesQuery;
    });
  }, [query, selectedClassroom, staffList]);

  const registeredDaysByStaff = useMemo(() => {
    return requests.reduce<Record<string, number>>((totals, request) => {
      totals[request.staffId] = (totals[request.staffId] ?? 0) + request.days;

      return totals;
    }, {});
  }, [requests]);

  const monthlyRegisteredDaysByStaff = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const monthStart = makeDateString(year, monthIndex, 1);
    const monthEnd = makeDateString(year, monthIndex, new Date(year, monthIndex + 1, 0).getDate());

    return requests.reduce<Record<string, number>>((totals, request) => {
      if (request.startDate <= monthEnd && request.endDate >= monthStart) {
        totals[request.staffId] = (totals[request.staffId] ?? 0) + request.days;
      }

      return totals;
    }, {});
  }, [currentMonth, requests]);

  const statusRows = useMemo(() => {
    return staffList.map((staff) => {
      const registeredDays = registeredDaysByStaff[staff.id] ?? 0;
      const totalUsedDays = staff.usedDays + registeredDays;

      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        classroom: staff.classroom,
        annualAllowance: staff.annualAllowance,
        baseUsedDays: staff.usedDays,
        registeredDays,
        monthlyRegisteredDays: monthlyRegisteredDaysByStaff[staff.id] ?? 0,
        totalUsedDays,
        remainingDays: staff.annualAllowance - totalUsedDays,
        usageRate: staff.annualAllowance
          ? Math.round((totalUsedDays / staff.annualAllowance) * 1000) / 10
          : 0,
      };
    });
  }, [monthlyRegisteredDaysByStaff, registeredDaysByStaff, staffList]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      loginForm.loginId === INITIAL_LOGIN_ID &&
      loginForm.password === INITIAL_LOGIN_PASSWORD
    ) {
      setIsAuthenticated(true);
      setLoginError("");
      return;
    }

    setLoginError("ID 또는 비밀번호가 올바르지 않습니다.");
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextRequest: Omit<LeaveRequest, "id"> = {
      staffId: form.staffId,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days: Number(form.days),
      reason: form.reason || "사유 미입력",
      status: "approved",
      substitute: form.substitute || undefined,
    };

    try {
      setDataError("");

      if (editingRequestId) {
        const updatedRequest = await requestJson<LeaveRequest>(
          `/api/leave-requests/${editingRequestId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ ...nextRequest, id: editingRequestId }),
          },
        );

        setRequests((current) =>
          current.map((request) =>
            request.id === editingRequestId ? updatedRequest : request,
          ),
        );
        showToast("휴가 일정이 수정되었습니다.");
      } else {
        const createdRequest = await requestJson<LeaveRequest>("/api/leave-requests", {
          method: "POST",
          body: JSON.stringify(nextRequest),
        });

        setRequests((current) => [createdRequest, ...current]);
        showToast("휴가 일정이 등록되었습니다.");
      }
      setEditingRequestId(null);
      setForm((current) => ({ ...current, reason: "", substitute: "" }));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "휴가 일정을 저장하지 못했습니다.");
      await loadVacationData();
    }
  }

  function moveMonth(amount: number) {
    setCurrentMonth((month) => addMonths(month, amount));
  }

  function focusRequestForm() {
    setActiveView("vacations");
    requestFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestFormRef.current?.querySelector("select")?.focus();
  }

  function prepareVacationOnDate(date: string) {
    setActiveView("vacations");
    setEditingRequestId(null);
    setForm((current) => ({
      ...current,
      startDate: date,
      endDate: date,
      days: current.type === "half-day" ? "0.5" : "1",
      reason: "",
      substitute: "",
    }));
    focusRequestForm();
  }

  function editVacation(request: LeaveRequest) {
    setActiveView("vacations");
    setEditingRequestId(request.id);
    setForm({
      staffId: request.staffId,
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      days: String(request.days),
      reason: request.reason,
      substitute: request.substitute ?? "",
    });
    focusRequestForm();
  }

  function cancelVacationEdit() {
    setEditingRequestId(null);
    setForm((current) => ({ ...current, reason: "", substitute: "" }));
  }

  async function deleteVacation() {
    if (!editingRequestId) {
      return;
    }

    try {
      setDataError("");
      await requestJson<{ ok: boolean }>(`/api/leave-requests/${editingRequestId}`, {
        method: "DELETE",
      });
      setRequests((current) => current.filter((request) => request.id !== editingRequestId));
      cancelVacationEdit();
      showToast("휴가 일정이 삭제되었습니다.");
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "휴가 일정을 삭제하지 못했습니다.");
      await loadVacationData();
    }
  }

  function resetStaffForm() {
    setEditingStaffId(null);
    setStaffForm({
      name: "",
      role: "",
      classroom: "",
      annualAllowance: "15",
      usedDays: "0",
    });
  }

  function editStaff(staff: StaffMember) {
    setActiveView("staff");
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      role: staff.role,
      classroom: staff.classroom,
      annualAllowance: String(staff.annualAllowance),
      usedDays: String(staff.usedDays),
    });
  }

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextStaff = {
      name: staffForm.name.trim(),
      role: staffForm.role.trim(),
      classroom: staffForm.classroom.trim(),
      annualAllowance: Number(staffForm.annualAllowance),
      usedDays: Number(staffForm.usedDays),
    };

    if (!nextStaff.name || !nextStaff.role || !nextStaff.classroom) {
      return;
    }

    try {
      setDataError("");

      if (editingStaffId) {
        const updatedStaff = await requestJson<StaffMember>(`/api/staff/${editingStaffId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...nextStaff, id: editingStaffId }),
        });

        setStaffList((current) =>
          current.map((staff) => (staff.id === editingStaffId ? updatedStaff : staff)),
        );
        setForm((current) => ({ ...current, staffId: updatedStaff.id }));
      } else {
        const createdStaff = await requestJson<StaffMember>("/api/staff", {
          method: "POST",
          body: JSON.stringify(nextStaff),
        });

        setStaffList((current) => [createdStaff, ...current]);
        setForm((current) => ({ ...current, staffId: createdStaff.id }));
      }

      resetStaffForm();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "직원 정보를 저장하지 못했습니다.");
      await loadVacationData();
    }
  }

  async function deleteStaff(staffId: string) {
    if (staffList.length <= 1) {
      return;
    }

    try {
      setDataError("");
      await requestJson<{ ok: boolean }>(`/api/staff/${staffId}`, { method: "DELETE" });

      setStaffList((current) => {
        const remaining = current.filter((staff) => staff.id !== staffId);
        setForm((currentForm) => ({
          ...currentForm,
          staffId: currentForm.staffId === staffId ? remaining[0].id : currentForm.staffId,
        }));
        return remaining;
      });
      setRequests((current) => current.filter((request) => request.staffId !== staffId));
      if (editingStaffId === staffId) {
        resetStaffForm();
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "직원 정보를 삭제하지 못했습니다.");
      await loadVacationData();
    }
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const staffSheetRows = staffList.map((staff) => ({
      이름: staff.name,
      직책: staff.role,
      담당: staff.classroom,
      "연차 한도": staff.annualAllowance,
      "기존 사용": staff.usedDays,
    }));

    const vacationSheetRows = requests.map((request) => {
      const staff = getStaff(request.staffId, staffList);

      return {
        직원: staff.name,
        직책: staff.role,
        담당: staff.classroom,
        종류: leaveTypeLabels[request.type],
        시작일: request.startDate,
        종료일: request.endDate,
        일수: request.days,
        "대체 인력": request.substitute ?? "",
        메모: request.reason,
      };
    });

    const statusSheetRows = statusRows.map((row) => ({
      직원: row.name,
      직책: row.role,
      담당: row.classroom,
      "연차 한도": row.annualAllowance,
      "기존 사용": row.baseUsedDays,
      "등록 휴가": row.registeredDays,
      "총 사용": row.totalUsedDays,
      "잔여 휴가": row.remainingDays,
      "사용률(%)": row.usageRate,
    }));

    const sheets = [
      { name: "직원", rows: staffSheetRows },
      { name: "휴가", rows: vacationSheetRows },
      { name: "현황", rows: statusSheetRows },
    ];

    for (const sheet of sheets) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
      worksheet["!cols"] = Object.keys(sheet.rows[0] ?? { 빈값: "" }).map((key) => ({
        wch: Math.max(10, Math.min(24, key.length + 8)),
      }));
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    XLSX.writeFile(workbook, `어린이집_휴가관리_${todayStamp()}.xlsx`);
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f2] px-5 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 inline-flex size-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">어린이집 휴가 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            초기 계정으로 로그인한 뒤 휴가 일정을 등록합니다.
          </p>

          <form className="mt-6 space-y-4" onSubmit={login}>
            <Field label="ID">
              <input
                className="input"
                data-testid="login-id"
                value={loginForm.loginId}
                onChange={(event) => setLoginForm({ ...loginForm, loginId: event.target.value })}
              />
            </Field>
            <Field label="비밀번호">
              <input
                className="input"
                data-testid="login-password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </Field>
            {loginError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {loginError}
              </p>
            ) : null}
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              data-testid="login-submit"
              type="submit"
            >
              <KeyRound size={16} />
              로그인
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">어린이집 운영 관리</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">휴가 관리</h1>
          </div>
          <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
            <button
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
              data-testid="export-excel"
              onClick={exportExcel}
              title="엑셀 저장"
              type="button"
            >
              <Download size={16} />
              엑셀 저장
            </button>
            <button
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
              data-testid="logout-button"
              onClick={() => setIsAuthenticated(false)}
              title="로그아웃"
              type="button"
            >
              <LogOut size={16} />
              로그아웃
            </button>
            <button
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
              data-testid="view-staff-management"
              onClick={() => setActiveView((view) => (view === "staff" ? "vacations" : "staff"))}
              title="직원 관리"
              type="button"
            >
              <UsersRound size={16} />
              {activeView === "staff" ? "휴가 관리" : "직원 관리"}
            </button>
            <div className="col-span-2 grid grid-cols-[1fr_44px] gap-2 sm:contents">
              <button
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
                data-testid="previous-month"
                onClick={() => moveMonth(-1)}
                title="이전 달"
                type="button"
              >
                <ChevronLeft size={16} />
                {formatMonthLabel(currentMonth)}
              </button>
              <button
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 shadow-sm transition hover:bg-slate-50 sm:size-10 sm:px-0"
                data-testid="next-month"
                onClick={() => moveMonth(1)}
                title="다음 달"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              className="col-span-2 inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:col-span-1"
              data-testid="add-request-shortcut"
              onClick={focusRequestForm}
              title="휴가 일정 등록"
              type="button"
            >
              <Plus size={16} />
              일정 등록
            </button>
          </div>
        </div>
      </header>

      {toast ? (
        <div
          aria-live="polite"
          className="fixed inset-x-3 bottom-4 z-50 rounded-md border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-800 shadow-lg sm:inset-x-auto sm:right-5 sm:text-left"
          key={toast.id}
        >
          {toast.message}
        </div>
      ) : null}

      {isLoadingData || dataError ? (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-3">
            {isLoadingData ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Supabase에서 최신 데이터를 불러오는 중입니다.
              </p>
            ) : null}
            {dataError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {dataError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeView === "vacations" ? (
      <section className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">월간 휴가 현황</h2>
                <p className="text-sm text-slate-500">등록된 휴가 일정을 월별로 확인합니다.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 lg:w-64"
                    placeholder="직원, 직책, 반 검색"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={selectedClassroom}
                  onChange={(event) => setSelectedClassroom(event.target.value)}
                >
                  {classrooms.map((classroom) => (
                    <option key={classroom}>{classroom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div className="px-1 py-2 sm:px-2 sm:py-3" key={day}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((calendarDay, index) => {
                if (!calendarDay) {
                  return (
                    <div
                      aria-hidden="true"
                      className="min-h-20 border-b border-r border-slate-100 bg-slate-50/50 p-1 sm:min-h-28 sm:p-2"
                      key={`blank-${index}`}
                    />
                  );
                }

                const { day, date } = calendarDay;
                const dayRequests = requests.filter(
                  (request) => request.startDate <= date && request.endDate >= date,
                );

                return (
                  <div
                    className="min-h-20 cursor-pointer overflow-hidden border-b border-r border-slate-100 p-1 text-left transition hover:bg-emerald-50/40 last:border-r-0 focus-within:bg-emerald-50/40 sm:min-h-28 sm:p-2"
                    data-testid={`calendar-day-${date}`}
                    key={date}
                    onClick={() => prepareVacationOnDate(date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        prepareVacationOnDate(date);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title={`${date} 휴가 등록`}
                  >
                    <div className="mb-1 text-xs font-semibold text-slate-700 sm:mb-2 sm:text-sm">
                      {day}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayRequests.map((request) => {
                        const staff = getStaff(request.staffId, staffList);
                        return (
                          <button
                            className={`block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] leading-tight sm:px-2 sm:py-1 sm:text-xs ${leaveTypeStyles[request.type]}`}
                            data-testid={`calendar-event-${request.id}`}
                            key={request.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              editVacation(request);
                            }}
                            title={`${staff.name} ${leaveTypeLabels[request.type]}`}
                            type="button"
                          >
                            {staff.name} · {leaveTypeLabels[request.type]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold">휴가 사용 현황</h2>
              <p className="text-sm text-slate-500">보고 있는 월과 누적 사용량을 빠르게 확인합니다.</p>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {visibleStaff.map((staff) => {
                const status = statusRows.find((row) => row.id === staff.id);
                const usedDays = status?.totalUsedDays ?? staff.usedDays;
                const remaining = status?.remainingDays ?? staff.annualAllowance - usedDays;
                const monthlyUsedDays = status?.monthlyRegisteredDays ?? 0;
                const usedRate = Math.min(100, Math.round(status?.usageRate ?? 0));

                return (
                  <div className="px-4 py-3" key={staff.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{staff.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {staff.role} · {staff.classroom}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-emerald-700">
                          {monthlyUsedDays}일
                        </div>
                        <div className="text-xs text-slate-500">{formatMonthLabel(currentMonth)}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">총 사용</div>
                        <div className="font-semibold">{usedDays}일</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">잔여</div>
                        <div className="font-semibold">{remaining}일</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">소진율</div>
                        <div className="font-semibold">{usedRate}%</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${usedRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">직원</th>
                    <th className="px-4 py-3">담당</th>
                    <th className="px-4 py-3">{formatMonthLabel(currentMonth)} 휴가</th>
                    <th className="px-4 py-3">사용</th>
                    <th className="px-4 py-3">잔여</th>
                    <th className="px-4 py-3">소진율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStaff.map((staff) => {
                    const status = statusRows.find((row) => row.id === staff.id);
                    const usedDays = status?.totalUsedDays ?? staff.usedDays;
                    const remaining = status?.remainingDays ?? staff.annualAllowance - usedDays;
                    const monthlyUsedDays = status?.monthlyRegisteredDays ?? 0;
                    const usedRate = Math.min(100, Math.round(status?.usageRate ?? 0));
                    return (
                      <tr key={staff.id}>
                        <td className="px-4 py-4">
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-slate-500">{staff.role}</div>
                        </td>
                        <td className="px-4 py-4">{staff.classroom}</td>
                        <td className="px-4 py-4 font-semibold text-emerald-700">
                          {monthlyUsedDays}일
                        </td>
                        <td className="px-4 py-4">{usedDays}일</td>
                        <td className="px-4 py-4 font-semibold">{remaining}일</td>
                        <td className="px-4 py-4">
                          <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${usedRate}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold">
                {editingRequestId ? "휴가 수정" : "휴가 등록"}
              </h2>
              <p className="text-sm text-slate-500">
                날짜 칸을 클릭하면 해당 날짜로 등록하고, 일정 칩을 클릭하면 수정/삭제합니다.
              </p>
            </div>
            <form className="space-y-3 p-4" onSubmit={createRequest} ref={requestFormRef}>
              <Field label="직원">
                <select
                  className="input"
                  data-testid="vacation-staff"
                  value={form.staffId}
                  onChange={(event) => setForm({ ...form, staffId: event.target.value })}
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} · {staff.classroom}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="종류">
                  <select
                    className="input"
                    data-testid="vacation-type"
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value as LeaveType })}
                  >
                    {Object.entries(leaveTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="일수">
                  <input
                    className="input"
                    data-testid="vacation-days"
                    min="0.5"
                    step="0.5"
                    type="number"
                    value={form.days}
                    onChange={(event) => setForm({ ...form, days: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="시작일">
                  <input
                    className="input"
                    data-testid="vacation-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                  />
                </Field>
                <Field label="종료일">
                  <input
                    className="input"
                    data-testid="vacation-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="대체 인력">
                <input
                  className="input"
                  data-testid="vacation-substitute"
                  placeholder="선택 입력"
                  value={form.substitute}
                  onChange={(event) => setForm({ ...form, substitute: event.target.value })}
                />
              </Field>
              <Field label="사유">
                <textarea
                  className="input min-h-20 resize-none py-2"
                  data-testid="vacation-reason"
                  placeholder="등록 메모"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </Field>
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                data-testid="vacation-submit"
                type="submit"
              >
                {editingRequestId ? <Check size={16} /> : <Plus size={16} />}
                {editingRequestId ? "수정 저장" : "휴가 등록"}
              </button>
              {editingRequestId ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    data-testid="vacation-delete"
                    onClick={deleteVacation}
                    type="button"
                  >
                    <X size={16} />
                    삭제
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"
                    data-testid="vacation-cancel-edit"
                    onClick={cancelVacationEdit}
                    type="button"
                  >
                    취소
                  </button>
                </div>
              ) : null}
            </form>
          </section>
        </aside>
      </section>
      ) : (
        <StaffManagement
          editingStaffId={editingStaffId}
          onCancel={resetStaffForm}
          onDelete={deleteStaff}
          onEdit={editStaff}
          onSave={saveStaff}
          staffForm={staffForm}
          staffList={staffList}
          setStaffForm={setStaffForm}
        />
      )}
    </main>
  );
}

function StaffManagement({
  editingStaffId,
  onCancel,
  onDelete,
  onEdit,
  onSave,
  staffForm,
  staffList,
  setStaffForm,
}: {
  editingStaffId: string | null;
  onCancel: () => void;
  onDelete: (staffId: string) => void;
  onEdit: (staff: StaffMember) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  staffForm: StaffFormState;
  staffList: StaffMember[];
  setStaffForm: (staffForm: StaffFormState) => void;
}) {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">직원 관리</h2>
          <p className="text-sm text-slate-500">직원 정보를 등록하고 변경합니다.</p>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {staffList.map((staff) => (
            <div className="px-4 py-3" data-testid={`mobile-staff-row-${staff.id}`} key={staff.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{staff.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {staff.role} · {staff.classroom}
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <div className="font-semibold">{staff.annualAllowance}일</div>
                  <div className="text-xs text-slate-500">기존 {staff.usedDays}일</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium transition hover:bg-slate-50"
                  data-testid={`mobile-edit-staff-${staff.id}`}
                  onClick={() => onEdit(staff)}
                  type="button"
                >
                  수정
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  data-testid={`mobile-delete-staff-${staff.id}`}
                  disabled={staffList.length <= 1}
                  onClick={() => onDelete(staff.id)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">직원</th>
                <th className="px-4 py-3">직책</th>
                <th className="px-4 py-3">담당</th>
                <th className="px-4 py-3">연차 한도</th>
                <th className="px-4 py-3">기존 사용</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => (
                <tr key={staff.id} data-testid={`staff-row-${staff.id}`}>
                  <td className="px-4 py-4 font-medium">{staff.name}</td>
                  <td className="px-4 py-4">{staff.role}</td>
                  <td className="px-4 py-4">{staff.classroom}</td>
                  <td className="px-4 py-4">{staff.annualAllowance}일</td>
                  <td className="px-4 py-4">{staff.usedDays}일</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium transition hover:bg-slate-50"
                        data-testid={`edit-staff-${staff.id}`}
                        onClick={() => onEdit(staff)}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        data-testid={`delete-staff-${staff.id}`}
                        disabled={staffList.length <= 1}
                        onClick={() => onDelete(staff.id)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">
            {editingStaffId ? "직원 정보 수정" : "직원 등록"}
          </h2>
          <p className="text-sm text-slate-500">
            저장하면 휴가 등록 선택지와 직원 현황에 바로 반영됩니다.
          </p>
        </div>
        <form className="space-y-3 p-4" onSubmit={onSave}>
          <Field label="이름">
            <input
              className="input"
              data-testid="staff-name"
              required
              value={staffForm.name}
              onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })}
            />
          </Field>
          <Field label="직책">
            <input
              className="input"
              data-testid="staff-role"
              required
              value={staffForm.role}
              onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}
            />
          </Field>
          <Field label="담당">
            <input
              className="input"
              data-testid="staff-classroom"
              required
              value={staffForm.classroom}
              onChange={(event) => setStaffForm({ ...staffForm, classroom: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="연차 한도">
              <input
                className="input"
                data-testid="staff-annual-allowance"
                min="0"
                step="0.5"
                type="number"
                value={staffForm.annualAllowance}
                onChange={(event) =>
                  setStaffForm({ ...staffForm, annualAllowance: event.target.value })
                }
              />
            </Field>
            <Field label="기존 사용">
              <input
                className="input"
                data-testid="staff-used-days"
                min="0"
                step="0.5"
                type="number"
                value={staffForm.usedDays}
                onChange={(event) => setStaffForm({ ...staffForm, usedDays: event.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              data-testid="save-staff"
              type="submit"
            >
              <Check size={16} />
              {editingStaffId ? "수정 저장" : "직원 등록"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"
              data-testid="cancel-staff-edit"
              onClick={onCancel}
              type="button"
            >
              <X size={16} />
              취소
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
