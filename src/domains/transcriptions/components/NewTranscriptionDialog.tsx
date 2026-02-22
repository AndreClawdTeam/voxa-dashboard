'use client';

import { Loader2, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiKey } from '@/domains/api-keys/schemas';
import { transcribeAudioAction } from '../actions';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_FORMATS = ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm'];
const ALLOWED_ACCEPT = 'audio/*,.mp3,.wav,.ogg,.mp4,.m4a,.flac,.webm';

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isAllowedFormat(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_FORMATS.includes(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NewTranscriptionDialogProps {
  apiKeys: ApiKey[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NewTranscriptionDialog({ apiKeys }: NewTranscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('');
  const [apiKeyValue, setApiKeyValue] = useState<string>('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeApiKeys = apiKeys.filter((k) => !k.isRevoked);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setClientError(null);
    setServerError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validação client-side de formato
    if (!isAllowedFormat(file.name)) {
      const ext = getFileExtension(file.name) || 'desconhecido';
      setClientError(`Formato .${ext} não suportado. Use: ${ALLOWED_FORMATS.join(', ')}.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validação client-side de tamanho
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        `Arquivo muito grande (${formatFileSize(file.size)}). Máximo permitido: 25MB.`,
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isPending) {
      setOpen(isOpen);
      if (!isOpen) {
        setSelectedFile(null);
        setSelectedApiKeyId('');
        setApiKeyValue('');
        setClientError(null);
        setServerError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }

  function handleApiKeySelectChange(keyId: string) {
    setSelectedApiKeyId(keyId);
    setClientError(null);
    setServerError(null);
    // Pre-fill label hint (actual token must be pasted by user)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setClientError(null);

    if (!selectedFile) {
      setClientError('Selecione um arquivo de áudio.');
      return;
    }

    const trimmedKey = apiKeyValue.trim();
    if (!trimmedKey) {
      setClientError('Informe o valor da API Key.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('apiKey', trimmedKey);

    setIsPending(true);
    try {
      const result = await transcribeAudioAction(formData);
      if (result.success) {
        setOpen(false);
        setSelectedFile(null);
        setSelectedApiKeyId('');
        setApiKeyValue('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setServerError(result.error);
      }
    } catch {
      setServerError('Erro inesperado. Tente novamente.');
    } finally {
      setIsPending(false);
    }
  }

  const canSubmit =
    selectedFile !== null && apiKeyValue.trim() !== '' && !isPending && !clientError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova Transcrição
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transcrição</DialogTitle>
          <DialogDescription>
            Envie um arquivo de áudio para transcrever. Formatos aceitos:{' '}
            {ALLOWED_FORMATS.join(', ')} — máximo 25MB.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="audio-file">Arquivo de áudio</Label>
            <input
              ref={fileInputRef}
              id="audio-file"
              type="file"
              accept={ALLOWED_ACCEPT}
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer disabled:opacity-50"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selecionado:{' '}
                <span className="text-foreground font-medium">{selectedFile.name}</span> (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Seleção de API Key (referência visual) */}
          {activeApiKeys.length === 0 ? (
            <div className="space-y-2">
              <Label>API Key</Label>
              <p className="text-sm text-muted-foreground" data-testid="no-active-keys">
                Nenhuma API Key ativa. Crie uma em{' '}
                <a href="/dashboard/api-keys" className="text-primary underline">
                  API Keys
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="api-key-select">
                API Key <span className="font-normal text-muted-foreground">(referência)</span>
              </Label>
              <Select
                value={selectedApiKeyId}
                onValueChange={handleApiKeySelectChange}
                disabled={isPending}
              >
                <SelectTrigger id="api-key-select">
                  <SelectValue placeholder="Selecione para identificar a key..." />
                </SelectTrigger>
                <SelectContent>
                  {activeApiKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Valor da API Key */}

          <div className="space-y-2">
            <Label htmlFor="api-key-value">
              Valor da API Key{' '}
              <span className="text-destructive" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="api-key-value"
              type="password"
              placeholder="vxa_..."
              value={apiKeyValue}
              onChange={(e) => {
                setApiKeyValue(e.target.value);
                setClientError(null);
                setServerError(null);
              }}
              disabled={isPending}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Cole o valor completo da API Key (exibido apenas uma vez na criação).
            </p>
          </div>

          {/* Erros */}
          {(clientError ?? serverError) && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{clientError ?? serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcrevendo...
                </>
              ) : (
                'Transcrever'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
