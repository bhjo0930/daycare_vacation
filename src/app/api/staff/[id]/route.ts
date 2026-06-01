import type { StaffMember } from "@/lib/vacation-data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiError, mapStaffRow, staffToUpdate, type StaffRow } from "@/lib/vacation-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const { id } = await params;
  const body = (await request.json()) as StaffMember;

  const { data, error } = await supabase
    .from("staff_members")
    .update(staffToUpdate({ ...body, id }))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return apiError(error.message);
  }

  return Response.json(mapStaffRow(data as StaffRow));
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
  const { error } = await supabase.from("staff_members").delete().eq("id", id);

  if (error) {
    return apiError(error.message);
  }

  return Response.json({ ok: true });
}
