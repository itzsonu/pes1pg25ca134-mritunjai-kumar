import { MembersClient } from '@/components/MembersClient';
import { listMembersWithStats } from '@/lib/libraryService';
import type { MemberItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  let members: MemberItem[] = [];
  let error: string | null = null;

  try {
    members = await listMembersWithStats();
  } catch {
    error =
      'Unable to load members from PostgreSQL. Verify DATABASE_URL in .env.local and run migrations.';
  }

  return <MembersClient initialMembers={members} initialError={error} />;
}
