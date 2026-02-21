import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageConfidenceBar } from '@/domains/transcriptions/components/LanguageConfidenceBar';
import { TranscriptionStatusBadge } from '@/domains/transcriptions/components/TranscriptionStatusBadge';
import { TranscriptionTextViewer } from '@/domains/transcriptions/components/TranscriptionTextViewer';
import { formatDuration, formatFileSize } from '@/domains/transcriptions/helpers';
import { getTranscription } from '@/domains/transcriptions/service';

export const dynamic = 'force-dynamic';

export default async function TranscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transcription = await getTranscription(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/dashboard/transcriptions"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold">{transcription.audioFilename}</h1>
        <TranscriptionStatusBadge status={transcription.status} />
      </div>

      {/* Status: failed */}
      {transcription.status === 'failed' && transcription.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Erro na transcrição</p>
          <p className="text-sm mt-1">{transcription.errorMessage}</p>
        </div>
      )}

      {/* Status: pending / processing */}
      {(transcription.status === 'pending' || transcription.status === 'processing') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          <p className="font-medium">Transcrição em andamento...</p>
          <p className="text-sm mt-1">Aguarde a conclusão do processamento.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadados */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arquivo</span>
              <span>{transcription.audioFilename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formato</span>
              <span>{transcription.audioFormat?.toUpperCase() ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tamanho</span>
              <span>
                {transcription.audioSizeBytes != null
                  ? formatFileSize(transcription.audioSizeBytes)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duração</span>
              <span>
                {transcription.audioDurationSeconds != null
                  ? formatDuration(transcription.audioDurationSeconds)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processamento</span>
              <span>
                {transcription.processingTimeMs != null
                  ? `${(transcription.processingTimeMs / 1000).toFixed(1)}s`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criada em</span>
              <span>{new Date(transcription.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            {transcription.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concluída em</span>
                <span>{new Date(transcription.completedAt).toLocaleString('pt-BR')}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block mb-2">Idioma detectado</span>
              <LanguageConfidenceBar
                language={transcription.detectedLanguage}
                confidence={transcription.languageConfidence}
              />
            </div>
          </CardContent>
        </Card>

        {/* Texto transcrito */}
        <Card>
          <CardHeader>
            <CardTitle>Texto transcrito</CardTitle>
          </CardHeader>
          <CardContent>
            {transcription.transcribedText ? (
              <TranscriptionTextViewer text={transcription.transcribedText} />
            ) : (
              <p className="text-muted-foreground text-sm">Texto ainda não disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
