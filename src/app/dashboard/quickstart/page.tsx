import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/domains/dashboard/components/quickstart/CodeBlock';

export const metadata = { title: 'Quickstart — Voxa Dashboard' };

const CURL_EXAMPLE = `curl -X POST http://138.197.19.184:3000/api/v1/transcribe \\
  -H "Authorization: Bearer SUA_API_KEY" \\
  -F "audio=@seu_arquivo.mp3"`;

const NODEJS_EXAMPLE = `import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const form = new FormData();
form.append('audio', fs.createReadStream('./audio.mp3'));

const response = await fetch('http://138.197.19.184:3000/api/v1/transcribe', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer SUA_API_KEY',
    ...form.getHeaders(),
  },
  body: form,
});

const { data } = await response.json();
console.log(data.transcribedText); // transcrição completa`;

const PYTHON_EXAMPLE = `import requests

with open('audio.mp3', 'rb') as f:
    response = requests.post(
        'http://138.197.19.184:3000/api/v1/transcribe',
        headers={'Authorization': 'Bearer SUA_API_KEY'},
        files={'audio': f}
    )

data = response.json()
print(data['data']['transcribedText'])  # transcrição completa`;

export default function QuickstartPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quickstart</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Integre a Voxa API em minutos com estes exemplos prontos.
        </p>
      </div>

      {/* Seção 1 — Criar API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            Criar uma API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para usar a Voxa API você precisa de uma API Key. Ela será enviada no header{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization</code> de cada
            requisição.
          </p>
          <p className="text-sm text-muted-foreground">
            Acesse{' '}
            <Link
              href="/dashboard/api-keys"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              API Keys
            </Link>{' '}
            para criar sua primeira key. Guarde-a em lugar seguro — ela é exibida apenas uma vez.
          </p>
        </CardContent>
      </Card>

      {/* Seção 2 — cURL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            Sua primeira transcrição com cURL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo de áudio (mp3, wav, ogg, mp4, m4a, flac, webm) com tamanho máximo de
            25MB:
          </p>
          <CodeBlock code={CURL_EXAMPLE} language="bash" />
          <p className="text-xs text-muted-foreground">
            Substitua <code className="bg-muted px-1 py-0.5 rounded">SUA_API_KEY</code> pela key
            criada no passo anterior.
          </p>
        </CardContent>
      </Card>

      {/* Seção 3 — Node.js / TypeScript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            Exemplo em Node.js / TypeScript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Instale as dependências necessárias:{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              npm install form-data node-fetch
            </code>
          </p>
          <CodeBlock code={NODEJS_EXAMPLE} language="typescript" />
        </CardContent>
      </Card>

      {/* Seção 4 — Python */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              4
            </span>
            Exemplo em Python
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Instale a biblioteca:{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">pip install requests</code>
          </p>
          <CodeBlock code={PYTHON_EXAMPLE} language="python" />
        </CardContent>
      </Card>

      {/* Seção 5 — Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              5
            </span>
            Rate Limits por Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Requisições/min
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">Trial</td>
                  <td className="px-4 py-2 text-muted-foreground">20 req/min</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-foreground">Basic</td>
                  <td className="px-4 py-2 text-muted-foreground">60 req/min</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-foreground">Pro</td>
                  <td className="px-4 py-2 text-muted-foreground">300 req/min</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ao atingir o limite, a API retornará{' '}
            <code className="bg-muted px-1 py-0.5 rounded">429 Too Many Requests</code>. Considere
            fazer upgrade do seu plano em{' '}
            <Link
              href="/dashboard/subscription"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Assinatura
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
