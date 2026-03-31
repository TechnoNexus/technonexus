import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function BlogPage() {
  const postsDirectory = path.join(process.cwd(), 'app/blog/posts');
  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames.map(fileName => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || 'No Date',
      description: data.description || 'No description provided.',
      tags: data.tags || [],
    };
  });

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white">
      <div className="container mx-auto px-6 py-16">
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
            <span className="gradient-text-cyan">Nexus</span> Insights
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Exploring the intersection of AI, high-performance computing, and indie gaming culture.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group glass-panel rounded-2xl p-6 neon-border flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-neon-cyan transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                  {post.description}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono italic">{post.date}</span>
                <span className="text-neon-cyan text-xs font-bold group-hover:translate-x-1 transition-transform">
                  READ MORE →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
