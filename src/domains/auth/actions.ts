'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isVoxaApiError } from '@/lib/services';
import { LoginSchema, RegisterSchema } from './schemas';
import { loginUser, logoutUser, registerUser } from './service';

type ActionResult = { success: true } | { success: false; error: Record<string, string[]> };

async function setAuthCookies(accessToken: string, role: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutos
  });

  cookieStore.set('userRole', role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { accessToken, user } = await loginUser(parsed.data.email, parsed.data.password);
    await setAuthCookies(accessToken, user.role);
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: { _form: [err.message] } };
    }
    return { success: false, error: { _form: ['Erro inesperado. Tente novamente.'] } };
  }

  redirect('/dashboard');
}

export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const { accessToken, user } = await registerUser(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password,
    );
    await setAuthCookies(accessToken, user.role);
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: { _form: [err.message] } };
    }
    return { success: false, error: { _form: ['Erro inesperado. Tente novamente.'] } };
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  try {
    await logoutUser();
  } catch {
    // ignora erros — limpar cookies de qualquer forma
  }

  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('userRole');

  redirect('/login');
}
