import type { NewsArticle } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const timeline = (article.timeline as { date: string; text: string }[] | null) ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {article.title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="mb-1 font-semibold">News Resume</h3>
            <p className="text-sm text-muted-foreground">{article.summary}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold">Timeline</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {timeline.map((item, idx) => (
                <li key={idx}>
                  <span className="font-medium">
                    {format(new Date(item.date), 'PPpp')}
                  </span>
                  : {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 font-semibold">Fact Check</h3>
            <p className="text-sm text-muted-foreground">{article.factCheck}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
