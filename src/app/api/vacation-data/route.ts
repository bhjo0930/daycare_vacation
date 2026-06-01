import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiError, mapLeaveRow, mapStaffRow, type LeaveRow, type StaffRow } from "@/lib/vacation-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const [staffResult, leaveResult] = await Promise.all([
    supabase.from("staff_members").select("*").order("created_at", { ascending: true }),
    supabase.from("leave_requests").select("*").order("start_date", { ascending: true }),
  ]);

  if (staffResult.error) {
    return apiError(staffResult.error.message);
  }

  if (leaveResult.error) {
    return apiError(leaveResult.error.message);
  }

  return Response.json({
    staffList: ((staffResult.data ?? []) as StaffRow[]).map(mapStaffRow),
    requests: ((leaveResult.data ?? []) as LeaveRow[]).map(mapLeaveRow),
  });
}
