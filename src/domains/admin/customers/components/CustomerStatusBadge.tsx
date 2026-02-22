interface Props {
  isActive: boolean;
}

export function CustomerStatusBadge({ isActive }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}
