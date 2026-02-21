export function formatAuditAction(action: string): string {
  return action
    .split('.')
    .map((part) =>
      part
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    )
    .join(': ');
}

export function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('creat') || lower.includes('add') || lower.includes('register')) {
    return 'bg-green-100 text-green-700';
  }
  if (
    lower.includes('delet') ||
    lower.includes('revok') ||
    lower.includes('remov') ||
    lower.includes('cancel')
  ) {
    return 'bg-red-100 text-red-700';
  }
  if (
    lower.includes('updat') ||
    lower.includes('upgrad') ||
    lower.includes('edit') ||
    lower.includes('modif')
  ) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-700';
}

export const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'Todos os recursos' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'api_key', label: 'API Key' },
  { value: 'user', label: 'Usuário' },
  { value: 'transcription', label: 'Transcrição' },
];
