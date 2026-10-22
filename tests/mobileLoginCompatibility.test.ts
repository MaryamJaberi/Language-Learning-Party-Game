import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isMobileDevice, 
  isSamsungBrowser, 
  isStandalonePWA, 
  isInAppBrowser, 
  getLocalPlayerProfile, 
  saveLocalPlayerProfile,
  signInWithGoogle,
  initAuthRedirectHandler
} from '../firebase';
import * as firebaseAuth from 'firebase/auth';

describe('Mobile Authentication & Samsung S23+ Compatibility Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Device & Browser Detection', () => {
    it('detects Samsung Internet on Galaxy S23+', () => {
      // Samsung Galaxy S23+ user agent string
      const samsungUA = 'Mozilla/5.0 (Linux; Android 14; SM-S916B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(samsungUA);

      expect(isSamsungBrowser()).toBe(true);
      expect(isMobileDevice()).toBe(true);
      expect(isInAppBrowser()).toBe(false);
    });

    it('detects standard Chrome Mobile on Android', () => {
      const chromeMobileUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(chromeMobileUA);

      expect(isSamsungBrowser()).toBe(false);
      expect(isMobileDevice()).toBe(true);
    });

    it('detects In-App WebViews (Telegram, Instagram, Eitaa)', () => {
      const telegramUA = 'Mozilla/5.0 (Linux; Android 14; SM-S916B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.166 Mobile Safari/537.36 Telegram-Android/10.9.1';
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(telegramUA);

      expect(isInAppBrowser()).toBe(true);
    });

    it('detects standalone PWA mode', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isStandalonePWA()).toBe(true);
    });
  });

  describe('Local Profile Management (100% Offline / Non-Google Phone Support)', () => {
    it('provides default profile when no local profile is stored', () => {
      const profile = getLocalPlayerProfile();
      expect(profile).toBeDefined();
      expect(profile.name).toBe('بازیکن ۱');
      expect(profile.avatarId).toBe('cat_cyber');
    });

    it('saves and retrieves customized local profile', () => {
      saveLocalPlayerProfile({
        name: 'علی قهرمان',
        avatarId: 'samurai'
      });

      const loaded = getLocalPlayerProfile();
      expect(loaded.name).toBe('علی قهرمان');
      expect(loaded.avatarId).toBe('samurai');
    });
  });

  describe('signInWithGoogle Fallback Behavior', () => {
    it('executes redirect when requested explicitly', async () => {
      const spyRedirect = vi.spyOn(firebaseAuth, 'signInWithRedirect');
      await signInWithGoogle({ mode: 'redirect' });

      expect(spyRedirect).toHaveBeenCalledTimes(1);
    });

    it('handles popup-blocked by falling back to redirect on mobile top-level', async () => {
      const popupError = new Error('Popup blocked');
      (popupError as any).code = 'auth/popup-blocked';

      vi.spyOn(firebaseAuth, 'signInWithPopup').mockRejectedValueOnce(popupError);
      const spyRedirect = vi.spyOn(firebaseAuth, 'signInWithRedirect');

      await signInWithGoogle({ mode: 'popup' });
      expect(spyRedirect).toHaveBeenCalled();
    });

    it('resolves redirect result gracefully on page boot', async () => {
      const mockUser = {
        uid: 'user-s23-123',
        displayName: 'Reza S23',
        email: 'reza@example.com',
        photoURL: 'https://example.com/photo.jpg'
      };

      vi.spyOn(firebaseAuth, 'getRedirectResult').mockResolvedValueOnce({
        user: mockUser as any,
        providerId: 'google.com',
        operationType: 'signIn'
      });

      const res = await initAuthRedirectHandler();
      expect(res).toBeDefined();
      expect(res?.uid).toBe('user-s23-123');
    });
  });
});
