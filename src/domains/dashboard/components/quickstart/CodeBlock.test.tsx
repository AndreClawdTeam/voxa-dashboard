import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeBlock } from './CodeBlock';

const SAMPLE_CODE = 'curl -X POST http://example.com/api/v1/transcribe';

// Define o mock de clipboard antes de cada teste (padrão do projeto)
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

describe('CodeBlock', () => {
  it('deve renderizar o código corretamente', () => {
    render(<CodeBlock code={SAMPLE_CODE} />);
    expect(screen.getByText(SAMPLE_CODE)).toBeInTheDocument();
  });

  it('deve exibir o rótulo de linguagem quando fornecido', () => {
    render(<CodeBlock code={SAMPLE_CODE} language="bash" />);
    expect(screen.getByText('bash')).toBeInTheDocument();
  });

  it('não deve exibir rótulo de linguagem quando não fornecido', () => {
    render(<CodeBlock code={SAMPLE_CODE} />);
    expect(screen.queryByText('bash')).not.toBeInTheDocument();
    expect(screen.queryByText('typescript')).not.toBeInTheDocument();
  });

  it('deve exibir botão de copiar', () => {
    render(<CodeBlock code={SAMPLE_CODE} />);
    expect(screen.getByRole('button', { name: /copiar código/i })).toBeInTheDocument();
  });

  it('deve copiar o código para o clipboard ao clicar no botão', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<CodeBlock code={SAMPLE_CODE} />);

    // Usar fireEvent para evitar interceptação do clipboard pelo userEvent.setup()
    fireEvent.click(screen.getByRole('button', { name: /copiar código/i }));
    await Promise.resolve(); // flush async writeText

    expect(writeText).toHaveBeenCalledWith(SAMPLE_CODE);
  });

  it('deve mostrar "Copiado!" após copiar', async () => {
    render(<CodeBlock code={SAMPLE_CODE} />);

    fireEvent.click(screen.getByRole('button', { name: /copiar código/i }));

    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });
  });

  it('deve renderizar código Python corretamente — exibe label de linguagem', () => {
    const pythonCode = `import requests\n\nresponse = requests.post('http://example.com')`;
    render(<CodeBlock code={pythonCode} language="python" />);

    expect(screen.getByText('python')).toBeInTheDocument();

    // O código está dentro de <pre><code> — verifica o conteúdo do elemento
    const pre = document.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('import requests');
    expect(pre?.textContent).toContain("requests.post('http://example.com')");
  });

  it('deve renderizar código TypeScript corretamente', () => {
    const tsCode = `const response = await fetch('http://example.com');`;
    render(<CodeBlock code={tsCode} language="typescript" />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText(tsCode)).toBeInTheDocument();
  });

  it('deve renderizar código bash com label correto', () => {
    const bashCode = 'curl -X POST http://api.example.com';
    render(<CodeBlock code={bashCode} language="bash" />);
    expect(screen.getByText('bash')).toBeInTheDocument();
    expect(screen.getByText(bashCode)).toBeInTheDocument();
  });
});
