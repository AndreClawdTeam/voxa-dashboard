import { ApiKeyTable } from '@/domains/api-keys/components/ApiKeyTable';
import { CreateApiKeyDialog } from '@/domains/api-keys/components/CreateApiKeyDialog';
import { listApiKeys } from '@/domains/api-keys/service';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'API Keys — Voxa Dashboard' };

export default async function ApiKeysPage() {
  const keys = await listApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie suas chaves de API para integrar com a Voxa API.
          </p>
        </div>
        <CreateApiKeyDialog />
      </div>
      <ApiKeyTable keys={keys} />
    </div>
  );
}
