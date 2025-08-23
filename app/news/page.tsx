import { getLatestNews } from '@/lib/db/news';
import { NewsCard } from '@/components/news-card';

export const metadata = {
  title: 'Curated News',
};

export default async function NewsPage() {
  const articles = await getLatestNews();
  return (
    <div className="container py-6 space-y-6">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
