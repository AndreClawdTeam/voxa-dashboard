import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Voxa Dashboard</CardTitle>
          <CardDescription>Portal de gerenciamento da Voxa API</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <a href="/login">Entrar</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/register">Criar conta</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
