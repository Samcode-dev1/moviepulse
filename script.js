// ========== TMDB API CONFIGURATION ==========
const API_KEY = '2cf46afac9dfe9a90bb2098a2678e817';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentCategory = 'upcoming';
let currentMovies = [];
let userRatings = JSON.parse(localStorage.getItem('movieRatings') || '{}');

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function countdown(releaseDate) {
    if (!releaseDate) return '';
    const release = new Date(releaseDate);
    const today = new Date();
    const diff = Math.ceil((release - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '🎬 Released!';
    if (diff === 0) return '🎉 Releases TODAY!';
    return `⏰ ${diff} days to go`;
}

// ========== OPEN MOVIE IN NEW WINDOW ==========
function openMovieWindow(movie) {
    // Create a new window with movie details
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${movie.title} | MoviePulse</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    color: #ffffff;
                    line-height: 1.6;
                    min-height: 100vh;
                }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .poster {
                    width: 100%;
                    max-height: 450px;
                    object-fit: cover;
                    border-radius: 20px;
                    margin: 20px 0;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .title { font-size: 2rem; color: #2196F3; margin-bottom: 15px; }
                .meta {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                    color: #aaa;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #333;
                }
                .overview { line-height: 1.8; color: #ccc; margin: 20px 0; }
                .trailer-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #f44336, #d32f2f);
                    color: white;
                    padding: 12px 28px;
                    border-radius: 40px;
                    text-decoration: none;
                    font-weight: bold;
                    margin: 20px 0;
                    border: none;
                    cursor: pointer;
                }
                .rating-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin: 15px 0;
                }
                .stars { display: flex; gap: 5px; }
                .star {
                    font-size: 28px;
                    cursor: pointer;
                    color: #444;
                    transition: all 0.2s;
                }
                .star.active { color: #FFD700; }
                .cast-section { margin: 20px 0; }
                .cast-list {
                    display: flex;
                    gap: 15px;
                    overflow-x: auto;
                    padding: 10px 0;
                }
                .cast-item { text-align: center; min-width: 85px; }
                .cast-avatar {
                    width: 70px;
                    height: 70px;
                    background: #2a2a2a;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin-bottom: 8px;
                }
                .cast-name { font-size: 11px; color: #aaa; }
                .back-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-bottom: 20px;
                }
                .countdown { color: #4CAF50; margin: 10px 0; font-size: 1rem; }
                @media (max-width: 768px) {
                    .title { font-size: 1.5rem; }
                    .container { padding: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="back-btn" onclick="window.close()">← Close Window</button>
                <h1 class="title">${movie.title}</h1>
                <div class="meta">
                    <span>📅 ${formatDate(movie.release_date)}</span>
                    <span>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</span>
                    <span>⏱️ Loading runtime...</span>
                </div>
                <div class="countdown" id="countdownDiv">${countdown(movie.release_date)}</div>
                ${movie.poster_path ? `<img class="poster" src="${IMG_URL}${movie.poster_path}" alt="${movie.title}">` : '<div style="text-align:center; font-size:64px; padding:50px;">🎬</div>'}
                <div class="rating-section">
                    <span>Rate this movie:</span>
                    <div class="stars" id="ratingStars">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                </div>
                <button class="trailer-btn" id="trailerBtn">🎬 Watch Trailer on YouTube</button>
                <div class="overview" id="overview">Loading movie details...</div>
                <div class="cast-section" id="castSection">
                    <h4>🎭 Top Cast</h4>
                    <div class="cast-list" id="castList">Loading cast...</div>
                </div>
            </div>
            <script>
                const movieId = ${movie.id};
                const API_KEY = '${API_KEY}';
                const IMG_URL = '${IMG_URL}';
                let currentMovie = null;
                let userRatings = JSON.parse(localStorage.getItem('movieRatings_' + movieId) || '{}');
                
                function formatDate(dateStr) {
                    if (!dateStr) return 'TBA';
                    const d = new Date(dateStr);
                    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                
                async function loadMovieDetails() {
                    try {
                        const res = await fetch(\`https://api.themoviedb.org/3/movie/\${movieId}?api_key=\${API_KEY}&append_to_response=credits,videos\`);
                        const data = await res.json();
                        currentMovie = data;
                        
                        document.querySelector('.meta span:last-child').innerHTML = \`⏱️ \${data.runtime || '?'} min\`;
                        document.getElementById('overview').innerHTML = data.overview || 'No description available.';
                        
                        // Load cast
                        const castList = document.getElementById('castList');
                        if (data.credits?.cast?.slice(0, 8)) {
                            castList.innerHTML = data.credits.cast.slice(0, 8).map(actor => \`
                                <div class="cast-item">
                                    <div class="cast-avatar">\${actor.profile_path ? '🎭' : '⭐'}</div>
                                    <div class="cast-name">\${actor.name}</div>
                                    <div style="font-size:10px; color:#666;">\${actor.character?.split(' ').slice(0,2).join(' ') || ''}</div>
                                </div>
                            \`).join('');
                        } else {
                            castList.innerHTML = '<div style="color:#888;">Cast information not available</div>';
                        }
                        
                        // Trailer button
                        const trailer = data.videos?.results?.find(v => v.type === 'Trailer');
                        const trailerBtn = document.getElementById('trailerBtn');
                        if (trailer) {
                            trailerBtn.onclick = () => window.open(\`https://www.youtube.com/watch?v=\${trailer.key}\`, '_blank');
                        } else {
                            trailerBtn.style.display = 'none';
                        }
                        
                        // Load user rating
                        const savedRating = localStorage.getItem('movieRating_' + movieId);
                        if (savedRating) {
                            const rating = parseInt(savedRating);
                            document.querySelectorAll('.star').forEach((star, i) => {
                                if (i + 1 <= rating) star.classList.add('active');
                            });
                        }
                    } catch (err) {
                        document.getElementById('overview').innerHTML = 'Failed to load movie details.';
                    }
                }
                
                // Rating stars
                document.querySelectorAll('.star').forEach(star => {
                    star.addEventListener('click', () => {
                        const rating = parseInt(star.dataset.rating);
                        localStorage.setItem('movieRating_' + movieId, rating);
                        document.querySelectorAll('.star').forEach((s, i) => {
                            if (i + 1 <= rating) s.classList.add('active');
                            else s.classList.remove('active');
                        });
                    });
                });
                
                loadMovieDetails();
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}

// ========== RENDER MOVIES ==========
function renderMovies(movies) {
    const grid = document.getElementById('movieGrid');
    if (!movies || movies.length === 0) {
        grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>No movies found. Try something else!</p></div>';
        return;
    }
    
    grid.innerHTML = movies.map(m => `
        <div class="movie-card" data-id="${m.id}">
            ${m.poster_path ? `<img class="movie-poster" src="${IMG_URL}${m.poster_path}" alt="${m.title}">` : `<div class="movie-placeholder">🎬</div>`}
            <div class="movie-info">
                <div class="movie-title">${m.title || 'Untitled'}</div>
                <div class="movie-date">📅 ${formatDate(m.release_date)}</div>
                <div class="movie-rating">⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}/10</div>
                <div class="countdown">${countdown(m.release_date)}</div>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const movie = currentMovies.find(m => m.id === id);
            if (movie) openMovieWindow(movie);
        });
    });
}

// ========== FETCH MOVIES ==========
async function fetchMovies(category, query = '') {
    const grid = document.getElementById('movieGrid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading movies...</p></div>';
    
    try {
        let url;
        if (query) {
            url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        } else {
            url = `${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=en-US&page=1`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        currentMovies = data.results || [];
        renderMovies(currentMovies);
    } catch (err) {
        grid.innerHTML = '<div class="loading"><p>Failed to load movies. Check your connection.</p></div>';
    }
}

// ========== EVENT LISTENERS ==========
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        document.getElementById('searchInput').value = '';
        fetchMovies(currentCategory);
    });
});

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) fetchMovies('', query);
    else fetchMovies(currentCategory);
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
});

// Scroll to Top Button
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
});

// ========== INITIALIZE ==========
fetchMovies('upcoming');