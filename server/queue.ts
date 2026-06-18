import { setState } from './state';
import { TrackInfo } from './types';

export async function loadAudioQueue(): Promise<void> {
  try {
    let bucketUrl = process.env.MGC_ENDPOINT || 'https://br-se1.magaluobjects.com';
    const bucketName = process.env.MGC_BUCKET_NAME || 'parakeet-acceptable-harlequin';
    const channel = process.env.ACTIVE_CHANNEL || 'lofi-channel';

    if (bucketUrl.includes(bucketName)) {
      bucketUrl = bucketUrl.replace(`${bucketName}.`, '');
    }

    const url = `${bucketUrl}/${bucketName}/${channel}/songs.json`;
    console.log(`[server] Fetching queue from cloud: ${url}`);
    
    let res;
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(url);
        if (res.ok) break;
        console.warn(`[server] Fetch attempt ${i + 1} returned status: ${res.status}, retrying...`);
      } catch (e) {
        console.warn(`[server] Fetch attempt ${i + 1} failed: ${(e as Error).message}, retrying...`);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!res || !res.ok) {
       console.warn(`[server] Failed to fetch remote queue from ${url}. Status: ${res?.status}`);
       return;
    }
    
    const data = await res.json();
    
    const queue: TrackInfo[] = data.map((item: any) => ({
      id: item.song.song_name.toLowerCase().replace(/\s+/g, '-'),
      filename: `${item.song.author} - ${item.song.song_name}`,
      path: item.s3_audio_url,
      s3_audio_url: item.s3_audio_url,
      s3_video_url: item.s3_video_url,
      album_image: item.album_image,
      metadata: {
        artist: item.song.author,
        genre: item.provider || 'AuraStream',
        source: 'S3',
        song_name: item.song.song_name,
        album_image: item.album_image,
        provider: item.provider,
        download_stream_url: item.download_stream_url,
        watch_url: item.watch_url,
      }
    }));

    setState({ queue, currentTrack: queue[0] ?? null });
    console.log(`[server] Cloud queue loaded: ${queue.length} tracks`);
  } catch (err) {
    console.error('[server] failed to load cloud audio queue:', (err as Error).message);
  }
}
