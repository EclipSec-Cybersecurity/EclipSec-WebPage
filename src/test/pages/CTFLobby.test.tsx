import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '../test-utils';
import CTFLobby from '../../pages/CTFLobby';
import type { BackendChallenge } from '../../services/challenges';

const mocks = vi.hoisted(() => ({
  getChallenges: vi.fn(),
  getRecentChallenges: vi.fn(),
  getChallengeCategories: vi.fn(),
  getAcademyState: vi.fn(),
  logoutAcademy: vi.fn(),
}));

vi.mock('../../services/challenges', () => ({
  getChallenges: mocks.getChallenges,
  getRecentChallenges: mocks.getRecentChallenges,
  getChallengeCategories: mocks.getChallengeCategories,
}));

vi.mock('../../lib/ctfAcademy', () => ({
  getAcademyState: mocks.getAcademyState,
  logoutAcademy: mocks.logoutAcademy,
}));

const make = (over: Partial<BackendChallenge>): BackendChallenge => ({
  id: 'id',
  slug: 'slug',
  title: 'Reto',
  description: 'Descripción del reto',
  category: 'web',
  difficulty: 'EASY',
  points: 100,
  solves_count: 0,
  is_solved: false,
  ...over,
});

// Backend returns lowercase categories and uppercase difficulties (verified against the live API).
const CHALLENGES: BackendChallenge[] = [
  make({ id: '1', slug: 'web-001', title: 'Hidden in Plain Sight', points: 100, is_solved: true, solves_count: 4 }),
  make({ id: '2', slug: 'web-006', title: 'SQLi Login Bypass', points: 300, difficulty: 'MEDIUM' }),
  make({ id: '3', slug: 'crypto-001', title: 'Caesar Salad', category: 'crypto', points: 50 }),
];

// Scoped to the feed cards: the sidebars also render h3 headings.
const cardTitles = () =>
  screen.getAllByRole('article').map((card) => within(card).getByRole('heading', { level: 3 }).textContent?.trim());

