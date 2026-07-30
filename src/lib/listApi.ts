import { supabase } from "./supabaseClient";
import type { RestaurantListItem } from "../types";

interface ListItemRow {
  id: string;
  owner_id: string;
  place_id: string;
  name: string;
  address: string | null;
  checked: boolean;
}

function mapRow(row: ListItemRow): RestaurantListItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    placeId: row.place_id,
    name: row.name,
    address: row.address,
    checked: row.checked,
  };
}

export async function fetchList(ownerId: string): Promise<RestaurantListItem[]> {
  const { data, error } = await supabase!
    .from("list_items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ListItemRow[]).map(mapRow);
}

export async function addListItem(
  ownerId: string,
  item: { placeId: string; name: string; address: string | null },
): Promise<void> {
  const { error } = await supabase!.from("list_items").upsert(
    {
      owner_id: ownerId,
      place_id: item.placeId,
      name: item.name,
      address: item.address,
      checked: true,
    },
    { onConflict: "owner_id,place_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function setItemChecked(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase!.from("list_items").update({ checked }).eq("id", id);
  if (error) throw error;
}

export async function deleteListItem(id: string): Promise<void> {
  const { error } = await supabase!.from("list_items").delete().eq("id", id);
  if (error) throw error;
}

export interface ShareResult {
  ok: boolean;
  message: string;
}

export async function shareList(ownerId: string, email: string): Promise<ShareResult> {
  const normalized = email.trim().toLowerCase();
  const { error } = await supabase!
    .from("list_shares")
    .insert({ owner_id: ownerId, shared_with_email: normalized });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Already shared with this email." };
    }
    return { ok: false, message: "Couldn't share the list. Try again." };
  }
  return { ok: true, message: `Shared with ${normalized}.` };
}

export interface SharedListSummary {
  ownerId: string;
  ownerName: string;
}

export async function fetchSharedWithMe(myEmail: string): Promise<SharedListSummary[]> {
  const normalized = myEmail.trim().toLowerCase();

  const { data: shares, error } = await supabase!
    .from("list_shares")
    .select("owner_id, shared_with_email");
  if (error) throw error;

  const mine = (shares ?? []).filter(
    (share) => share.shared_with_email.toLowerCase() === normalized,
  );
  if (mine.length === 0) return [];

  const ownerIds = [...new Set(mine.map((share) => share.owner_id))];
  const { data: profiles, error: profileError } = await supabase!
    .from("profiles")
    .select("id, full_name")
    .in("id", ownerIds);
  if (profileError) throw profileError;

  return ownerIds.map((ownerId) => ({
    ownerId,
    ownerName:
      profiles?.find((profile) => profile.id === ownerId)?.full_name || "Someone",
  }));
}

export async function fetchOwnerName(ownerId: string): Promise<string | null> {
  const { data } = await supabase!
    .from("profiles")
    .select("full_name")
    .eq("id", ownerId)
    .maybeSingle();
  return data?.full_name ?? null;
}
