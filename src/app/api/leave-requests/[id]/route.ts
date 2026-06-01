import type { LeaveRequest } from "@/lib/vacation-data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiError, leaveToUpdate, mapLeaveRow, type LeaveRow } from "@/lib/vacation-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const { id } = await params;
  const body = (await request.json()) as LeaveRequest;

  const { data, error } = await supabase
    .from("leave_requests")
    .update(leaveToUpdate({ ...body, id }))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return apiError(error.message);
  }

  return Response.json(mapLeaveRow(data as LeaveRow));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const { id } = await params;
  const { error } = await supabase.from("leave_requests").delete().eq("id", id);

  if (error) {
    return apiError(error.message);
  }

  return Response.json({ ok: true });
}
