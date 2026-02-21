'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RawTokenRevealStepProps {
  rawToken: string;
  onClose: () => void;
}

export function RawTokenRevealStep({ rawToken, onClose }: RawTokenRevealStepProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [token, setToken] = useState(rawToken);

  // Limpar token da memória ao desmontar o componente
  useEffect(() => {
    setToken(rawToken);
    return () => {
      setToken('');
    };
  }, [rawToken]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Banner de aviso */}
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          ⚠️ Atenção: Esta é a única vez que você verá esta API key.
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
          Copie e armazene em um local seguro agora. Não será possível recuperá-la depois.
        </p>
      </div>

      {/* Campo com o token */}
      <div className="space-y-2">
        <Label htmlFor="raw-token">Sua API Key</Label>
        <div className="flex gap-2">
          <Input id="raw-token" value={token} readOnly className="font-mono text-sm" />
          <Button type="button" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? 'Copiado! ✓' : 'Copiar token'}
          </Button>
        </div>
      </div>

      {/* Checkbox de confirmação */}
      <div className="flex items-start gap-2">
        <input
          id="confirm-copied"
          data-testid="confirm-checkbox"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300"
        />
        <Label htmlFor="confirm-copied" className="cursor-pointer text-sm font-normal leading-snug">
          Já copiei minha API key e entendo que não poderei vê-la novamente
        </Label>
      </div>

      {/* Botão Fechar */}
      <div className="flex justify-end">
        <Button type="button" disabled={!confirmed} onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
