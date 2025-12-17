import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Construction,
    Save
} from 'lucide-react';

// --- Configuration ---
// No more Firebase!
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

const downloadJSON = (data, filename = 'posts.json') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- Components ---
// (Keeping existing components largely unchanged, just ensuring no firebase refs)

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
    </div>
);

const AdminLoginModal = ({ onClose, onLogin }) => {
    const [view, setView] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        // Hardcoded Simple Auth
        if (username === 'admin' && password === '2024') {
            onLogin();
            onClose();
        } else {
            setStatus({ type: 'error', msg: 'INVALID CREDENTIALS' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-sm w-full shadow-2xl relative">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-zinc-800 rounded-full mb-4">
                        <Lock className="text-[var(--primary)]" size={24} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white">Staff Access</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setStatus({ type: '', msg: '' }); }}
                            placeholder="Username"
                            className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-[var(--primary)] outline-none"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setStatus({ type: '', msg: '' }); }}
                            placeholder="Password"
                            className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-[var(--primary)] outline-none"
                        />
                    </div>

                    {status.msg && (
                        <p className={`text-xs text-center font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                            {status.msg}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                        <button type="submit" className="w-full py-3 bg-[var(--primary)] text-black font-bold uppercase tracking-wider rounded-sm hover:opacity-90">
                            Login
                        </button>
                        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white font-bold uppercase text-xs text-center">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SettingsModal = ({ onClose, onSave, onSync, initialKey, initialGeminiKey }) => {
    const [key, setKey] = useState(initialKey || '');
    const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');

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
                        <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter TMDB Key..." className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm focus:border-[var(--primary)] outline-none font-mono mb-2" />
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Google Gemini API Key</label>
                        <input type="text" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Enter Gemini Key..." className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm focus:border-[var(--primary)] outline-none font-mono" />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => onSave(key, geminiKey)} className="flex-1 py-3 bg-[var(--primary)] text-black font-bold uppercase tracking-wider rounded-sm hover:opacity-90">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ onViewChange, currentView, isAdmin, onLogout, onLoginClick, onOpenSettings }) => {
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
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewChange('home')}>
                        <div className="p-2 rounded text-black transform group-hover:rotate-12 transition-transform duration-300 bg-[var(--primary)]">
                            <Clapperboard size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tighter text-white uppercase font-serif leading-none">The Weekend</span>
                            <span className="text-xs font-medium tracking-[0.3em] uppercase leading-none mt-1 text-[var(--primary)]">Cinema</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <button key={item.id} onClick={() => onViewChange(item.id)} className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 uppercase tracking-widest ${currentView === item.id ? 'text-[var(--primary)]' : 'text-zinc-400 hover:text-white'}`}>
                                <item.icon size={16} /> {item.label}
                            </button>
                        ))}
                        {isAdmin && (
                            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6 ml-2">
                                <button onClick={onOpenSettings} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full" title="API Settings"><Settings size={18} /></button>
                                <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[var(--primary)]/10 rounded-full">
                                    <Lock size={14} /> <span>Admin Mode</span>
                                </div>
                                <button onClick={onLogout} className="text-zinc-500 hover:text-white transition-colors p-2" title="Logout"><LogOut size={18} /></button>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white p-2">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <button key={item.id} onClick={() => { onViewChange(item.id); setIsOpen(false); }} className={`flex items-center gap-3 w-full px-3 py-4 text-left text-base font-medium ${currentView === item.id ? 'bg-zinc-800 text-[var(--primary)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                                <item.icon size={20} /> {item.label}
                            </button>
                        ))}
                        {isAdmin ? (
                            <>
                                <button onClick={() => { onOpenSettings(); setIsOpen(false); }} className="w-full text-left px-3 py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"><Settings size={16} /> API Settings</button>
                                <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left px-3 py-4 text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"><LogOut size={16} /> Logout Admin</button>
                            </>
                        ) : (
                            <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="w-full text-left px-3 py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border-t border-zinc-800 mt-2"><Lock size={16} /> Staff Login</button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const OTTView = ({ tmdbKey, isAdmin, onImport }) => {
    // (Copied verbatim from previous, removed data fetching impl for brevity, assuming standard fetch logic)
    // To match previous functionality, I'll include the fetch logic but streamlined.
    const [contentType, setContentType] = useState('movie');
    const [movies, setMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tmdbLoading, setTmdbLoading] = useState(false);

    // ... Simplified for standard fetch ...
    const fetchMovies = async (queryStr = '') => {
        if (!tmdbKey) return;
        setTmdbLoading(true);
        try {
            // Using a simple popular/search strategy for migration speed
            let url = `https://api.themoviedb.org/3/${queryStr ? 'search/movie' : 'movie/now_playing'}?api_key=${tmdbKey}&language=en-US&page=1`;
            if (queryStr) url += `&query=${encodeURIComponent(queryStr)}`;

            const res = await fetch(url);
            const data = await res.json();
            setMovies(data.results || []);
        } catch (e) { console.error(e); }
        setTmdbLoading(false);
    };

    useEffect(() => { fetchMovies(searchQuery); }, [tmdbKey, searchQuery]);
    const handleSearch = (e) => { e.preventDefault(); fetchMovies(searchQuery); };

    if (!tmdbKey) return <div className="text-center p-10 text-zinc-500">Please enter TMDB Key in Settings.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <form onSubmit={handleSearch} className="mb-6"><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search TMDB..." className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded text-white" /></form>
            {tmdbLoading ? <div className="text-white">Loading...</div> :
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {movies.map(movie => (
                        <div key={movie.id} className="relative group cursor-pointer" onClick={() => isAdmin && onImport(movie)}>
                            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-auto rounded" />
                            {isAdmin && <div className="absolute inset-0 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Import</div>}
                        </div>
                    ))}
                </div>}
        </div>
    );
};

const Editor = ({ onCancel, onSave, onAI, isAILoading, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    const [rating, setRating] = useState(initialData?.rating || 4);
    const [category, setCategory] = useState(initialData?.category || 'Review');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) { alert("Title Required"); return; }
        if (!content) { alert("Content Required"); return; }

        setIsSaving(true);
        try {
            await onSave({
                title, content, excerpt: excerpt || content.substring(0, 100), imageUrl, rating, category,
                id: initialData?.id // Keep ID if editing
            });
        } catch (e) {
            alert("Error: " + e.message);
            setIsSaving(false);
        }
    };

    const handleRandomImage = () => setImageUrl(`https://placehold.co/1200x800/222222/FFFFFF?text=${encodeURIComponent(title || "Poster")}`);

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-serif font-bold text-white mb-8">Write Review</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div><label className="text-xs font-bold text-zinc-500 uppercase">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border-b border-zinc-700 p-2 text-2xl text-white outline-none" placeholder="Movie Title" /></div>
                <div><label className="text-xs font-bold text-zinc-500 uppercase">Image URL (or Random)</label><div className="flex gap-2"><input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 p-2 text-white" /><button type="button" onClick={handleRandomImage} className="bg-zinc-800 text-white px-4 rounded"><ImageIcon size={20} /></button></div></div>
                <div><label className="text-xs font-bold text-zinc-500 uppercase">Content</label><textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-64 bg-zinc-900 border border-zinc-800 p-4 text-white font-serif text-lg" placeholder="Review content..." /></div>
                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={onCancel} className="text-zinc-500 uppercase font-bold text-xs hover:text-white">Cancel</button>
                    <button type="submit" disabled={isSaving} className="bg-[var(--primary)] text-black px-8 py-3 font-bold uppercase text-xs rounded-sm hover:opacity-90">{isSaving ? 'Saving...' : 'Save & Download DB'}</button>
                </div>
            </form>
        </div>
    );
};

const Hero = ({ featuredPost, onRead }) => {
    if (!featuredPost) return null;
    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-zinc-900 overflow-hidden group cursor-pointer" onClick={() => onRead(featuredPost)}>
            <div className="absolute inset-0">
                <img src={featuredPost.imageUrl} alt={featuredPost.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col items-start">
                <span className="text-black text-xs font-bold px-3 py-1 uppercase tracking-widest mb-4 bg-[var(--primary)]">Featured Premiere</span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 max-w-4xl leading-tight">{featuredPost.title}</h1>
                <p className="text-zinc-300 text-lg md:text-xl max-w-2xl line-clamp-2 mb-6 font-light">{featuredPost.excerpt}</p>
                <button className="flex items-center gap-2 text-white border border-white/30 px-6 py-3 hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-sm font-bold hover:border-[var(--primary)]">Read Review <ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

const ArticleCard = ({ post, onRead }) => (
    <div onClick={() => onRead(post)} className="group cursor-pointer flex flex-col bg-zinc-900/50 border border-zinc-800 hover:border-[var(--primary)] transition-all duration-300 overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3 uppercase tracking-wider"><Calendar size={12} /> {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just Now'}</div>
            <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-[var(--primary)] transition-colors line-clamp-2">{post.title}</h3>
            <p className="text-zinc-400 text-sm line-clamp-3 mb-4 font-light leading-relaxed">{post.excerpt}</p>
        </div>
    </div>
);

const ArticleView = ({ post, onBack, onDelete, onEdit, isAdmin }) => {
    return (
        <div className="min-h-screen bg-black text-zinc-300">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-[var(--primary)] mb-8 transition-colors uppercase text-xs tracking-widest"><ChevronRight className="rotate-180" size={14} /> Back to Box Office</button>
                <header className="mb-12 text-center">
                    <span className="inline-block text-[var(--primary)] text-xs font-bold tracking-[0.2em] uppercase mb-4 border border-[var(--primary)] px-3 py-1 rounded-full" style={{ borderColor: 'var(--primary)', opacity: 0.9 }}>{post.category}</span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">{post.title}</h1>
                </header>
                <div className="aspect-[21/9] w-full mb-12 overflow-hidden rounded-sm bg-zinc-900 border border-zinc-900"><img src={post.imageUrl} className="w-full h-full object-cover" /></div>
                <article className="prose prose-invert prose-lg max-w-none mx-auto prose-headings:font-serif prose-headings:text-white prose-a:text-[var(--primary)]"><p className="mb-6 leading-relaxed text-zinc-300 font-light whitespace-pre-wrap">{post.content}</p></article>
                {isAdmin && (
                    <div className="mt-16 pt-8 border-t border-zinc-800 flex justify-end gap-4">
                        <button onClick={() => onEdit(post)} className="flex items-center gap-2 text-[var(--primary)] hover:text-white text-sm uppercase tracking-widest border border-[var(--primary)] px-4 py-2 hover:bg-[var(--primary)]/10 transition-colors"><PenTool size={14} /> Edit Article</button>
                        <button onClick={() => onDelete(post.id)} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm uppercase tracking-widest border border-red-500/20 px-4 py-2 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /> Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('home');
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [themeColor, setThemeColor] = useState('#f59e0b');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [tmdbKey, setTmdbKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [draftPost, setDraftPost] = useState(null);

    // Initial Load - Retrieve local storage & Fetch JSON
    useEffect(() => {
        const load = async () => {
            // Config
            const savedTheme = localStorage.getItem('twc_theme');
            if (savedTheme) setThemeColor(savedTheme);
            const savedAdmin = localStorage.getItem('twc_admin');
            if (savedAdmin === 'true') setIsAdmin(true);
            setTmdbKey(localStorage.getItem('tmdb_key') || window.TMDB_KEY || '');
            setGeminiKey(localStorage.getItem('gemini_key') || '');

            // Fetch Data
            try {
                const r = await fetch('./posts.json?t=' + Date.now());
                if (r.ok) {
                    const data = await r.json();
                    setPosts(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
                }
            } catch (e) { console.error("Could not load posts", e); }
            setLoading(false);
        };
        load();
    }, []);

    const handleThemeChange = (color) => { setThemeColor(color); localStorage.setItem('twc_theme', color); };
    const handleAdminLogin = () => { setIsAdmin(true); localStorage.setItem('twc_admin', 'true'); };
    const handleAdminLogout = () => { setIsAdmin(false); localStorage.removeItem('twc_admin'); if (view === 'editor') setView('home'); };
    const handleSaveSettings = (t, g) => { setTmdbKey(t); setGeminiKey(g); localStorage.setItem('tmdb_key', t); localStorage.setItem('gemini_key', g); setShowSettingsModal(false); };

    // --- Core Logic: JSON Database ---
    const handleSavePost = async (postData) => {
        const newPosts = [...posts];
        const now = { seconds: Math.floor(Date.now() / 1000) };

        if (postData.id) {
            // Edit
            const idx = newPosts.findIndex(p => p.id === postData.id);
            if (idx >= 0) newPosts[idx] = { ...newPosts[idx], ...postData, updatedAt: now };
        } else {
            // Create
            newPosts.unshift({ ...postData, id: 'post-' + Date.now(), createdAt: now });
        }

        setPosts(newPosts);
        alert("Post Saved Locally! \n\nA 'posts.json' file has been downloaded.\n1. Go to your project folder.\n2. Replace the old 'posts.json' with this new one.\n3. Push to GitHub.");
        downloadJSON(newPosts);
        setView('home');
    };

    const handleDeletePost = (postId) => {
        if (!confirm("Delete this post?")) return;
        const newPosts = posts.filter(p => p.id !== postId);
        setPosts(newPosts);
        alert("Post Deleted! \n\nA new 'posts.json' has been downloaded. Update your project folder and push.");
        downloadJSON(newPosts);
        setSelectedPost(null);
        setView('home');
    };

    const handleEditPost = (post) => { setDraftPost(post); setView('editor'); };

    // TODO: Implement simple AI assist if keys exist (using fetch)

    const featuredPost = posts[0];
    const regularPosts = posts.slice(1);

    const styleTag = `:root { --primary: ${themeColor}; } ::selection { background-color: var(--primary); color: black; }`;

    if (loading) return <div className="min-h-screen bg-black flex justify-center items-center"><Clapperboard className="text-[var(--primary)] animate-bounce" size={48} /></div>;

    return (
        <>
            <style>{styleTag}</style>
            <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col justify-between">
                <div>
                    <Navbar onViewChange={setView} currentView={view} isAdmin={isAdmin} onLoginClick={() => setShowLoginModal(true)} onLogout={handleAdminLogout} onOpenSettings={() => setShowSettingsModal(true)} />
                    {showLoginModal && <AdminLoginModal onClose={() => setShowLoginModal(false)} onLogin={handleAdminLogin} />}
                    {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} initialKey={tmdbKey} initialGeminiKey={geminiKey} />}

                    {selectedPost ? (
                        <ArticleView post={selectedPost} onBack={() => { setSelectedPost(null); setView('home'); }} onDelete={handleDeletePost} onEdit={handleEditPost} isAdmin={isAdmin} />
                    ) : view === 'editor' && isAdmin ? (
                        <Editor onCancel={() => setView('home')} onSave={handleSavePost} initialData={draftPost} />
                    ) : view === 'ott' ? (
                        <OTTView tmdbKey={tmdbKey} isAdmin={isAdmin} onImport={(m) => { setDraftPost({ title: m.title, content: m.overview, imageUrl: `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` }); setView('editor'); }} />
                    ) : (
                        <main>
                            {featuredPost ? <Hero featuredPost={featuredPost} onRead={setSelectedPost} /> : <div className="text-center py-20">Welcome to The Weekend Cinema</div>}
                            <div className="max-w-7xl mx-auto px-4 py-16">
                                <h2 className="text-2xl font-serif text-white mb-8 border-b border-zinc-800 pb-4">Latest Reviews</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {regularPosts.map(p => <ArticleCard key={p.id} post={p} onRead={setSelectedPost} />)}
                                </div>
                            </div>
                        </main>
                    )}
                </div>
                <footer className="bg-zinc-950 border-t border-zinc-900 py-12 mt-12 text-center text-zinc-600 text-xs uppercase tracking-widest">© 2024 The Weekend Cinema. GitHub Database Mode (Refreshed).</footer>
            </div>
        </>
    );
};

export default App;
