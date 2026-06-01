import type { LeaveRequest } from "@/lib/vacation-data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiError, leaveToInsert, mapLeaveRow, type LeaveRow } from "@/lib/vacation-db";

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const body = (await request.json()) as Omit<LeaveRequest, "id">;

  const { data, error } = await supabase
    .from("leave_requests")
    .insert(leaveToInsert(body))
    .select("*")
    .single();

  if (error) {
    return apiError(error.message);
  }

  return Response.json(mapLeaveRow(data as LeaveRow), { status: 201 });
}
