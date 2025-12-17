import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    serverTimestamp,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
// Using only standard, highly-compatible icons to prevent crashes
import {
    Clapperboard,
    PenTool,
    Home,
    Search,
    Menu,
    X,
    ChevronRight,
    Film,
    Star,
    User,
    Image as ImageIcon,
    Trash2,
    Calendar,
    Upload,
    Camera,
    Lock,
    LogOut,
    Shield,
    Tv,
    Globe,
    PlayCircle,
    Flame,
    Zap,
    Activity,
    Award,
    Download,
    RefreshCw,
    Search as SearchIcon,
    Settings,
    Music,
    Users,
    Video,
    Database,
    Mail,
    ArrowLeft,
    Clock,
    Construction
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper Functions ---
const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
        case 'netflix': return 'bg-red-600 text-white';
        case 'prime video': return 'bg-blue-500 text-white';
        case 'disney+': return 'bg-blue-900 text-white';
        case 'hulu': return 'bg-green-500 text-black';
        case 'hbo max': return 'bg-purple-700 text-white';
        case 'apple tv+': return 'bg-gray-200 text-black';
        default: return 'bg-zinc-700 text-white';
    }
};

// --- Components ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
    </div>
);

const AdminLoginModal = ({ onClose, onLogin }) => {
    const [view, setView] = useState('login'); // 'login' | 'forgot'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === '2024') {
            onLogin();
            onClose();
        } else {
            setStatus({ type: 'error', msg: 'INVALID CREDENTIALS' });
        }
    };

    const handleReset = (e) => {
        e.preventDefault();
        if (!resetEmail.includes('@')) {
            setStatus({ type: 'error', msg: 'INVALID EMAIL ADDRESS' });
            return;
        }
        setStatus({ type: 'success', msg: 'Reset link sent! Check your inbox.' });
        setTimeout(() => {
            setView('login');
            setStatus({ type: '', msg: '' });
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-sm w-full shadow-2xl relative overflow-hidden">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-zinc-800 rounded-full mb-4">
                        <Lock className="text-[var(--primary)]" size={24} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white">
                        {view === 'login' ? 'Staff Access' : 'Reset Password'}
                    </h2>
                </div>

                {view === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setStatus({ type: '', msg: '' }); }}
                                placeholder="Username"
                                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-[var(--primary)] outline-none transition-colors placeholder-zinc-600"
                                autoFocus
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setStatus({ type: '', msg: '' }); }}
                                placeholder="Password"
                                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-[var(--primary)] outline-none transition-colors placeholder-zinc-600"
                            />
                        </div>

                        {status.msg && (
                            <p className={`text-xs text-center font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {status.msg}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                className="w-full py-3 bg-[var(--primary)] text-black font-bold uppercase tracking-wider rounded-sm hover:opacity-90"
                            >
                                Login
                            </button>
                            <div className="flex justify-between items-center text-xs w-full mt-2">
                                <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white font-bold uppercase px-2 py-1">Cancel</button>
                                <button type="button" onClick={() => { setView('forgot'); setStatus({ type: '', msg: '' }); }} className="text-zinc-500 hover:text-[var(--primary)] hover:underline px-2 py-1">Forgot Password?</button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-zinc-400 text-xs mb-2 text-center">Enter your registered email to receive a reset link.</p>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => { setResetEmail(e.target.value); setStatus({ type: '', msg: '' }); }}
                                    placeholder="admin@theweekendcinema.com"
                                    className="w-full bg-black border border-zinc-700 rounded p-3 pl-10 text-white focus:border-[var(--primary)] outline-none transition-colors placeholder-zinc-600"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {status.msg && (
                            <p className={`text-xs text-center font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {status.msg}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                className="w-full py-3 bg-zinc-100 text-black font-bold uppercase tracking-wider rounded-sm hover:bg-white"
                            >
                                Send Reset Link
                            </button>
                            <button
                                type="button"
                                onClick={() => { setView('login'); setStatus({ type: '', msg: '' }); }}
                                className="text-zinc-500 hover:text-white text-xs font-bold uppercase text-center flex items-center justify-center gap-2 mt-2"
                            >
                                <ArrowLeft size={14} /> Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const SettingsModal = ({ onClose, onSave, onSync, initialKey, initialGeminiKey }) => {
    const [key, setKey] = useState(initialKey || '');
    const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncClick = async () => {
        if (!key) return;
        setIsSyncing(true);
        await onSync(key);
        setIsSyncing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <Settings size={20} /> API Settings
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-zinc-500 hover:text-white" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">TMDB API Key (v3)</label>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Enter TMDB Key..."
                            className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm focus:border-[var(--primary)] outline-none font-mono mb-2"
                        />
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Google Gemini API Key</label>
                        <input
                            type="text"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Enter Gemini Key..."
                            className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm focus:border-[var(--primary)] outline-none font-mono"
                        />
                        <p className="text-[10px] text-zinc-600 mt-2">
                            TMDB for Sync. Gemini for AI Writer.
                        </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSyncClick}
                            disabled={!key || isSyncing}
                            className="flex-1 py-3 bg-zinc-800 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                            {isSyncing ? 'Syncing...' : 'Sync Trends'}
                        </button>
                        <button
                            onClick={() => onSave(key, geminiKey)}
                            className="flex-1 py-3 bg-[var(--primary)] text-black font-bold uppercase tracking-wider rounded-sm hover:opacity-90"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ onViewChange, currentView, user, isAdmin, onLogout, onLoginClick, onOpenSettings }) => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { id: 'home', label: 'Box Office', icon: Home },
        { id: 'ott', label: 'OTT Guide', icon: Tv },
        ...(isAdmin ? [{ id: 'editor', label: 'Write Review', icon: PenTool }] : []),
    ];

    return (
        <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => onViewChange('home')}
                    >
                        <div className="p-2 rounded text-black transform group-hover:rotate-12 transition-transform duration-300 bg-[var(--primary)]">
                            <Clapperboard size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tighter text-white uppercase font-serif leading-none">
                                The Weekend
                            </span>
                            <span className="text-xs font-medium tracking-[0.3em] uppercase leading-none mt-1 text-[var(--primary)]">
                                Cinema
                            </span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 uppercase tracking-widest ${currentView === item.id ? 'text-[var(--primary)]' : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </button>
                        ))}

                        {isAdmin && (
                            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6 ml-2">
                                <button
                                    onClick={onOpenSettings}
                                    className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full"
                                    title="API Settings"
                                >
                                    <Settings size={18} />
                                </button>
                                <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[var(--primary)]/10 rounded-full">
                                    <Lock size={14} />
                                    <span>Admin Mode</span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="text-zinc-500 hover:text-white transition-colors p-2"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-zinc-400 hover:text-white p-2"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onViewChange(item.id);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-4 text-left text-base font-medium ${currentView === item.id ? 'bg-zinc-800 text-[var(--primary)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                        {isAdmin ? (
                            <>
                                <button
                                    onClick={() => { onOpenSettings(); setIsOpen(false); }}
                                    className="w-full text-left px-3 py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"
                                >
                                    <Settings size={16} /> API Settings
                                </button>
                                <button
                                    onClick={() => { onLogout(); setIsOpen(false); }}
                                    className="w-full text-left px-3 py-4 text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"
                                >
                                    <LogOut size={16} /> Logout Admin
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { onLoginClick(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"
                            >
                                <Lock size={16} /> Staff Login
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const OTTView = ({ tmdbKey, isAdmin, onImport }) => {
    const [movies, setMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('now_playing');
    const [language, setLanguage] = useState('');
    const [year, setYear] = useState('');
    const [genre, setGenre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('popularity.desc');

    useEffect(() => {
        fetchMovies();
    }, [category, tmdbKey, language, year, genre, sortBy]);

    const fetchMovies = async (query = '') => {
        if (!tmdbKey) return;
        setLoading(true);
        setError(null);
        try {
            let url;

            // 1. Search Mode (Global)
            if (query) {
                url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            }
            // 2. Discover Mode (Filters Active: Lang, Year, Genre)
            else if (language || year || genre) {
                // If filters are active, we use the explicit 'sortBy' state
                // This allows users to find "Best Rated" from 1980, etc.
                let discoverUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbKey}&sort_by=${sortBy}&page=1&include_adult=false&vote_count.gte=10`;

                if (language) discoverUrl += `&with_original_language=${language}`;
                if (year) discoverUrl += `&primary_release_year=${year}`;
                if (genre) discoverUrl += `&with_genres=${genre}`;

                url = discoverUrl;
            }
            // 3. Global Standard Mode (Trending/Popular)
            else {
                // When no filters are active, we map the 'category' pill to an endpoint
                url = `https://api.themoviedb.org/3/movie/${category}?api_key=${tmdbKey}&language=en-US&page=1`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch from TMDB');
            const data = await res.json();
            setMovies(data.results || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMovies(searchQuery);
    };

    if (!tmdbKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <Settings size={48} className="text-zinc-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Setup Required</h2>
                <p className="text-zinc-500 max-w-md">Please enter your TMDB API Key in Settings to enable the Live Movie Browser.</p>
            </div>
        );
    }

    const languageList = [
        { code: '', label: 'Global' },
        { code: 'hi', label: 'Hindi (India)' },
        { code: 'te', label: 'Telugu (India)' },
        { code: 'ta', label: 'Tamil (India)' },
        { code: 'kn', label: 'Kannada (India)' },
        { code: 'ml', label: 'Malayalam (India)' },
        { code: 'mr', label: 'Marathi (India)' },
        { code: 'bn', label: 'Bengali (India)' },
        { code: 'pa', label: 'Punjabi (India)' },
        { code: 'gu', label: 'Gujarati (India)' },
        { code: 'or', label: 'Odia (India)' }
    ];

    const genreList = [
        { id: '', name: 'All Genres' },
        { id: '28', name: 'Action' },
        { id: '12', name: 'Adventure' },
        { id: '16', name: 'Animation' },
        { id: '35', name: 'Comedy' },
        { id: '80', name: 'Crime' },
        { id: '99', name: 'Documentary' },
        { id: '18', name: 'Drama' },
        { id: '10751', name: 'Family' },
        { id: '14', name: 'Fantasy' },
        { id: '36', name: 'History' },
        { id: '27', name: 'Horror' },
        { id: '10402', name: 'Music' },
        { id: '9648', name: 'Mystery' },
        { id: '10749', name: 'Romance' },
        { id: '878', name: 'Sci-Fi' },
        { id: '53', name: 'Thriller' },
        { id: '10752', name: 'War' },
        { id: '37', name: 'Western' },
    ];

    const sortOptions = [
        { value: 'popularity.desc', label: 'Most Popular' },
        { value: 'vote_average.desc', label: 'Top Rated' },
        { value: 'primary_release_date.desc', label: 'Newest First' },
    ];

    const yearList = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i + 1);

    const isFiltered = language || year || genre;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 sticky top-0 bg-black/90 backdrop-blur z-50 py-4 border-b border-zinc-900">

                <div className="flex flex-col gap-4 w-full md:w-auto">
                    {/* Categories / Sort */}
                    <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0">
                        {!isFiltered ? (
                            ['now_playing', 'popular', 'top_rated', 'upcoming'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setCategory(cat); setSearchQuery(''); }}
                                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors whitespace-nowrap ${category === cat && !searchQuery ? 'bg-[var(--primary)] text-black' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    {cat.replace('_', ' ')}
                                </button>
                            ))
                        ) : (
                            // Show Sort Dropdown when Filtered
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-black text-[var(--primary)] text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Filters: Language, Year, Genre */}
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)] w-full md:w-auto appearance-none cursor-pointer"
                        style={{ backgroundImage: 'none' }}
                    >
                        {languageList.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)] w-full md:w-auto appearance-none cursor-pointer"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="">Year: All</option>
                        {yearList.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)] w-full md:w-auto appearance-none cursor-pointer"
                        style={{ backgroundImage: 'none' }}
                    >
                        {genreList.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    <form onSubmit={handleSearch} className="relative w-full md:w-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="bg-zinc-900 border border-zinc-800 text-white rounded-full py-2 pl-4 pr-10 w-full md:w-64 focus:border-[var(--primary)] outline-none text-sm"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <Search size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-[var(--primary)]" size={32} /></div>
            ) : error ? (
                <div className="text-red-500 text-center py-20">{error}</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {movies.map(movie => (
                        <div key={movie.id} className="group relative bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800 hover:border-[var(--primary)] transition-all">
                            <div className="aspect-[2/3] overflow-hidden bg-zinc-900">
                                {movie.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700"><Film size={32} /></div>
                                )}

                                {isAdmin && (
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <button
                                            onClick={() => onImport(movie)}
                                            className="bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                                        >
                                            <PenTool size={14} /> Write Review
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="text-white font-bold text-sm truncate" title={movie.title}>{movie.title}</h3>
                                <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                                    <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                                    <span className="flex items-center gap-1 text-[var(--primary)]"><Star size={10} fill="currentColor" /> {movie.vote_average?.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Editor = ({ user, onCancel, onSave, onAI, isAILoading, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('Review');
    const [rating, setRating] = useState(4);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setExcerpt(initialData.excerpt || '');
            setImageUrl(initialData.imageUrl || '');
            setRating(initialData.rating || 4);
            if (initialData.category) setCategory(initialData.category);
        }
    }, [initialData]);

    const handleAIClick = async () => {
        const result = await onAI(title); // Call parent handler
        if (result) {
            setTitle(result.title || title);
            setContent(result.content || content);
            setExcerpt(result.excerpt || result.content?.substring(0, 100) || excerpt);
            setRating(result.rating || 4);
            // setCategory(result.category || 'Review'); // Optional
        }
    };

    const handleRandomImage = () => {
        setImageUrl(`https://placehold.co/1200x800/222222/FFFFFF?text=${encodeURIComponent(title || "Poster")}`);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        setIsSaving(true);
        try {
            await onSave({
                title,
                content,
                excerpt: excerpt || content.substring(0, 150) + '...',
                imageUrl: imageUrl || `https://placehold.co/1200x800/222222/FFFFFF?text=${encodeURIComponent(title)}`,
                category,
                rating: Number(rating),
                author: 'Staff Critic',
                userId: user.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-serif font-bold text-white mb-8 border-b border-zinc-800 pb-4">
                Write a Review
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Headline</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[var(--primary)] text-3xl md:text-4xl font-serif text-white placeholder-zinc-700 py-2 outline-none transition-colors"
                        placeholder="The Godfather Part IV?"
                        required
                    />
                </div>

                {/* Category & Rating */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Section</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded p-3 focus:border-[var(--primary)] outline-none"
                        >
                            <option>Review</option>
                            <option>News</option>
                            <option>Essay</option>
                            <option>Interview</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Rating (Stars)</label>
                        <div className="flex gap-2 items-center h-full">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`${star <= rating ? 'text-[var(--primary)]' : 'text-zinc-700'} hover:opacity-80 transition-colors`}
                                >
                                    <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Cover Image</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded p-3 text-sm focus:border-[var(--primary)] outline-none font-mono"
                            placeholder="https://..."
                        />
                        <button
                            type="button"
                            onClick={handleRandomImage}
                            className="px-4 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                            title="Get Random Cinema Image"
                        >
                            <ImageIcon size={20} />
                        </button>
                        <label className="px-4 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors cursor-pointer flex items-center justify-center" title="Upload Image">
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            <Upload size={20} />
                        </label>
                    </div>
                    {imageUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded border border-zinc-800">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Excerpt (Teaser)</label>
                    <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded p-4 h-24 focus:border-[var(--primary)] outline-none resize-none font-light"
                        placeholder="A short summary to hook the reader..."
                    />
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Article Body</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded p-4 h-96 focus:border-[var(--primary)] outline-none font-serif text-lg leading-relaxed"
                        placeholder="Write your masterpiece here..."
                        required
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-zinc-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3 bg-[var(--primary)] hover:opacity-90 text-black font-bold uppercase tracking-widest text-xs transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Publishing...' : 'Publish Article'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const Hero = ({ featuredPost, onRead }) => {
    if (!featuredPost) return null;

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-zinc-900 overflow-hidden group cursor-pointer" onClick={() => onRead(featuredPost)}>
            {/* Background Image with Gradient */}
            <div className="absolute inset-0">
                <img
                    src={featuredPost.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80"}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col items-start">
                <span className="text-black text-xs font-bold px-3 py-1 uppercase tracking-widest mb-4 bg-[var(--primary)]">
                    Featured Premiere
                </span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 max-w-4xl leading-tight">
                    {featuredPost.title}
                </h1>
                <p className="text-zinc-300 text-lg md:text-xl max-w-2xl line-clamp-2 mb-6 font-light">
                    {featuredPost.excerpt}
                </p>
                <button className="flex items-center gap-2 text-white border border-white/30 px-6 py-3 hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-sm font-bold hover:border-[var(--primary)]">
                    Read Review <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

const ArticleCard = ({ post, onRead }) => (
    <div
        onClick={() => onRead(post)}
        className="group cursor-pointer flex flex-col bg-zinc-900/50 border border-zinc-800 hover:border-[var(--primary)] transition-all duration-300 overflow-hidden"
    >
        <div className="relative aspect-video overflow-hidden">
            <img
                src={post.imageUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80"}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur p-2 rounded-full text-[var(--primary)]">
                <Film size={16} />
            </div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                <Calendar size={12} />
                {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just Now'}
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                {post.title}
            </h3>
            <p className="text-zinc-400 text-sm line-clamp-3 mb-4 font-light leading-relaxed">
                {post.excerpt}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
                        {post.author ? post.author[0].toUpperCase() : 'A'}
                    </div>
                    <span className="text-xs text-zinc-500">{post.author || 'Staff Writer'}</span>
                </div>
                <div className="flex gap-0.5 text-[var(--primary)]">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < (post.rating || 4) ? "currentColor" : "none"} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const ArticleView = ({ post, onBack, onDelete, user, isAdmin }) => {
    return (
        <div className="min-h-screen bg-black text-zinc-300">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-[var(--primary)] mb-8 transition-colors uppercase text-xs tracking-widest"
                >
                    <ChevronRight className="rotate-180" size={14} /> Back to Box Office
                </button>

                <header className="mb-12 text-center">
                    <span className="inline-block text-[var(--primary)] text-xs font-bold tracking-[0.2em] uppercase mb-4 border border-[var(--primary)] px-3 py-1 rounded-full" style={{ borderColor: 'var(--primary)', opacity: 0.9 }}>
                        {post.category || 'Film Review'}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
                        <span>By <span className="text-white border-b border-zinc-700 pb-0.5">{post.author || 'Staff'}</span></span>
                        <span>•</span>
                        <span>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}</span>
                    </div>
                </header>

                <div className="aspect-[21/9] w-full mb-12 overflow-hidden rounded-sm bg-zinc-900 border border-zinc-900">
                    <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <article className="prose prose-invert prose-lg max-w-none mx-auto prose-headings:font-serif prose-headings:text-white prose-a:text-[var(--primary)] prose-img:rounded-sm">
                    {post.content.split('\n').map((paragraph, idx) => (
                        paragraph.trim() && <p key={idx} className="mb-6 leading-relaxed text-zinc-300 font-light">{paragraph}</p>
                    ))}
                </article>

                {isAdmin && (
                    <div className="mt-16 pt-8 border-t border-zinc-800 flex justify-end">
                        <button
                            onClick={() => onDelete(post.id)}
                            className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm uppercase tracking-widest border border-red-500/20 px-4 py-2 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={14} /> Delete Article (Admin)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home');
    const [posts, setPosts] = useState([]);
    // Removed guideMovies state
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [themeColor, setThemeColor] = useState('#f59e0b'); // Default Amber
    const [isAdmin, setIsAdmin] = useState(false); // Security: Disabled by default
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [tmdbKey, setTmdbKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [draftPost, setDraftPost] = useState(null);

    // 1. Auth Setup
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Auth error", err);
                // If auth fails (e.g. missing config), stop loading so user sees the app
                setLoading(false);
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            // If we have no user (logged out or auth failed), stop loading
            if (!u) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Load Local Storage
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('twc_theme');
            if (savedTheme) setThemeColor(savedTheme);
            // Restore Admin Persistence
            const savedAdmin = localStorage.getItem('twc_admin');
            if (savedAdmin === 'true') setIsAdmin(true);

            const savedKey = localStorage.getItem('tmdb_key');
            if (savedKey) {
                setTmdbKey(savedKey);
            } else if (typeof window.TMDB_KEY !== 'undefined' && window.TMDB_KEY) {
                setTmdbKey(window.TMDB_KEY);
            }

            const savedGemini = localStorage.getItem('gemini_key');
            if (savedGemini) setGeminiKey(savedGemini);

        } catch (e) {
            console.warn("Could not load local settings", e);
        }
    }, []);

    // 3. Data Fetching
    useEffect(() => {
        if (!user) {
            // If no user, ensure we aren't loading indefinitely
            setLoading(false);
            return;
        }

        // Fetch Articles
        setLoading(true); // Start loading when fetching posts
        const qPosts = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'posts'),
            orderBy('createdAt', 'desc')
        );

        const unsubPosts = onSnapshot(qPosts, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(fetchedPosts);
            setLoading(false);
        }, (error) => {
            console.error("Data fetch error:", error);
            setLoading(false); // Stop loading on error
        });

        return () => {
            unsubPosts();
        };
    }, [user]);

    // Handle theme changes (internal only now, or via stored pref)
    const handleThemeChange = (color) => {
        setThemeColor(color);
        localStorage.setItem('twc_theme', color);
    };

    const handleAdminLogin = () => {
        setIsAdmin(true);
        // Persist admin state
        localStorage.setItem('twc_admin', 'true');
    };

    const handleAdminLogout = () => {
        setIsAdmin(false);
        localStorage.removeItem('twc_admin');
        if (view === 'editor') setView('home');
    };

    const handleImportMovie = (movie) => {
        setDraftPost({
            title: movie.title,
            content: movie.overview,
            excerpt: movie.overview,
            imageUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            rating: Math.ceil(movie.vote_average / 2),
            category: 'Review',
            tmdbId: movie.id
        });
        setView('editor');
    };

    const handleSaveSettings = (tKey, gKey) => {
        setTmdbKey(tKey);
        setGeminiKey(gKey);
        localStorage.setItem('tmdb_key', tKey);
        localStorage.setItem('gemini_key', gKey);
        setShowSettingsModal(false);
    };

    const handleAIAssist = async (topic) => {
        if (!geminiKey) {
            alert("Please enter a Gemini API Key in Settings first.");
            return;
        }
        setIsAILoading(true);
        try {
            const prompt = `Generate a JSON object for a movie blog post about "${topic}". Fields: title (string), content (3 paragraphs string), excerpt (string), rating (number 1-5). Do not return markdown, just raw JSON.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                // Clean markdown if present
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
                const result = JSON.parse(jsonStr);
                // We need to return this to the editor. 
                // Since Editor is a child, we need to pass a callback or return logic.
                // Actually, checking how Editor uses it. It calls onAI(topic).
                // We need to update Editor to accept a callback for results? 
                // Or better yet, move this logic TO the Editor? 
                // No, keeping it here is better for key management.
                // Wait, Editor needs to SET its local state. 
                // Returning the result here allows Editor to await it.
                setIsAILoading(false);
                return result;
            }
        } catch (e) {
            console.error(e);
            alert("AI Error: " + e.message);
        }
        setIsAILoading(false);
        return null;
    };

    const handleSyncTrends = async (key) => {
        if (!user || !isAdmin) return;
        try {
            const resp = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${key}`);
            if (!resp.ok) throw new Error("Failed to fetch from TMDB");
            const data = await resp.json();

            const batch = writeBatch(db);
            let count = 0;

            for (const movie of data.results.slice(0, 5)) { // Top 5 only
                const docRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'));
                const postData = {
                    title: movie.title,
                    content: movie.overview,
                    excerpt: movie.overview,
                    imageUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                    category: 'Trending',
                    rating: Math.round(movie.vote_average / 2), // 10 -> 5 scale
                    author: 'TMDB Bot',
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                    tmdbId: movie.id
                };
                batch.set(docRef, postData);
                count++;
            }
            await batch.commit();
            alert(`Sync Complete! Added ${count} trending movies.`);
            setShowSettingsModal(false);
        } catch (err) {
            console.error("Sync error:", err);
            alert("Sync Failed: " + err.message);
        }
    };

    const handleSavePost = async (postData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), postData);
            setView('home');
        } catch (err) {
            console.error("Error saving post:", err);
            alert("Failed to publish article. Please try again.");
        }
    };

    const handleDeletePost = async (postId) => {
        if (!user || !isAdmin) return;
        if (confirm('Are you sure you want to delete this masterpiece?')) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', postId));
                setSelectedPost(null);
                setView('home');
            } catch (err) {
                console.error("Error deleting:", err);
            }
        }
    };

    const featuredPost = useMemo(() => posts[0], [posts]);
    const regularPosts = useMemo(() => posts.slice(1), [posts]);

    // --- Rendering ---

    const styleTag = `
    :root {
      --primary: ${themeColor};
    }
    ::selection {
      background-color: var(--primary);
      color: black;
    }
  `;

    if (loading) return (
        <>
            <style>{styleTag}</style>
            <div className="min-h-screen bg-black flex flex-col justify-center items-center">
                <Clapperboard className="text-[var(--primary)] animate-bounce mb-4" size={48} />
                <span className="text-zinc-500 uppercase tracking-widest text-xs">Loading Studio...</span>
            </div>
        </>
    );

    return (
        <>
            <style>{styleTag}</style>
            <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col justify-between">
                <div>
                    <Navbar
                        onViewChange={(v) => {
                            setView(v);
                            setSelectedPost(null);
                        }}
                        currentView={view}
                        user={user}
                        isAdmin={isAdmin}
                        onLoginClick={() => setShowLoginModal(true)}
                        onLogout={handleAdminLogout}
                        onOpenSettings={() => setShowSettingsModal(true)}
                    />

                    {showLoginModal && (
                        <AdminLoginModal
                            onClose={() => setShowLoginModal(false)}
                            onLogin={handleAdminLogin}
                        />
                    )}

                    {showSettingsModal && (
                        <SettingsModal
                            onClose={() => setShowSettingsModal(false)}
                            onSave={handleSaveSettings}
                            onSync={handleSyncTrends}
                            initialKey={tmdbKey}
                            initialGeminiKey={geminiKey}
                        />
                    )}

                    {selectedPost ? (
                        <ArticleView
                            post={selectedPost}
                            onBack={() => {
                                setSelectedPost(null);
                                setView('home');
                            }}
                            onDelete={handleDeletePost}
                            user={user}
                            isAdmin={isAdmin}
                        />
                    ) : view === 'editor' && isAdmin ? (
                        <Editor
                            user={user}
                            onCancel={() => setView('home')}
                            onSave={handleSavePost}
                            onAI={handleAIAssist}
                            isAILoading={isAILoading}
                            initialData={draftPost}
                        />
                    ) : view === 'ott' ? (
                        <OTTView tmdbKey={tmdbKey} isAdmin={isAdmin} onImport={handleImportMovie} />
                    ) : (
                        <main>
                            {posts.length > 0 ? (
                                <>
                                    <Hero
                                        featuredPost={featuredPost}
                                        onRead={(post) => setSelectedPost(post)}
                                    />

                                    <div className="max-w-7xl mx-auto px-4 py-16">
                                        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                                            <h2 className="text-2xl font-serif text-white">Latest Releases & Reviews</h2>
                                            <div className="flex gap-4 text-xs text-zinc-500 uppercase tracking-widest">
                                                <span>All</span>
                                                <span className="hover:text-[var(--primary)] cursor-pointer">Reviews</span>
                                                <span className="hover:text-[var(--primary)] cursor-pointer">News</span>
                                            </div>
                                        </div>

                                        {regularPosts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {regularPosts.map(post => (
                                                    <ArticleCard
                                                        key={post.id}
                                                        post={post}
                                                        onRead={(p) => setSelectedPost(p)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 bg-zinc-900/30 rounded border border-zinc-800 border-dashed">
                                                <p className="text-zinc-500 mb-4">No other articles yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                                    <div className="bg-zinc-900 p-8 rounded-full mb-8">
                                        <Clapperboard size={64} className="text-[var(--primary)]" />
                                    </div>
                                    <h1 className="text-4xl font-serif font-bold text-white mb-4">The Weekend Cinema</h1>
                                    <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
                                        Coming Soon.
                                    </p>
                                </div>
                            )}
                        </main>
                    )}
                </div>

                <footer className="bg-zinc-950 border-t border-zinc-900 py-12 mt-12">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 opacity-50">
                            <Clapperboard size={20} className="text-zinc-100" />
                            <span className="font-serif font-bold text-lg">TWC</span>
                        </div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest text-center md:text-left">
                            © 2024 The Weekend Cinema. All rights reserved. <span className="opacity-50 ml-2">v1.2 (Persistent)</span>
                        </div>
                        <div className="flex gap-6 text-zinc-600 items-center">
                            <span className="hover:text-white cursor-pointer transition-colors"><Search size={18} /></span>

                            {!isAdmin && (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="hover:text-white transition-colors flex items-center gap-2"
                                    title="Staff Login"
                                >
                                    <Lock size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default App;
