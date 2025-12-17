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

const SettingsModal = ({ onClose, onSave, initialKey }) => {
    const [key, setKey] = useState(initialKey || '');

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
                            placeholder="Enter your TMDB Key for official posters..."
                            className="w-full bg-black border border-zinc-700 rounded p-3 text-white text-sm focus:border-[var(--primary)] outline-none font-mono"
                        />
                        <p className="text-[10px] text-zinc-600 mt-2">
                            Required for "Sync TMDB Trends" and Official Posters. Get one free at themoviedb.org.
                        </p>
                    </div>

                    <button
                        onClick={() => onSave(key)}
                        className="w-full py-3 bg-[var(--primary)] text-black font-bold uppercase tracking-wider rounded-sm hover:opacity-90 mt-4"
                    >
                        Save Configuration
                    </button>
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

const OTTView = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-zinc-900 p-8 rounded-full mb-8 border border-zinc-800 relative group">
                <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <Tv size={64} className="text-[var(--primary)] relative z-10" />
                <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-2 rounded-full border border-zinc-800">
                    <Clock size={20} className="text-zinc-400" />
                </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                OTT Guide <span className="text-[var(--primary)]">Coming Soon</span>
            </h2>

            <p className="text-zinc-400 max-w-md text-lg leading-relaxed mb-8">
                We are building the ultimate streaming companion.
                Track trending movies, find where to watch, and discover hidden gems.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                    <Construction size={16} /> Under Construction
                </div>
            </div>
        </div>
    );
};

const Editor = ({ user, onCancel, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('Review');
    const [rating, setRating] = useState(4);
    const [isSaving, setIsSaving] = useState(false);

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
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [themeColor, setThemeColor] = useState('#f59e0b'); // Default Amber
    const [isAdmin, setIsAdmin] = useState(false); // Security: Disabled by default
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [tmdbKey, setTmdbKey] = useState('');

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
            // Security: Do NOT load admin state from local storage
            // const savedAdmin = localStorage.getItem('twc_admin');
            // if (savedAdmin === 'true') setIsAdmin(true);

            const savedKey = localStorage.getItem('tmdb_key');
            if (savedKey) {
                setTmdbKey(savedKey);
            } else if (typeof window.TMDB_KEY !== 'undefined' && window.TMDB_KEY) {
                // Feature: Use global config key if no local override exists
                setTmdbKey(window.TMDB_KEY);
            }
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
        // Security: Do NOT persist admin state
        // localStorage.setItem('twc_admin', 'true');
    };

    const handleAdminLogout = () => {
        setIsAdmin(false);
        localStorage.removeItem('twc_admin');
        if (view === 'editor') setView('home');
    };

    const handleSaveSettings = (key) => {
        setTmdbKey(key);
        localStorage.setItem('tmdb_key', key);
        setShowSettingsModal(false);
        // alert("API Key Saved! You can now sync official trends.");
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
                            initialKey={tmdbKey}
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
                        />
                    ) : view === 'ott' ? (
                        <OTTView />
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
                            © 2024 The Weekend Cinema. All rights reserved.
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
