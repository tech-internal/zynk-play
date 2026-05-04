import { apiFetch, parseJsonOrThrow } from './client';

export type UserProfile = {
  id: string;
  phone_number: string;
  username: string | null;
  full_name: string;
  email: string;
  country: string;
  status: string;
  role: string;
  free_trial_used: boolean;
  last_login_at: string | null;
  has_active_subscription: boolean;
  has_game_entitlement: boolean;
  has_streaming_entitlement: boolean;
  can_use_free_trial: boolean;
  profile_complete: boolean;
  created_at: string;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await apiFetch('/api/v1/users/me');
  return parseJsonOrThrow(res) as Promise<UserProfile>;
}

export async function updateUserProfile(partial: {
  username?: string | null;
  full_name?: string;
  email?: string;
  country?: string;
}): Promise<UserProfile> {
  const res = await apiFetch('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
  return parseJsonOrThrow(res) as Promise<UserProfile>;
}
