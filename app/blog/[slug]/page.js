import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'app/blog/posts');
  const filenames = fs.readdirSync(postsDirectory);

  return filenames.map((filename) => ({
    slug: filename.replace(/\.md$/, ''),
  }));
}

export default async function PostPage(props) {
  const params = await props.params;
  const slug = params.slug;
  const postsDirectory = path.join(process.cwd(), 'app/blog/posts');
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();

    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link href="/blog" className="text-neon-cyan text-sm mb-12 block hover:underline">
            ← BACK TO NEXUS INSIGHTS
          </Link>
          
          <header className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              {data.tags?.map(tag => (
                <span key={tag} className="text-xs uppercase tracking-widest px-3 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                  {tag}
                </span>
              ))}
              <span className="text-slate-500 text-sm italic font-mono">{data.date}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-none">
              {data.title}
            </h1>
            <p className="text-xl text-slate-400 italic border-l-4 border-neon-violet pl-6 py-2">
              {data.description}
            </p>
          </header>

          <article className="glass-panel p-10 md:p-16 rounded-3xl border-white/5 shadow-2xl">
            <div 
              className="prose prose-invert prose-lg max-w-none 
              prose-headings:text-neon-cyan prose-headings:font-bold prose-headings:tracking-tight
              prose-a:text-neon-violet prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-code:text-neon-cyan prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
              prose-img:rounded-2xl prose-img:border prose-img:border-white/10
              prose-blockquote:border-neon-violet prose-blockquote:bg-neon-violet/5 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: contentHtml }} 
            />
          </article>
          
          <div className="mt-20 pt-10 border-t border-white/10 flex justify-between items-center">
             <div className="text-slate-400 text-sm">
               © 2026 TechnoNexus. All rights reserved.
             </div>
             <div className="flex gap-6">
               <span className="text-neon-cyan cursor-pointer hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.5)] transition-all">Twitter</span>
               <span className="text-neon-violet cursor-pointer hover:drop-shadow-[0_0_5px_rgba(139,92,246,0.5)] transition-all">Discord</span>
             </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
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
}
