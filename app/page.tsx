import { VideoCard } from '@/components/VideoCard';
import CompetitionHome from '@/components/CompetitionHome';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCompetitionConfig } from '@/lib/competition-server';
import { competitionToday } from '@/lib/competition';
export const dynamic = 'force-dynamic';
async function fetchLatestVideos() {
  try {
    const { data, error } = await getSupabaseAdminClient().from('videos')
      .select('id,title,created_at,mux_playback_id,profiles:profiles!videos_profile_id_fkey(username,avatar_url)')
      .lte('unlock_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(12);
    if (error) throw error;
    return { videos: data ?? [], failed: false };
  } catch (error) {
    console.error('Unable to load home videos', error);
    return { videos: [], failed: true };
  }
}
export default async function Home({ searchParams }: { searchParams: Promise<{ variant?: string; preview?: string }> }) {
  const [params, config, { videos, failed }] = await Promise.all([searchParams, getCompetitionConfig(), fetchLatestVideos()]);
  return <CompetitionHome config={config} date={competitionToday()} initialVariant={params.variant === 'b' ? 'b' : 'a'} preview={params.preview === '1'}>
    {videos.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{videos.map(video => {
      const profile = Array.isArray(video.profiles) ? video.profiles[0] : video.profiles;
      return <VideoCard key={video.id} id={video.id} title={video.title} createdAt={video.created_at} muxPlaybackId={video.mux_playback_id} creatorUsername={profile?.username ?? null} creatorAvatarUrl={profile?.avatar_url} />;
    })}</div> : <div className="empty-screen"><h3>{failed ? 'The screening room is taking a moment.' : 'Be the first on screen.'}</h3><p>{failed ? 'Please refresh to try loading the latest films again.' : 'Have something ready? Give the community its next discovery.'}</p></div>}
  </CompetitionHome>;
}
