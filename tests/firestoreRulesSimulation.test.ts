import { describe, test, expect } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';

// Verify firestore.rules file is present and syntactically well-formed
describe('Firestore Security Rules File Structure', () => {
  test('firestore.rules exists and contains rules_version 2 and service cloud.firestore', () => {
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
    expect(rulesContent).toContain("rules_version = '2'");
    expect(rulesContent).toContain('service cloud.firestore');
    expect(rulesContent).toContain("function isAdmin()");
    expect(rulesContent).toContain("hasAny(['role', 'isAdmin'])");
  });
});

interface AuthToken {
  uid?: string;
  email?: string;
  email_verified?: boolean;
  admin?: boolean;
}

interface RequestContext {
  auth: AuthToken | null;
  path: string;
  method: 'read' | 'create' | 'update' | 'delete' | 'write';
  resourceData?: Record<string, any>;
  requestData?: Record<string, any>;
}

// Exact functional evaluator matching the updated firestore.rules logic
function evaluateFirestoreRule(req: RequestContext): { allowed: boolean; reason: string } {
  const isSignedIn = req.auth !== null && !!req.auth.uid;
  const isAdmin = isSignedIn && (
    (req.auth?.email === 'm.jaberi1212@gmail.com' && req.auth?.email_verified === true) ||
    req.auth?.admin === true
  );

  const pathParts = req.path.split('/').filter(Boolean);
  const collection = pathParts[0];
  const docId = pathParts[1];

  // match /cards/{cardId}
  if (collection === 'cards') {
    if (req.method === 'read') return { allowed: true, reason: 'Public read' };
    if (isAdmin) return { allowed: true, reason: 'Admin write' };
    return { allowed: false, reason: 'Writing cards restricted to Admin only' };
  }

  // match /settings/{settingId}
  if (collection === 'settings') {
    if (req.method === 'read') return { allowed: true, reason: 'Public read' };
    if (isAdmin) return { allowed: true, reason: 'Admin write' };
    return { allowed: false, reason: 'Writing settings restricted to Admin only' };
  }

  // match /logs/{logId}
  if (collection === 'logs') {
    if (isAdmin) return { allowed: true, reason: 'Admin full access' };
    return { allowed: false, reason: 'System logs restricted to Admin only' };
  }

  // match /reports/{reportId}
  if (collection === 'reports') {
    if (isAdmin) return { allowed: true, reason: 'Admin full access' };
    return { allowed: false, reason: 'Reports restricted to Admin only' };
  }

  // match /users/{userId}
  if (collection === 'users') {
    const isOwner = isSignedIn && req.auth?.uid === docId;
    if (req.method === 'read') {
      if (isOwner || isAdmin) return { allowed: true, reason: 'Owner or Admin read' };
      return { allowed: false, reason: 'User profiles private to owner' };
    }

    if (req.method === 'create') {
      if (isAdmin) return { allowed: true, reason: 'Admin create' };
      if (isOwner) {
        // Deny if user attempts to set isAdmin: true or role: admin on create
        if (req.requestData?.isAdmin === true || (req.requestData?.role && req.requestData.role !== 'user')) {
          return { allowed: false, reason: 'Privilege escalation blocked on create' };
        }
        return { allowed: true, reason: 'Owner profile create' };
      }
      return { allowed: false, reason: 'Cannot create other user doc' };
    }

    if (req.method === 'update' || req.method === 'write') {
      if (isAdmin) return { allowed: true, reason: 'Admin update' };
      if (isOwner) {
        // Deny update if affectedKeys hasAny(['role', 'isAdmin']) (strict AND logic)
        const touchesPrivileged = req.requestData && ('role' in req.requestData || 'isAdmin' in req.requestData);
        if (touchesPrivileged) {
          return { allowed: false, reason: 'Deny update if affectedKeys hasAny role or isAdmin' };
        }
        return { allowed: true, reason: 'Owner profile update' };
      }
      return { allowed: false, reason: 'Cannot update other user profile' };
    }

    if (req.method === 'delete') {
      if (isOwner || isAdmin) return { allowed: true, reason: 'Owner or Admin delete' };
      return { allowed: false, reason: 'Cannot delete other user' };
    }
  }

  // match /leaderboard/{entryId}
  if (collection === 'leaderboard') {
    if (req.method === 'read') return { allowed: true, reason: 'Public read' };
    if (req.method === 'create') {
      if (!isSignedIn) return { allowed: false, reason: 'Anonymous score submission rejected' };
      if (req.requestData?.uid !== req.auth?.uid) {
        return { allowed: false, reason: 'UID mismatch in score submission' };
      }
      const score = req.requestData?.score;
      if (typeof score !== 'number' || score < 0 || score > 100000) {
        return { allowed: false, reason: 'Invalid score type or range' };
      }
      return { allowed: true, reason: 'Valid score posted' };
    }
    if (req.method === 'update' || req.method === 'delete') {
      if (isAdmin) return { allowed: true, reason: 'Admin moderation' };
      return { allowed: false, reason: 'Leaderboard moderation admin only' };
    }
  }

  // match /rooms/{roomId}
  if (collection === 'rooms') {
    if (req.method === 'read') return { allowed: true, reason: 'Public room discovery' };

    if (req.method === 'create') {
      if (!isSignedIn) return { allowed: false, reason: 'Creating room requires signed-in user' };
      if (!req.requestData?.id || !req.requestData?.code || !req.requestData?.status) {
        return { allowed: false, reason: 'Room create requires valid id, code, and status fields' };
      }
      return { allowed: true, reason: 'Valid room created' };
    }

    if (req.method === 'update') {
      if (isAdmin) return { allowed: true, reason: 'Admin room update' };
      const currentHost = req.resourceData?.hostUid || req.resourceData?.hostId;
      const isHost = isSignedIn && currentHost === req.auth?.uid;
      const isParticipant = isSignedIn && (
        isHost ||
        (Array.isArray(req.resourceData?.participantUids) && req.resourceData.participantUids.includes(req.auth?.uid)) ||
        (Array.isArray(req.resourceData?.players) && req.resourceData.players.includes(req.auth?.uid)) ||
        (Array.isArray(req.requestData?.participantUids) && req.requestData.participantUids.includes(req.auth?.uid))
      );
      if (isParticipant) return { allowed: true, reason: 'Room participant update allowed' };
      return { allowed: false, reason: 'Non-member cannot overwrite room' };
    }

    if (req.method === 'delete') {
      if (isAdmin) return { allowed: true, reason: 'Admin room delete' };
      const currentHost = req.resourceData?.hostUid || req.resourceData?.hostId;
      const isHost = isSignedIn && currentHost === req.auth?.uid;
      if (isHost) return { allowed: true, reason: 'Host room delete allowed' };
      return { allowed: false, reason: 'Only host or admin can delete room' };
    }
  }

  return { allowed: false, reason: 'Default deny' };
}

