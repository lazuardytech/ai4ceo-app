import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Array saran bisnis dalam Bahasa Indonesia untuk CEO dan operator bisnis Indonesia
const businessSuggestions = [
  { title: 'Buat rencana untuk', label: 'masuk pasar baru dengan strategi GTM 90 hari', action: 'Buat rencana GTM 90 hari untuk masuk pasar baru di Indonesia. Sertakan KPI dan analisis risiko.' },
  { title: 'Analisis', label: 'unit ekonomi dan strategi peningkatan margin', action: 'Analisis unit ekonomi perusahaan dan identifikasi cara meningkatkan gross margin di pasar Indonesia.' },
  { title: 'Susun laporan', label: 'board meeting dengan metrik kunci dan risiko strategis', action: 'Susun laporan board meeting bulan ini dengan metrik kunci dan risiko strategis untuk pasar Indonesia.' },
  { title: 'Rancang struktur', label: 'organisasi untuk scaling dari 10 ke 30 orang', action: 'Rancang struktur organisasi untuk scaling dari 10 ke 30 orang dengan peran dan tanggung jawab yang jelas.' },
  { title: 'Buat strategi', label: 'retensi pelanggan dengan metrik dan action items', action: 'Kembangkan strategi retensi pelanggan yang komprehensif dengan metrik dan action items untuk pasar Indonesia.' },
  { title: 'Bangun framework', label: 'prioritas produk menggunakan impact vs effort matrix', action: 'Buat framework prioritas produk menggunakan impact vs effort matrix yang sesuai dengan kondisi pasar Indonesia.' },
  { title: 'Analisis kompetitif', label: 'positioning gaps dan peluang pasar Indonesia', action: 'Lakukan analisis kompetitif dan identifikasi positioning gaps serta peluang di pasar Indonesia.' },
  { title: 'Optimasi proses', label: 'sales untuk mengurangi cycle time dan tingkatkan konversi', action: 'Optimasi proses sales untuk mengurangi cycle time dan meningkatkan conversion rate di Indonesia.' },
  { title: 'Kembangkan strategi', label: 'pricing untuk optimasi pertumbuhan revenue', action: 'Review strategi pricing saat ini dan buat rekomendasi optimasi untuk pertumbuhan revenue di Indonesia.' },
  { title: 'Buat metrik', label: 'efisiensi operasional dengan target improvement Q1', action: 'Definisikan metrik efisiensi operasional kunci dan target improvement untuk Q1 di Indonesia.' },
  { title: 'Susun rencana', label: 'akuisisi talent untuk posisi kritis dalam 6 bulan', action: 'Buat rencana akuisisi talent strategis untuk posisi kritis dalam 6 bulan ke depan di Indonesia.' },
  { title: 'Optimasi customer', label: 'journey untuk mengurangi churn dan tingkatkan kepuasan', action: 'Mapping dan optimasi customer journey untuk mengurangi churn dan meningkatkan kepuasan pelanggan Indonesia.' },
  { title: 'Kembangkan model', label: 'forecasting cash flow 12 bulan dengan scenario planning', action: 'Bangun model forecasting cash flow 12 bulan dengan scenario planning untuk kondisi ekonomi Indonesia.' },
  { title: 'Buat roadmap', label: 'ekspansi pasar ke wilayah Indonesia lainnya', action: 'Kembangkan roadmap ekspansi ke pasar adjacent di Indonesia dengan assessment risiko.' },
  { title: 'Analisis supply chain', label: 'bottleneck dan peluang optimasi biaya', action: 'Identifikasi bottleneck supply chain dan peluang optimasi biaya untuk operasi di Indonesia.' },
  { title: 'Bangun roadmap', label: 'transformasi digital dengan inisiatif prioritas dan ROI', action: 'Buat roadmap transformasi digital dengan inisiatif prioritas dan proyeksi ROI untuk bisnis Indonesia.' },
  { title: 'Rancang sistem', label: 'performance management selaras dengan objektif perusahaan', action: 'Rancang sistem performance management yang selaras dengan objektif perusahaan dan budaya Indonesia.' },
  { title: 'Buat framework', label: 'strategi partnership untuk akselerasi growth', action: 'Kembangkan framework strategi partnership untuk akselerasi growth dan market reach di Indonesia.' },
  { title: 'Analisis biaya', label: 'akuisisi customer lintas channel untuk optimasi spend', action: 'Deep dive analisis customer acquisition cost lintas channel dan optimasi alokasi spend di Indonesia.' },
  { title: 'Bangun framework', label: 'risk management untuk risiko operasional dan strategis', action: 'Buat framework risk management komprehensif untuk risiko operasional dan strategis di Indonesia.' },
  { title: 'Rancang strategi', label: 'peluncuran produk dengan rencana go-to-market lengkap', action: 'Kembangkan strategi go-to-market untuk peluncuran produk besar berikutnya di pasar Indonesia.' },
  { title: 'Buat presentasi', label: 'investor dengan growth metrics dan market opportunity', action: 'Bangun presentasi investor yang compelling dengan growth metrics dan market opportunity Indonesia.' },
  { title: 'Analisis market', label: 'sizing untuk peluang ekspansi potensial', action: 'Lakukan analisis market sizing untuk peluang ekspansi potensial di berbagai sektor Indonesia.' },
  { title: 'Bangun rencana', label: 'transformasi budaya untuk rapid scaling', action: 'Rancang rencana transformasi budaya untuk mendukung rapid scaling dan remote work di Indonesia.' },
  { title: 'Buat roadmap', label: 'strategi data untuk enable data-driven decision making', action: 'Kembangkan roadmap strategi data untuk mengaktifkan data-driven decision making di Indonesia.' },
  { title: 'Rancang protokol', label: 'crisis management dengan rencana komunikasi berbagai skenario', action: 'Buat protokol crisis management dan rencana komunikasi untuk berbagai skenario di Indonesia.' },
  { title: 'Analisis hubungan', label: 'vendor untuk konsolidasi dan peluang pengurangan biaya', action: 'Review hubungan vendor dan identifikasi peluang konsolidasi untuk pengurangan biaya di Indonesia.' },
  { title: 'Bangun framework', label: 'succession planning untuk posisi leadership kunci', action: 'Buat framework succession planning untuk posisi leadership kunci dalam organisasi Indonesia.' },
  { title: 'Buat strategi', label: 'brand positioning untuk diferensiasi di pasar kompetitif', action: 'Kembangkan strategi brand positioning untuk diferensiasi di landscape kompetitif Indonesia.' },
  { title: 'Optimasi kebijakan', label: 'remote work untuk maksimalkan produktivitas dan engagement', action: 'Optimasi kebijakan dan tools remote work untuk maksimalkan produktivitas dan engagement tim Indonesia.' },
  { title: 'Analisis regulasi', label: 'pemerintah dan dampaknya terhadap strategi bisnis', action: 'Analisis regulasi pemerintah Indonesia terbaru dan dampaknya terhadap strategi bisnis perusahaan.' },
  { title: 'Buat strategi', label: 'penetrasi pasar tier 2 dan tier 3 Indonesia', action: 'Kembangkan strategi penetrasi pasar tier 2 dan tier 3 Indonesia dengan pendekatan yang sesuai.' },
  { title: 'Rancang program', label: 'CSR yang aligned dengan nilai perusahaan dan masyarakat', action: 'Rancang program CSR yang aligned dengan nilai perusahaan dan kebutuhan masyarakat Indonesia.' },
  { title: 'Optimasi strategi', label: 'e-commerce dan digital marketing untuk pasar Indonesia', action: 'Optimasi strategi e-commerce dan digital marketing yang efektif untuk consumer behavior Indonesia.' },
  { title: 'Analisis peluang', label: 'fintech dan digital payment di ekosistem Indonesia', action: 'Analisis peluang integrasi fintech dan digital payment dalam ekosistem bisnis Indonesia.' },
  { title: 'Buat rencana', label: 'sustainability dan ESG untuk investor dan stakeholder', action: 'Kembangkan rencana sustainability dan ESG yang menarik untuk investor dan stakeholder Indonesia.' }
];

export async function GET() {
  try {
    // Pilih 4 saran secara random dari array
    const shuffled = [...businessSuggestions].sort(() => 0.5 - Math.random());
    const selectedSuggestions = shuffled.slice(0, 4);

    return NextResponse.json({ items: selectedSuggestions }, { status: 200 });
  } catch (e) {
    // Fallback ke 4 saran pertama jika terjadi error
    const fallbackSuggestions = businessSuggestions.slice(0, 4);
    return NextResponse.json({ items: fallbackSuggestions }, { status: 200 });
  }
}
