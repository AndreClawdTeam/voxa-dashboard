'use client';

import { motion } from 'framer-motion';
import Waveform from '@/components/auth/Waveform';
import { LoginForm } from '@/domains/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main
      className="auth-hero-grid relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: '#080A12', color: '#F8FAFC' }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Waveform decoration bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
        <Waveform size="hero" barColor="#A855F7" animated={true} />
      </div>

      {/* Card */}
      <motion.div
        className="auth-context auth-glass-accent relative z-10 w-full max-w-md rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#7C3AED' }}
          >
            <div className="absolute inset-2">
              <Waveform size="logo" barColor="#fff" animated={true} />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: '#F8FAFC' }}>
            Voxa
          </span>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
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
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F8FAFC' }}>
            Bem-vindo de volta
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Form — mantém LoginForm sem alterar sua lógica */}
        <LoginForm />
      </motion.div>
    </main>
  );
}
