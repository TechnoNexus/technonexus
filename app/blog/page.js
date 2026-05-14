'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import NexusAuth from '../../components/NexusAuth';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    fetchPosts();

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    // Fetch posts and join with user_profiles to get author info
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, category, created_at,
        user_profiles!blog_posts_author_id_fkey ( username, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
      // Extract unique categories
      const cats = new Set((data || []).map(p => p.category || 'General'));
      setCategories(['All', ...Array.from(cats)]);
    }
    setLoading(false);
  };

  const filteredPosts = activeCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-grid-white pt-24 pb-16">
      <div className="container mx-auto px-6">
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">
            <span className="gradient-text-cyan">NEXUS</span> TECH BLOG
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg italic border-y border-white/5 py-4">
            Insights, tutorials, and deep dives into AI, engineering, and the Nexus platform.
          </p>
        </header>

        {/* Auth / Write Action */}
        <div className="max-w-md mx-auto mb-16">
          {!user ? (
            <NexusAuth />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
               <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                 <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
                   <span className="text-[10px] text-neon-cyan font-bold">N</span>
                 </div>
                 <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">{user.email}</span>
                 <button onClick={() => supabase.auth.signOut()} className="ml-4 text-[10px] text-red-500 hover:text-red-400 uppercase font-black tracking-widest transition-colors">
                   Logout
                 </button>
               </div>
               <Link href="/blog/write" className="group relative px-8 py-4 bg-electric-violet/10 border border-electric-violet/30 rounded-2xl text-electric-violet font-black uppercase tracking-widest hover:bg-electric-violet hover:text-white transition-all shadow-violet-glow w-full text-center">
                 ✏️ WRITE A POST
               </Link>
            </div>
          )}
        </div>

        {/* Categories / Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-neon-cyan text-black shadow-neon-glow' 
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-slate-400 text-lg font-bold">No posts found in this category.</p>
            <p className="text-slate-500 mt-2">Be the first to write one!</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredPosts.map(post => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="group glass-panel rounded-3xl p-6 border border-white/5 hover:border-neon-cyan/50 flex flex-col h-full bg-black/40 transition-all hover:shadow-neon-glow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-electric-violet/20 text-electric-violet font-bold">
                          {post.category || 'General'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-black mb-4 text-white group-hover:text-neon-cyan transition-colors tracking-tight leading-tight">
                        {post.title}
                      </h2>

                      {/* Author Info */}
                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                        {post.user_profiles?.avatar_url ? (
                          <img src={post.user_profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-electric-violet opacity-80" />
                        )}
                        <span className="text-xs font-bold text-slate-300">
                          {post.user_profiles?.username || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
