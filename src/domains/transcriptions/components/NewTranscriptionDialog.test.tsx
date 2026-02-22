import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiKey } from '@/domains/api-keys/schemas';
import { NewTranscriptionDialog } from './NewTranscriptionDialog';

// Mock da server action
vi.mock('../actions', () => ({
  transcribeAudioAction: vi.fn(),
}));

import { transcribeAudioAction } from '../actions';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockApiKeys: ApiKey[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    label: 'Produção',
    isRevoked: false,
    lastUsedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    label: 'Staging',
    isRevoked: false,
    lastUsedAt: '2026-02-15T10:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    label: 'Key Revogada',
    isRevoked: true,
    lastUsedAt: null,
    createdAt: '2025-12-01T00:00:00Z',
  },
];

function makeAudioFile(name = 'audio.mp3', sizeBytes = 1024): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type: 'audio/mpeg' });
}

async function openDialog(keys = mockApiKeys) {
  const user = userEvent.setup();
  render(<NewTranscriptionDialog apiKeys={keys} />);
  await user.click(screen.getByRole('button', { name: /nova transcrição/i }));
  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NewTranscriptionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Renderização inicial ──────────────────────────────────────────────────

  it('deve renderizar o botão de trigger', () => {
    render(<NewTranscriptionDialog apiKeys={mockApiKeys} />);
    expect(screen.getByRole('button', { name: /nova transcrição/i })).toBeInTheDocument();
  });

  it('não deve exibir o dialog inicialmente', () => {
    render(<NewTranscriptionDialog apiKeys={mockApiKeys} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deve abrir o dialog ao clicar no botão', async () => {
    await openDialog();
    // Verifica que o dialog está presente pelo role
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Verifica o título dentro do dialog (pode haver múltiplos elementos com "Nova Transcrição")
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Nova Transcrição');
  });

  it('deve exibir campo de arquivo de áudio', async () => {
    await openDialog();
    expect(screen.getByLabelText(/arquivo de áudio/i)).toBeInTheDocument();
  });

  it('deve exibir campo de valor da API Key', async () => {
    await openDialog();
    expect(screen.getByLabelText(/valor da api key/i)).toBeInTheDocument();
  });

  it('deve exibir select de API Key quando há keys ativas', async () => {
    await openDialog();
    // Verify the select trigger button is visible
    expect(screen.getByRole('dialog')).toHaveTextContent('Selecione para identificar a key...');
  });

  it('deve exibir apenas API Keys ativas no select (não revogadas)', async () => {
    await openDialog();
    // "Key Revogada" should not appear in the visible page
    expect(screen.queryByText('Key Revogada')).not.toBeInTheDocument();
  });

  it('deve exibir botão Transcrever desabilitado inicialmente', async () => {
    await openDialog();
    expect(screen.getByRole('button', { name: /transcrever/i })).toBeDisabled();
  });

  // ─── Validação de formato ──────────────────────────────────────────────────

  it('deve exibir erro para formato de arquivo inválido via fireEvent', async () => {
    await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);

    const invalidFile = new File(['content'], 'documento.pdf', { type: 'application/pdf' });

    // Use fireEvent.change to trigger the handler directly
    Object.defineProperty(fileInput, 'files', {
      value: {
        0: invalidFile,
        length: 1,
        item: (i: number) => (i === 0 ? invalidFile : null),
        [Symbol.iterator]: function* () {
          yield invalidFile;
        },
      },
      configurable: true,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('não suportado');
    });
  });

  it('deve exibir erro para arquivo maior que 25MB', async () => {
    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);

    const oversizedFile = new File([new Uint8Array(26 * 1024 * 1024)], 'audio.mp3', {
      type: 'audio/mpeg',
    });
    await user.upload(fileInput, oversizedFile);

    await waitFor(() => {
      expect(screen.getByText(/muito grande/i)).toBeInTheDocument();
    });
  });

  it('deve exibir nome do arquivo quando arquivo válido é selecionado', async () => {
    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);

    const validFile = makeAudioFile('minha_gravacao.mp3', 512 * 1024);
    await user.upload(fileInput, validFile);

    await waitFor(() => {
      expect(screen.getByText(/minha_gravacao\.mp3/i)).toBeInTheDocument();
    });
  });

  // ─── Habilitação do botão ──────────────────────────────────────────────────

  it('deve habilitar o botão Transcrever apenas com arquivo e API Key preenchidos', async () => {
    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);
    const keyInput = screen.getByLabelText(/valor da api key/i);

    // Ainda desabilitado com apenas arquivo
    await user.upload(fileInput, makeAudioFile());
    expect(screen.getByRole('button', { name: /transcrever/i })).toBeDisabled();

    // Habilitado após preencher a key
    await user.type(keyInput, 'vxa_mykey123');
    expect(screen.getByRole('button', { name: /transcrever/i })).not.toBeDisabled();
  });

  // ─── Submissão e loading ───────────────────────────────────────────────────

  it('deve mostrar estado de loading durante a transcrição', async () => {
    vi.mocked(transcribeAudioAction).mockImplementation(
      () => new Promise(() => {}), // nunca resolve
    );

    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);
    const keyInput = screen.getByLabelText(/valor da api key/i);

    await user.upload(fileInput, makeAudioFile());
    await user.type(keyInput, 'vxa_testkey');
    await user.click(screen.getByRole('button', { name: /transcrever/i }));

    await waitFor(() => {
      expect(screen.getByText(/transcrevendo/i)).toBeInTheDocument();
    });
  });

  it('deve fechar o dialog após transcrição bem-sucedida', async () => {
    vi.mocked(transcribeAudioAction).mockResolvedValue({
      success: true,
      data: {
        id: 'trans-001',
        text: 'Transcrição de teste.',
        language: 'pt',
        duration: 10,
        wordCount: 3,
        processingTime: 2000,
        createdAt: '2026-02-22T12:00:00Z',
      },
    });

    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);
    const keyInput = screen.getByLabelText(/valor da api key/i);

    await user.upload(fileInput, makeAudioFile());
    await user.type(keyInput, 'vxa_goodkey');
    await user.click(screen.getByRole('button', { name: /transcrever/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deve exibir erro do servidor quando a ação falha', async () => {
    vi.mocked(transcribeAudioAction).mockResolvedValue({
      success: false,
      error: 'API Key inválida ou revogada.',
    });

    const user = await openDialog();
    const fileInput = screen.getByLabelText(/arquivo de áudio/i);
    const keyInput = screen.getByLabelText(/valor da api key/i);

    await user.upload(fileInput, makeAudioFile());
    await user.type(keyInput, 'vxa_badkey');
    await user.click(screen.getByRole('button', { name: /transcrever/i }));

    await waitFor(() => {
      expect(screen.getByText(/api key inválida ou revogada/i)).toBeInTheDocument();
    });
    // Dialog should remain open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ─── Cancelar ─────────────────────────────────────────────────────────────

  it('deve fechar o dialog ao clicar em Cancelar', async () => {
    const user = await openDialog();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ─── Sem API Keys ──────────────────────────────────────────────────────────

  it('deve exibir mensagem quando não há API Keys ativas (todas revogadas)', async () => {
    const revokedKeys: ApiKey[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        label: 'Revogada',
        isRevoked: true,
        lastUsedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    await openDialog(revokedKeys);

    // Verifica pelo data-testid para evitar problemas com texto partido em múltiplos elementos
    expect(screen.getByTestId('no-active-keys')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando a lista de API Keys está vazia', async () => {
    await openDialog([]);

    expect(screen.getByTestId('no-active-keys')).toBeInTheDocument();
  });
});
