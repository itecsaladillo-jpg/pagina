import fs from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import nextDynamic from 'next/dynamic'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'
import { SponsorHeaderBar } from '@/components/home/SponsorHeaderBar'

// ISR: regenerar el homepage cada 60 segundos en Vercel
export const revalidate = 60;

const AboutSection = nextDynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = nextDynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = nextDynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = nextDynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = nextDynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

// Cachear la lectura del filesystem por 1 hora (3600s):
const getSponsorLogos = unstable_cache(
  async () => {
    try {
      const sponsorsDir = path.join(process.cwd(), 'public', 'sponsors', 'blanco');
      if (!fs.existsSync(sponsorsDir)) return [];

      const files = fs.readdirSync(sponsorsDir);

      return files
        .filter((file) => !file.startsWith('.') && /\.(png|jpe?g|svg|webp)$/i.test(file))
        .map((file) => {
          const filePath = path.join(sponsorsDir, file);
          const stats = fs.statSync(filePath);

          return {
            url: `/sponsors/blanco/${file}?v=${stats.mtimeMs}`,
            nombre: file.replace(/\.[^/.]+$/, ''),
          };
        });
    } catch (error) {
      console.error('Error leyendo logos de sponsors:', error);
      return [];
    }
  },
  ['sponsor-logos-landing'],
  { revalidate: 3600 }
);

async function getInitialStreaming() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
      return { isActive: false, youtubeUrl: null }
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // 1. Probar streaming_config
    try {
      const { data: configData } = await supabase
        .from('streaming_config')
        .select('streaming_enabled, youtube_url')
        .eq('id', 'default')
        .maybeSingle()

      if (configData) {
        return {
          isActive: Boolean(configData.streaming_enabled),
          youtubeUrl: configData.youtube_url ? configData.youtube_url.trim() : null,
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fallback api_settings (Service Role para saltar RLS)
    const [activeRes, urlRes, enabledRes, genericUrlRes] = await Promise.all([
      supabase.from('api_settings').select('value').eq('key', 'streaming_active').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'streaming_youtube_url').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'streaming_enabled').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'youtube_url').maybeSingle(),
    ])

    const activeVal = enabledRes.data?.value || activeRes.data?.value
    const urlVal = urlRes.data?.value || genericUrlRes.data?.value

    return {
      isActive: activeVal === 'true',
      youtubeUrl: urlVal ? urlVal.trim() : null,
    }
  } catch {
    return { isActive: false, youtubeUrl: null }
  }
}

export default async function HomePage() {
  const [sponsorLogos, initialStreaming] = await Promise.all([
    getSponsorLogos(),
    getInitialStreaming(),
  ]);

  return (
    <main className="relative min-h-screen bg-black text-white pb-16">
      {/* SponsorHeaderBar fuera del wrapper: fixed se ancla al viewport y NO se mueve */}
      <SponsorHeaderBar logos={sponsorLogos} />

      {/* Navbar global */}
      <Navbar />

      <HeroSection
        initialStreamingActive={initialStreaming.isActive}
        initialStreamingUrl={initialStreaming.youtubeUrl}
      />

      {/* Secciones de contenido estructuradas limpiamente */}
      <div>
        <ImpactSection />

        <VideotecaSection />

        <AboutSection />

        <ComisionesSection />

        <IdeasSection />

        <Footer />
      </div>

      {/* Selector de Idiomas: se oculta si la página principal está mostrando el reproductor de streaming */}
      {!Boolean(initialStreaming.isActive && initialStreaming.youtubeUrl) && (
        <FloatingLanguageSelector />
      )}
    </main>
  )
}