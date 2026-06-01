import type { StaffMember } from "@/lib/vacation-data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiError, mapStaffRow, staffToInsert, type StaffRow } from "@/lib/vacation-db";

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return apiError("Supabase 환경변수가 설정되지 않았습니다.", 503);
  }

  const body = (await request.json()) as Omit<StaffMember, "id">;

  const { data, error } = await supabase
    .from("staff_members")
    .insert(staffToInsert(body))
    .select("*")
    .single();

  if (error) {
    return apiError(error.message);
  }

  return Response.json(mapStaffRow(data as StaffRow), { status: 201 });
}
