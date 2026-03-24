
import { supabase } from "./backend/src/lib/supabase.js";

async function getShortlist(recruiterId) {
  const { data } = await supabase
    .from("recruiter_shortlists")
    .select("candidate_id")
    .eq("recruiter_id", recruiterId);
  return (data || []).map(s => s.candidate_id);
}

async function maskId(id) {
  try {
    const { data: existing, error: sError } = await supabase
      .from("candidate_aliases")
      .select("alias")
      .eq("candidate_id", id)
      .maybeSingle();

    if (existing) return existing.alias;

    const { count, error: cError } = await supabase
      .from("candidate_aliases")
      .select("*", { count: "exact", head: true });

    const alias = `CAND-${String((count || 0) + 1).padStart(3, '0')}`;
    const { data: created, error: iError } = await supabase
      .from("candidate_aliases")
      .insert({ candidate_id: id, alias })
      .select("alias")
      .single();

    return created?.alias || alias;
  } catch (err) {
    console.error("[MaskId] Error:", err.message);
    return id;
  }
}

async function test() {
  const recruiterId = '8c227092-a16f-40e8-9642-4217730e7040'; // Mock recruiter
  const role = 'all';

  let query = supabase.from("candidates").select("*").not("overall_score", "is", null);
  const { data: candidates, error } = await query.order("overall_score", { ascending: false });

  console.log(`Found ${candidates?.length} candidates`);

  const shortlist = await getShortlist(recruiterId);
  const { data: conns } = await supabase
    .from("recruiter_connections")
    .select("*")
    .eq("recruiter_id", recruiterId);

  const poolPromises = (candidates ?? []).map(async (c, idx) => {
    const masked = await maskId(c.candidate_id);
    const conn = (conns || []).find(con => con.candidate_id === c.candidate_id);
    return {
      rank: idx + 1,
      maskedId: masked,
      targetRole: c.target_role,
      overallScore: c.overall_score ?? 0,
      isShortlisted: shortlist.includes(c.candidate_id),
    };
  });

  const pool = await Promise.all(poolPromises);
  console.log(`Pool size: ${pool.length}`);
  console.log(JSON.stringify(pool[0], null, 2));
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