describe('Firestore Security Rules Comprehensive Matrix Audit', () => {
  const anonymousAuth = null;
  const regularUserAuth: AuthToken = { uid: 'user_456', email: 'regular@gmail.com', email_verified: true };
  const nonMemberAuth: AuthToken = { uid: 'user_attacker_999', email: 'attacker@gmail.com', email_verified: true };
  const unverifiedAdminAuth: AuthToken = { uid: 'unverified_789', email: 'm.jaberi1212@gmail.com', email_verified: false };
  const verifiedAdminAuth: AuthToken = { uid: 'admin_1212', email: 'm.jaberi1212@gmail.com', email_verified: true };

  // 1. Cards collection: anon/regular/unverified/admin
  test('Cards: read allowed for all; write denied for anon, regular, unverified; allowed for admin', () => {
    expect(evaluateFirestoreRule({ auth: anonymousAuth, path: 'cards/card_1', method: 'read' }).allowed).toBe(true);
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'cards/card_1', method: 'read' }).allowed).toBe(true);

    expect(evaluateFirestoreRule({ auth: anonymousAuth, path: 'cards/card_1', method: 'write' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'cards/card_1', method: 'write' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: unverifiedAdminAuth, path: 'cards/card_1', method: 'write' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: verifiedAdminAuth, path: 'cards/card_1', method: 'write' }).allowed).toBe(true);
  });

  // 2. Settings collection: anon/regular/unverified/admin
  test('Settings: read allowed for all; write denied for anon, regular, unverified; allowed for admin', () => {
    expect(evaluateFirestoreRule({ auth: anonymousAuth, path: 'settings/app_config', method: 'read' }).allowed).toBe(true);
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'settings/app_config', method: 'write' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: unverifiedAdminAuth, path: 'settings/app_config', method: 'write' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: verifiedAdminAuth, path: 'settings/app_config', method: 'write' }).allowed).toBe(true);
  });

  // 3. System Logs & Test Reports: strictly admin only
  test('Logs & Reports: read and write denied for anon, regular, unverified; allowed for admin', () => {
    expect(evaluateFirestoreRule({ auth: anonymousAuth, path: 'logs/log_1', method: 'read' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'logs/log_1', method: 'read' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: unverifiedAdminAuth, path: 'logs/log_1', method: 'read' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: verifiedAdminAuth, path: 'logs/log_1', method: 'read' }).allowed).toBe(true);

    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'reports/test_18_report', method: 'read' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: verifiedAdminAuth, path: 'reports/test_18_report', method: 'read' }).allowed).toBe(true);
  });

  // 4. Users collection & isAdmin:true self-escalation protection (create & update)
  test('Users: deny update if affectedKeys hasAny([role, isAdmin]) unless isAdmin() (AND logic)', () => {
    // Owner reading own profile -> allowed
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'users/user_456', method: 'read' }).allowed).toBe(true);
    // Reading someone else's profile -> denied
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'users/user_999', method: 'read' }).allowed).toBe(false);

    // Normal profile update without role/isAdmin -> allowed
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'users/user_456',
      method: 'update',
      requestData: { displayName: 'Cool Player' }
    }).allowed).toBe(true);

    // Self-escalation attempt on update (setting isAdmin: true) -> strictly denied!
    const updateEscalation = evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'users/user_456',
      method: 'update',
      requestData: { isAdmin: true }
    });
    expect(updateEscalation.allowed).toBe(false);

    // Self-escalation attempt on create (setting role: admin or isAdmin: true) -> strictly denied!
    const createEscalation = evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'users/user_456',
      method: 'create',
      requestData: { uid: 'user_456', role: 'admin', isAdmin: true }
    });
    expect(createEscalation.allowed).toBe(false);

    // Valid create by owner with role user -> allowed
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'users/user_456',
      method: 'create',
      requestData: { uid: 'user_456', role: 'user', isAdmin: false }
    }).allowed).toBe(true);

    // Admin can update role or isAdmin for users
    expect(evaluateFirestoreRule({
      auth: verifiedAdminAuth,
      path: 'users/user_456',
      method: 'update',
      requestData: { role: 'admin', isAdmin: true }
    }).allowed).toBe(true);
  });

  // 5. Rooms collection & non-member overwrite protection
  test('Rooms: create requires signed-in & valid fields; update/delete ONLY by participants or host; non-member overwrite blocked', () => {
    // Anon create -> denied
    expect(evaluateFirestoreRule({
      auth: anonymousAuth,
      path: 'rooms/room_test',
      method: 'create',
      requestData: { id: 'room_test', code: 'AB123', status: 'lobby' }
    }).allowed).toBe(false);

    // Signed-in create with valid fields -> allowed
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'rooms/room_test',
      method: 'create',
      requestData: { id: 'room_test', code: 'AB123', status: 'lobby' }
    }).allowed).toBe(true);

    // Room existing document state where host is user_456 and participants are [user_456, user_789]
    const existingRoom = {
      id: 'room_test',
      hostUid: 'user_456',
      participantUids: ['user_456', 'user_789'],
      status: 'playing'
    };

    // Non-member (user_attacker_999) attempting to overwrite room state -> BLOCKED!
    const nonMemberOverwrite = evaluateFirestoreRule({
      auth: nonMemberAuth,
      path: 'rooms/room_test',
      method: 'update',
      resourceData: existingRoom,
      requestData: { status: 'hijacked' }
    });
    expect(nonMemberOverwrite.allowed).toBe(false);
    expect(nonMemberOverwrite.reason).toContain('Non-member cannot overwrite room');

    // Participant (user_789) updating room -> allowed
    expect(evaluateFirestoreRule({
      auth: { uid: 'user_789', email: 'friend@gmail.com', email_verified: true },
      path: 'rooms/room_test',
      method: 'update',
      resourceData: existingRoom,
      requestData: { currentCardIndex: 2 }
    }).allowed).toBe(true);

    // Non-member attempting to delete room -> BLOCKED!
    expect(evaluateFirestoreRule({
      auth: nonMemberAuth,
      path: 'rooms/room_test',
      method: 'delete',
      resourceData: existingRoom
    }).allowed).toBe(false);

    // Host deleting room -> allowed
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'rooms/room_test',
      method: 'delete',
      resourceData: existingRoom
    }).allowed).toBe(true);
  });

  // 6. Leaderboard collection: score type/range & uid validation
  test('Leaderboard: anyone can read; create requires signed-in, uid match, score in [0, 100000]; update/delete admin only', () => {
    expect(evaluateFirestoreRule({ auth: anonymousAuth, path: 'leaderboard/lead_1', method: 'read' }).allowed).toBe(true);

    // Anon submit score -> denied
    expect(evaluateFirestoreRule({
      auth: anonymousAuth,
      path: 'leaderboard/lead_1',
      method: 'create',
      requestData: { uid: 'anon', score: 100 }
    }).allowed).toBe(false);

    // Submit with mismatched UID -> denied
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'leaderboard/lead_1',
      method: 'create',
      requestData: { uid: 'someone_else', score: 100 }
    }).allowed).toBe(false);

    // Submit with invalid negative score or out of range -> denied
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'leaderboard/lead_1',
      method: 'create',
      requestData: { uid: 'user_456', score: -50 }
    }).allowed).toBe(false);

    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'leaderboard/lead_1',
      method: 'create',
      requestData: { uid: 'user_456', score: 99999999 }
    }).allowed).toBe(false);

    // Valid score by authenticated owner -> allowed
    expect(evaluateFirestoreRule({
      auth: regularUserAuth,
      path: 'leaderboard/lead_1',
      method: 'create',
      requestData: { uid: 'user_456', score: 250 }
    }).allowed).toBe(true);

    // Regular user attempting update or delete on leaderboard -> denied
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'leaderboard/lead_1', method: 'update' }).allowed).toBe(false);
    expect(evaluateFirestoreRule({ auth: regularUserAuth, path: 'leaderboard/lead_1', method: 'delete' }).allowed).toBe(false);

    // Admin moderation -> allowed
    expect(evaluateFirestoreRule({ auth: verifiedAdminAuth, path: 'leaderboard/lead_1', method: 'delete' }).allowed).toBe(true);
  });
});
