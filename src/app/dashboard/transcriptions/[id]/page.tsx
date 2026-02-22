import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// NOTE: The voxa-api does not expose a per-transcription detail endpoint.
// GET /api/v1/dashboard/transcriptions/:id does not exist.
// All transcription data is available via the list endpoint (GET /dashboard/transcriptions).
// This page redirects back to the list until the API adds a detail endpoint.

export default async function TranscriptionDetailPage() {
  redirect('/dashboard/transcriptions');
}
