import 'server-only';

type Vector = {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
};

export function pineconeConfigured() {
  return Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_HOST && process.env.PINECONE_INDEX);
}

function pcHeaders() {
  const key = process.env.PINECONE_API_KEY as string;
  return {
    'Api-Key': key,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

function pcHost() {
  // Example: https://my-index-xxxxx.svc.aped-4627-b74a.pinecone.io
  return process.env.PINECONE_HOST as string;
}

function pcIndex() {
  return process.env.PINECONE_INDEX as string;
}

export async function pineconeUpsert({
  namespace,
  vectors,
}: {
  namespace: string;
  vectors: Vector[];
}) {
  if (!pineconeConfigured()) return;
  const res = await fetch(`${pcHost()}/vectors/upsert`, {
    method: 'POST',
    headers: pcHeaders(),
    body: JSON.stringify({
      namespace,
      vectors,
      index: pcIndex(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Pinecone upsert failed: ${res.status}`);
  }
}

export async function pineconeDelete({
  namespace,
  ids,
}: {
  namespace: string;
  ids: string[];
}) {
  if (!pineconeConfigured()) return;
  const res = await fetch(`${pcHost()}/vectors/delete`, {
    method: 'POST',
    headers: pcHeaders(),
    body: JSON.stringify({
      namespace,
      ids,
      deleteAll: false,
      index: pcIndex(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Pinecone delete failed: ${res.status}`);
  }
}

export async function pineconeQuery({
  namespace,
  vector,
  topK,
}: {
  namespace: string;
  vector: number[];
  topK: number;
}) {
  if (!pineconeConfigured()) return { matches: [] as any[] };
  const res = await fetch(`${pcHost()}/query`, {
    method: 'POST',
    headers: pcHeaders(),
    body: JSON.stringify({
      namespace,
      vector,
      topK,
      includeMetadata: true,
      index: pcIndex(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Pinecone query failed: ${res.status}`);
  }
  return (await res.json()) as { matches: Array<{ id: string; score: number; metadata?: any }> };
}

