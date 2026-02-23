'use client';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Waveform from '@/components/auth/Waveform';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
  }),
};

export default function Home() {
  return (
    <main
      className="auth-hero-grid relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: '#080A12', color: '#F8FAFC' }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(124,58,237,0.14) 0%, transparent 70%)',
        }}
      />

      {/* Waveform bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
        <Waveform size="hero" barColor="#A855F7" animated={true} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg gap-0">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 mb-10"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#7C3AED' }}
          >
            <div className="absolute inset-2">
              <Waveform size="logo" barColor="#fff" animated={true} />
            </div>
          </div>
          <span className="font-bold text-2xl tracking-tight" style={{ color: '#F8FAFC' }}>
            Voxa
          </span>
        </motion.div>

        {/* Badge */}
        <motion.div
          className="mb-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#C084FC',
            }}
          >
            ✨ Powered by faster-whisper
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-extrabold tracking-tight text-4xl sm:text-5xl leading-tight mb-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          <span style={{ color: '#F8FAFC' }}>Transcrição de áudio.</span>
          <br />
          <span className="auth-text-gradient">Sem surpresas na fatura.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base sm:text-lg leading-relaxed mb-10"
          style={{ color: '#94A3B8' }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
        >
          A única API de transcrição com preço fixo mensal.
          <br />
          Trial grátis por 7 dias. Sem cartão.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
        >
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl font-semibold text-white text-center transition-all duration-200 hover:opacity-90"
            style={{
              background: '#7C3AED',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Criar conta grátis →
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl font-semibold text-center transition-all duration-200"
            style={{
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#C084FC',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(124,58,237,0.05)',
            }}
          >
            Entrar
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
