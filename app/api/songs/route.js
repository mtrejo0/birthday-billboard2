import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import billboard from 'billboard-top-100';

// Dictionary to store cached song information
const songCache = new Map();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function searchSong(query) {
  // Check if the song is already cached
  if (songCache.has(query)) {
    return songCache.get(query);
  }

  try {
    // Get access token
    const auth = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(auth.body.access_token);

    // Perform the search
    const response = await spotifyApi.searchTracks(query, { limit: 1 });

    if (response.body.tracks.items.length > 0) {
      const track = response.body.tracks.items[0];
      const songInfo = {
        name: track.name,
        id: track.id,
        img: track.album.images[0].url,
      };
      
      // Cache the result
      songCache.set(query, songInfo);
      return songInfo;
    }
    
    throw new Error('No tracks found');
  } catch (error) {
    console.error('Error searching song:', error);
    throw error;
  }
}

async function getTopSongs(date) {
  return new Promise((resolve, reject) => {
    billboard.getChart('hot-100', date, async (err, chart) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const topTen = chart.songs.slice(0, 10);
        const songs = await Promise.all(
          topTen.map(async (song) => {
            const query = `${song.title} ${song.artist}`;
            return await searchSong(query);
          })
        );
        resolve(songs);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const songs = await getTopSongs(date);
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
