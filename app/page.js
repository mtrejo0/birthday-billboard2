'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    // Read date from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
      // Automatically fetch songs if date is in URL
      fetchSongs(dateParam);
    }
  }, []);

  const fetchSongs = async (date) => {
    setLoading(true);
    setLoadingText('Loading...');

    try {
      const response = await axios.get('/api/songs', {
        params: { date },
      });
      setSongs(response.data);
      setLoadingText('Songs loaded successfully!');
    } catch (error) {
      console.error('Error loading songs:', error);
      setLoadingText('Error loading songs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    fetchSongs(selectedDate);
    // Update URL with selected date
    const newUrl = `${window.location.pathname}?date=${selectedDate}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?date=${selectedDate}`;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="flex flex-col items-center text-center min-h-screen bg-background text-foreground pb-24">
      <main className="flex flex-col items-center w-full max-w-4xl px-4">
        <h1 className="text-4xl font-bold mb-4 mt-12">Discover your Birthday Billboard!</h1>
        <p className="mb-4">Enter your birthday:</p>
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-background [color-scheme:light] [&::-webkit-calendar-picker-indicator]:invert"
            style={{
              caretColor: 'transparent',
              cursor: 'pointer',
              WebkitCalendarPickerIndicator: {
                opacity: 1
              }
            }}
          />
          <button 
            type="submit"
            className="rounded-full bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            Submit
          </button>
        </form>

        {loading && (
          <div className="mt-4">
            <p>{loadingText}</p>
            <p className="text-sm text-gray-500">(This may take up to 30 seconds)</p>
          </div>
        )}

        {songs?.length > 0 && !loading && (
          <div className="w-full">
            <div className="flex justify-center w-full">
              <button
                onClick={handleCopyLink}
                className="mt-4 rounded-full bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors flex items-center gap-2"
              >
                Copy Link
              </button>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-6">Top 10 songs on your birthday:</h2>
            <div className="flex flex-col gap-4">
              {songs.map((song, i) => (
                <div key={song.id} className="flex items-center gap-4">
                  <span className="text-lg font-medium w-8">#{i + 1}</span>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${song.id}`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="encrypted-media"
                    title={song.name}
                    className="rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
