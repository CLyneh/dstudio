import { act, render, screen } from '@testing-library/react';
import type { AccessClient, AccessState } from '@/auth/access';
import { AccessGate } from './AccessGate';

const config = { apiKey: 'k', authDomain: 'd', projectId: 'p', appId: 'a' };

function fakeClient() {
  let emit: (s: AccessState) => void = () => {};
  const client: AccessClient = {
    watch: (cb) => {
      emit = cb;
      return () => {};
    },
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
  };
  return { client, emit: (s: AccessState) => act(() => emit(s)) };
}

describe('AccessGate', () => {
  it('shows the app directly when the gate is off', () => {
    render(<AccessGate config={null}>APP</AccessGate>);
    expect(screen.getByText('APP')).toBeInTheDocument();
  });

  it('hides the app until the e-mail is on the list', async () => {
    const fake = fakeClient();
    render(
      <AccessGate config={config} loadClient={async () => fake.client}>
        APP
      </AccessGate>,
    );
    expect(screen.queryByText('APP')).not.toBeInTheDocument();
    await act(async () => {});

    fake.emit({ kind: 'signed-out' });
    expect(screen.getByRole('button', { name: 'Se connecter avec Google' })).toBeEnabled();

    fake.emit({ kind: 'denied', email: 'x@gmail.com' });
    expect(screen.getByText('x@gmail.com')).toBeInTheDocument();
    expect(screen.queryByText('APP')).not.toBeInTheDocument();

    fake.emit({ kind: 'allowed', email: 'ok@gmail.com' });
    expect(screen.getByText('APP')).toBeInTheDocument();
  });
});