describe('CTFLobby page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('eclipsec_token', 'test-token');
    vi.clearAllMocks();
    mocks.getChallenges.mockResolvedValue(CHALLENGES);
    mocks.getRecentChallenges.mockResolvedValue([]);
    mocks.getChallengeCategories.mockResolvedValue([]);
    mocks.getAcademyState.mockResolvedValue({
      session: { username: 'neo', role: 'user' },
      currentUser: { id: 'u', username: 'neo', role: 'user', nationality: 'CL', score: 100, rankName: 'Noob', globalRank: 3 },
      leaderboard: [],
      participants: 1,
    });
  });

  it('loads the real catalog (no longer hidden) and shows player progress over the full set', async () => {
    render(<CTFLobby />);

    expect(await screen.findByText('SQLi Login Bypass')).toBeInTheDocument();
    expect(mocks.getChallenges).toHaveBeenCalledTimes(1);

    const progress = screen.getByRole('region', { name: /progreso del jugador/i });
    expect(within(progress).getByText(/3 retos activos · 450 PTS en juego/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /retos resueltos/i })).toHaveAttribute('aria-valuenow', '33');
  });

  it('sorts pending challenges first, easiest and cheapest first', async () => {
    render(<CTFLobby />);
    await screen.findByText('SQLi Login Bypass');

    expect(cardTitles()).toEqual(['Caesar Salad', 'SQLi Login Bypass', 'Hidden in Plain Sight']);
  });

  it('filters by status without refetching', async () => {
    const user = userEvent.setup();
    render(<CTFLobby />);
    await screen.findByText('SQLi Login Bypass');

    await user.click(screen.getByRole('button', { name: 'Resueltos' }));
    expect(cardTitles()).toEqual(['Hidden in Plain Sight']);

    await user.click(screen.getByRole('button', { name: 'Pendientes' }));
    expect(cardTitles()).toEqual(['Caesar Salad', 'SQLi Login Bypass']);

    expect(mocks.getChallenges).toHaveBeenCalledTimes(1);
  });

  it('matches category chips case-insensitively against lowercase backend categories', async () => {
    const user = userEvent.setup();
    render(<CTFLobby />);
    await screen.findByText('SQLi Login Bypass');

    await user.click(screen.getByRole('button', { name: /crypto: 0 de 1 resueltos/i }));
    expect(cardTitles()).toEqual(['Caesar Salad']);
  });

  it('shows a filtered-empty state that is distinct from "no challenges", and can clear it', async () => {
    const user = userEvent.setup();
    render(<CTFLobby />);
    await screen.findByText('SQLi Login Bypass');

    await user.type(screen.getByRole('textbox', { name: /buscar retos/i }), 'zzz-no-existe');
    expect(await screen.findByText(/ningún reto coincide con tus filtros/i)).toBeInTheDocument();
    expect(screen.queryByText(/aún no hay retos disponibles/i)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /limpiar filtros/i })[0]);
    expect(await screen.findByText('SQLi Login Bypass')).toBeInTheDocument();
  });

  it('shows the real empty state when the backend has no challenges', async () => {
    mocks.getChallenges.mockResolvedValue([]);
    render(<CTFLobby />);

    expect(await screen.findByText(/aún no hay retos disponibles/i)).toBeInTheDocument();
  });

  it('surfaces a load error and refetches on retry instead of swallowing it', async () => {
    const user = userEvent.setup();
    mocks.getChallenges.mockRejectedValueOnce(new Error('Error HTTP 500'));
    render(<CTFLobby />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error HTTP 500');

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByText('SQLi Login Bypass')).toBeInTheDocument();
    expect(mocks.getChallenges).toHaveBeenCalledTimes(2);
  });

  it('keeps showing challenges when the profile request fails', async () => {
    mocks.getAcademyState.mockRejectedValue(new Error('boom'));
    render(<CTFLobby />);

    expect(await screen.findByText('SQLi Login Bypass')).toBeInTheDocument();
  });

  it('opens the real lab in a new tab when the challenge has an absolute target_url', async () => {
    const user = userEvent.setup();
    mocks.getChallenges.mockResolvedValue([
      make({ id: '9', slug: 'web-009', title: 'Lab Reto', target_url: 'https://ctf.example.com/web-009/' }),
    ]);
    render(<CTFLobby />);
    await screen.findByText('Lab Reto');

    await user.click(screen.getByRole('button', { name: /lanzar reto/i }));

    const link = within(screen.getByRole('dialog')).getByRole('link', { name: /abrir reto/i });
    expect(link).toHaveAttribute('href', 'https://ctf.example.com/web-009/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('does not render a broken link when target_url is relative (backend base URL not configured)', async () => {
    const user = userEvent.setup();
    mocks.getChallenges.mockResolvedValue([
      make({ id: '9', slug: 'web-009', title: 'Lab Reto', target_url: '/web-009/' }),
    ]);
    render(<CTFLobby />);
    await screen.findByText('Lab Reto');

    await user.click(screen.getByRole('button', { name: /lanzar reto/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('link', { name: /abrir reto/i })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('status')).toHaveTextContent(/url pública/i);
  });

  it('refuses to link non-http(s) schemes such as javascript:', async () => {
    const user = userEvent.setup();
    mocks.getChallenges.mockResolvedValue([
      make({ id: '9', slug: 'web-009', title: 'Lab Reto', target_url: 'javascript:alert(1)' }),
    ]);
    render(<CTFLobby />);
    await screen.findByText('Lab Reto');

    await user.click(screen.getByRole('button', { name: /lanzar reto/i }));

    expect(within(screen.getByRole('dialog')).queryByRole('link', { name: /abrir reto/i })).not.toBeInTheDocument();
  });

  it('does not fetch anything when there is no session', async () => {
    localStorage.clear();
    render(<CTFLobby />);

    await waitFor(() => expect(mocks.getChallenges).not.toHaveBeenCalled());
  });
});
