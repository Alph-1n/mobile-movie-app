// Services/api.ts - FIXED VERSION

export const TMDB_CONFIG = {
    BASE_URL: "https://api.themoviedb.org/3",
    API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
    headers: {
      accept: "application/json",
      // FIXED: Proper Bearer token format
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
    },
  };
  
  // Type definitions
  export interface Movie {
    id: number;
    title: string;
    poster_path: string;
    overview: string;
    release_date: string;
    vote_average: number;
  }
  
  export interface MovieDetails extends Movie {
    runtime: number;
    genres: { id: number; name: string }[];
    budget: number;
    revenue: number;
  }
  
  // Fetch movies - with or without search query
  export const fetchMovies = async ({
    query,
  }: {
    query: string;
  }): Promise<Movie[]> => {
    try {
      // If query is empty, fetch popular movies
      // If query exists, search for movies
      const endpoint = query
        ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`
        : `${TMDB_CONFIG.BASE_URL}/movie/popular?language=en-US&page=1`;
  
      console.log('Fetching from:', endpoint); // Debug log
  
      const response = await fetch(endpoint, {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      });
  
      if (!response.ok) {
        // More detailed error message
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch movies: ${response.status} - ${response.statusText}. ${errorText}`
        );
      }
  
      const data = await response.json();
      
      // TMDB returns results in a 'results' array
      return data.results || [];
    } catch (error) {
      console.error("Error in fetchMovies:", error);
      throw error; // Re-throw so useFetch can catch it
    }
  };
  
  // Fetch specific movie details
  export const fetchMovieDetails = async (
    movieId: string
  ): Promise<MovieDetails> => {
    try {
      const response = await fetch(
        `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?language=en-US`,
        {
          method: "GET",
          headers: TMDB_CONFIG.headers,
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch movie details: ${response.status} - ${errorText}`
        );
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching movie details:", error);
      throw error;
    }
  };
  
  /* 
  IMPORTANT SETUP STEPS:
  
  1. Make sure your .env file has:
     EXPO_PUBLIC_MOVIE_API_KEY=your_actual_bearer_token_here
  
  2. The token should look like:
     eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ...
  
  3. NOT the API key (v3 auth), but the "Read Access Token" (Bearer token)
     Get it from: https://www.themoviedb.org/settings/api
  
  4. Restart your Expo server after adding the env variable:
     - Stop the dev server (Ctrl+C)
     - Run: npx expo start --clear
  */