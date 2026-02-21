interface LanguageConfidenceBarProps {
  language: string | null;
  confidence: number | null;
}

export function LanguageConfidenceBar({ language, confidence }: LanguageConfidenceBarProps) {
  if (!language || confidence === null) {
    return <span className="text-muted-foreground text-sm">Não detectado</span>;
  }

  const percent = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{language}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}
