import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstallPromptModal } from '../components/InstallPromptModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { ADMIN_EMAILS, isAdminUser } from '../constants';

describe('Admin Role and Download Visibility Protection', () => {
  const adminEmail = 'm.jaberi1212@gmail.com';
  const regularEmail = 'regular.user@example.com';

  test('isAdminUser correctly verifies admin email and rejects other users', () => {
    expect(isAdminUser(adminEmail)).toBe(true);
    expect(isAdminUser('M.JABERI1212@GMAIL.COM ')).toBe(true);
    expect(isAdminUser(regularEmail)).toBe(false);
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
  });

  test('InstallPromptModal hides APK tab for regular users or guests', () => {
    const regularUser = { uid: 'u-1', email: regularEmail, displayName: 'Regular User' } as any;

    render(
      <InstallPromptModal
        language="fa"
        isOpen={true}
        onClose={vi.fn()}
        currentUser={regularUser}
      />
    );

    // Regular user should see Android and iOS PWA tabs, but NOT the APK download tab
    expect(screen.queryByText(/فایل APK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google Play/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Android/i)).toBeInTheDocument();
    expect(screen.getByText(/iOS/i)).toBeInTheDocument();
  });

  test('InstallPromptModal shows APK download tab for admin (m.jaberi1212@gmail.com)', () => {
    const adminUser = { uid: 'admin-1', email: adminEmail, displayName: 'Admin User' } as any;

    render(
      <InstallPromptModal
        language="fa"
        isOpen={true}
        onClose={vi.fn()}
        currentUser={adminUser}
      />
    );

    // Admin MUST see the APK download tab
    expect(screen.getByText(/فایل APK/i)).toBeInTheDocument();
  });

  test('UserProfileModal hides Downloads tab for regular users', () => {
    const regularUser = { uid: 'u-2', email: regularEmail, displayName: 'Student' } as any;

    render(
      <UserProfileModal
        language="fa"
        isOpen={true}
        onClose={vi.fn()}
        currentUser={regularUser}
      />
    );

    // Downloads tab should NOT exist for non-admins
    expect(screen.queryByText(/دانلودها/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/مدیر/i)).not.toBeInTheDocument();
  });

  test('UserProfileModal displays Downloads tab and Admin badge for admin user', () => {
    const adminUser = { uid: 'admin-1', email: adminEmail, displayName: 'Mohammad' } as any;

    render(
      <UserProfileModal
        language="fa"
        isOpen={true}
        onClose={vi.fn()}
        currentUser={adminUser}
      />
    );

    // Admin should see Downloads tab and crown / admin badge
    expect(screen.getByText(/دانلودها \(مدیر\)/i)).toBeInTheDocument();
    expect(screen.getByText(/مدیر کل \(Admin\)/i)).toBeInTheDocument();
  });
});
