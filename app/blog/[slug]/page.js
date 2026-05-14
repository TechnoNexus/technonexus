'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';

export const runtime = 'edge';

export default function PostPage(props) {
  const params = use(props.params);
  const slug = params.slug;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    fetchPostAndComments();
  }, [slug]);

  const fetchPostAndComments = async () => {
    setLoading(true);
    
    // 1. Fetch Post
    const { data: postData, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        user_profiles!blog_posts_author_id_fkey ( username, avatar_url )
      `)
      .eq('slug', slug)
      .single();

    if (postError || !postData) {
      console.error(postError);
      setLoading(false);
      return;
    }
    setPost(postData);

    // 2. Fetch Comments
    const { data: commentsData } = await supabase
      .from('blog_comments')
      .select(`
        *,
        user_profiles!blog_comments_author_id_fkey ( username, avatar_url )
      `)
      .eq('post_id', postData.id)
      .order('created_at', { ascending: true });

    if (commentsData) setComments(commentsData);
    setLoading(false);
  };

  const submitComment = async () => {
    if (!user) return alert("You must be logged in to comment.");
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: post.id,
        author_id: user.id,
        content: newComment.trim()
      })
      .select(`
        *,
        user_profiles!blog_comments_author_id_fkey ( username, avatar_url )
      `)
      .single();

    if (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment.");
    } else {
      setComments([...comments, data]);
      setNewComment('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-9xl font-black text-white/5 absolute inset-0 flex items-center justify-center -z-10 select-none">404</h1>
          <h2 className="text-4xl font-bold text-white mb-6">Post Not Found</h2>
          <Link href="/blog" className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 px-8 py-3 rounded-full hover:bg-neon-cyan hover:text-black transition-all">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (post.content_json && post.content_json.html) {
      return <div dangerouslySetInnerHTML={{ __html: post.content_json.html }} />;
    }
    return <p className="text-slate-400 italic">This post has no content.</p>;
  };

  return (
    <div className="min-h-screen bg-grid-white pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link href="/blog" className="text-neon-cyan text-sm mb-12 inline-block hover:underline tracking-widest font-bold uppercase">
          ← BACK TO NEXUS TECH BLOG
        </Link>
        
        <header className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-electric-violet/20 text-electric-violet border border-electric-violet/30 font-bold shadow-violet-glow">
              {post.category || 'General'}
            </span>
            <span className="text-slate-500 text-sm font-mono">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-tight">
            {post.title}
          </h1>

          {/* Author Info */}
          <div className="flex items-center gap-4 bg-white/5 inline-flex p-2 pr-6 rounded-full border border-white/10">
            {post.user_profiles?.avatar_url ? (
              <img src={post.user_profiles.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border border-white/20" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-electric-violet" />
            )}
            <div>
              <p className="text-white font-bold text-sm">{post.user_profiles?.username || 'Anonymous'}</p>
              <p className="text-slate-500 text-xs">Nexus Author</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-2xl mb-20 bg-black/40">
          <div className="prose prose-invert prose-lg max-w-none 
            prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
            prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline hover:prose-a:text-white
            prose-strong:text-white prose-strong:font-bold
            prose-code:text-electric-violet prose-code:bg-white/5 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-lg
            prose-img:rounded-3xl prose-img:border border-white/10 prose-img:shadow-2xl
            prose-blockquote:border-neon-cyan prose-blockquote:bg-neon-cyan/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:font-normal prose-blockquote:text-slate-300">
            {renderContent()}
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <h3 className="text-3xl font-black text-white mb-10 tracking-tighter">
            DISCUSSION <span className="text-neon-cyan">({comments.length})</span>
          </h3>

          {/* Add Comment */}
          <div className="mb-16 bg-white/5 p-6 rounded-3xl border border-white/10">
            {user ? (
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-electric-violet shrink-0" />
                <div className="flex-1">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add to the discussion..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:border-neon-cyan outline-none transition-all resize-none h-32"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={submitComment}
                      disabled={!newComment.trim()}
                      className="px-8 py-3 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-xl hover:shadow-neon-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">You must be logged in to join the discussion.</p>
                <Link href="/blog" className="text-neon-cyan font-bold hover:underline">
                  Sign In via Nexus
                </Link>
              </div>
            )}
          </div>

          {/* Comment List */}
          <div className="space-y-6">
            {comments.map(comment => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/20 p-6 rounded-3xl border border-white/5 flex gap-4"
              >
                {comment.user_profiles?.avatar_url ? (
                  <img src={comment.user_profiles.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-white text-sm">{comment.user_profiles?.username || 'Anonymous'}</span>
                    <span className="text-xs font-mono text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
