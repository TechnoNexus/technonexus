'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const CATEGORIES = ['Engineering', 'AI', 'Game Dev', 'Tutorial', 'General'];

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white/5 rounded-xl border border-white/10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('bold') ? 'bg-neon-cyan text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold italic transition-all ${
          editor.isActive('italic') ? 'bg-neon-cyan text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold line-through transition-all ${
          editor.isActive('strike') ? 'bg-neon-cyan text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        S
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('heading', { level: 2 }) ? 'bg-electric-violet text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('heading', { level: 3 }) ? 'bg-electric-violet text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('bulletList') ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('orderedList') ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Numbered List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
          editor.isActive('codeBlock') ? 'bg-slate-700 text-neon-cyan' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Code Block
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          editor.isActive('blockquote') ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
      >
        Quote
      </button>
    </div>
  );
};

export default function WritePostPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        alert("You must be logged in to write a post.");
        router.push('/blog');
      } else {
        setUser(user);
      }
      setLoading(false);
    });
  }, [router]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your thoughts here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[300px] p-6 bg-black/40 rounded-2xl border border-white/10',
      },
    },
  });

  const handlePublish = async () => {
    if (!title.trim()) return alert("Title is required!");
    if (!editor || editor.isEmpty) return alert("Content is required!");
    
    setIsPublishing(true);

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);

    const contentHtml = editor.getHTML();

    const { error } = await supabase
      .from('blog_posts')
      .insert({
        author_id: user.id,
        title: title.trim(),
        slug: slug,
        category: category,
        content_json: { html: contentHtml }
      });

    if (error) {
      console.error("Failed to publish post:", error);
      alert("Failed to publish post: " + error.message);
      setIsPublishing(false);
    } else {
      router.push(`/blog/${slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-grid-white pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link href="/blog" className="text-slate-400 text-sm mb-12 inline-block hover:text-white tracking-widest font-bold uppercase transition-colors">
          ← DISCARD & RETURN
        </Link>
        
        <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-2xl mb-20 bg-black/40">
          <header className="mb-10">
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase">
              CREATE <span className="text-electric-violet">POST</span>
            </h1>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging title..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-2xl font-bold text-white focus:border-electric-violet outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-electric-violet outline-none appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Content</label>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>

          <div className="flex justify-end pt-8 border-t border-white/10">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-10 py-4 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-2xl hover:shadow-neon-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isPublishing ? 'PUBLISHING...' : '🚀 PUBLISH TO NEXUS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
