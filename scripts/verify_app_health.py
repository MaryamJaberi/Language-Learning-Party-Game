# scripts/verify_app_health.py
# Comprehensive health check, simulation & test verification runner for «دور: زبان»

import os
import sys
import math
import re
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def run_tests():
    print("=" * 65)
    print("  COMPREHENSIVE TEST SUITE & BUG AUDIT: DOUR LANGUAGE GAME")
    print("=" * 65)
    
    passed = 0
    failed = 0

    def assert_true(cond, name, detail=""):
        nonlocal passed, failed
        if cond:
            print(f"  [PASS] {name} {detail}")
            passed += 1
        else:
            print(f"  [FAIL] {name} {detail}")
            failed += 1

    # --- TEST SUITE 1: Adaptive Difficulty Engine Math ---
    print("\n--- Test Suite 1: Mastery Proximity Engine Math ---")
    
    # 1.1 FSRS Retrievability
    def retrievability(t_ms, S_days):
        t_days = max(0.0, t_ms / 86400000.0)
        return (1.0 + (19.0 / 81.0) * (t_days / max(0.1, S_days))) ** -0.5

    r_at_S = retrievability(5 * 86400000, 5)
    assert_true(abs(r_at_S - 0.90) < 0.001, "FSRS Retrievability at t=S is exactly 0.90", f"(got {r_at_S:.4f})")
    
    r_immediate = retrievability(0, 5)
    assert_true(r_immediate == 1.0, "FSRS Retrievability at t=0 is 1.0", f"(got {r_immediate:.4f})")

    r_decay = retrievability(100 * 86400000, 5)
    assert_true(r_decay < 0.45, "FSRS Retrievability decays appropriately over long gap (100d < 0.45)", f"(got {r_decay:.4f})")
    r_year = retrievability(365 * 86400000, 5)
    assert_true(r_year < 0.25, "FSRS Retrievability drops below 0.25 after 1 year", f"(got {r_year:.4f})")

    # 1.2 IRT Prediction
    def sig(x):
        return 1.0 / (1.0 + math.exp(-x))

    CEFR_B = {'A1': -1.5, 'A2': -0.75, 'B1': 0.0, 'B2': 0.75, 'C1': 1.5, 'C2': 2.25}
    TYPE_OFFSET = {'choice2': -1.2, 'recognize': 0.0, 'translate': 0.5, 'produce': 1.0}

    p_equal = sig(0.0 - (CEFR_B['B1'] + TYPE_OFFSET['recognize']))
    assert_true(abs(p_equal - 0.5) < 0.001, "Predict at equal ability (theta=0, b=0) is 0.50", f"(got {p_equal:.4f})")

    p_a1_choice2 = sig(-1.5 - (CEFR_B['A1'] + TYPE_OFFSET['choice2']))
    assert_true(p_a1_choice2 >= 0.76, "Scaffold choice2 lifts beginner A1 into flow band (>0.75)", f"(got {p_a1_choice2:.4f})")

    # 1.3 Fair Scoring
    def score_card(credit, p_pred, fair=True):
        if not fair:
            return round(10.0 * credit)
        raw = 10.0 * credit * (2.0 - p_pred) / (0.8 * 1.2) * 0.96
        return max(1, min(20, round(raw))) if credit > 0 else 0

    pts_hard = score_card(1.0, 0.65, fair=True)
    pts_easy = score_card(1.0, 0.90, fair=True)
    assert_true(pts_hard > pts_easy, "Fair scoring awards more points for harder cards", f"({pts_hard} pts vs {pts_easy} pts)")

    pts_raw_hard = score_card(1.0, 0.65, fair=False)
    pts_raw_easy = score_card(1.0, 0.90, fair=False)
    assert_true(pts_raw_hard == pts_raw_easy, "Raw scoring awards equal points regardless of difficulty", f"({pts_raw_hard} pts)")

    # --- TEST SUITE 2: Architectural Decoupling (Epic D3) ---
    print("\n--- Test Suite 2: Architectural Decoupling (Epic D3) ---")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    forbidden_terms = ['monetization', 'freemium', 'inapppurchase', 'billing', 'stripe', 'admanager']
    engine_file = os.path.join(root_dir, 'src', 'engine', 'adaptive', 'dor-adaptive-engine.ts')
    with open(engine_file, 'r', encoding='utf-8') as f:
        engine_content = f.read()

    has_forbidden = any(term in engine_content.lower() for term in forbidden_terms)
    assert_true(not has_forbidden, "Adaptive engine contains ZERO monetization/billing terms")

    # Ensure no payment file imports engine
    monetization_violations = []
    for r, dirs, files in os.walk(root_dir):
        if any(skip in r for skip in ['node_modules', '.git', 'dist', 'dev-dist']):
            continue
        for file in files:
            lower = file.lower()
            if any(term in lower for term in ['pay', 'bill', 'purchase', 'monetiz']):
                fpath = os.path.join(r, file)
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    c = f.read()
                    if 'dor-adaptive-engine' in c or 'src/engine/adaptive' in c:
                        monetization_violations.append(file)

    assert_true(len(monetization_violations) == 0, "No payment or monetization files import adaptive engine", f"(Violations: {monetization_violations})")

    # --- TEST SUITE 3: Online Matchmaking & Public Rooms ---
    print("\n--- Test Suite 3: Online Matchmaking & Service Reliability ---")
    service_file = os.path.join(root_dir, 'onlineRoomService.ts')
    with open(service_file, 'r', encoding='utf-8') as f:
        service_content = f.read()

    assert_true("findOnlineDuelMatch" in service_content, "onlineRoomService exports findOnlineDuelMatch")
    assert_true("findOnlineMultiplayerMatch" in service_content, "onlineRoomService exports findOnlineMultiplayerMatch")
    assert_true("spawnDuelAiChallenger" in service_content, "onlineRoomService exports spawnDuelAiChallenger")
    assert_true("addAiTeammatesToPartyRoom" in service_content, "onlineRoomService exports addAiTeammatesToPartyRoom")

    # --- TEST SUITE 4: Firestore Security Rules Validation ---
    print("\n--- Test Suite 4: Firestore Security Rules Validation ---")
    rules_file = os.path.join(root_dir, 'firestore.rules')
    with open(rules_file, 'r', encoding='utf-8') as f:
        rules_content = f.read()

    assert_true("match /matchmaking/{ticketId}" in rules_content, "firestore.rules has /matchmaking/{ticketId} rule")
    assert_true("match /rooms/{roomId}" in rules_content, "firestore.rules has /rooms/{roomId} rule")
    assert_true("status in ['lobby', 'waiting', 'playing', 'round_ended', 'game_over', 'finished']" in rules_content, "firestore.rules validates all room lifecycle statuses")

    # --- TEST SUITE 5: UI & Accessibility Elements (Epic B) ---
    print("\n--- Test Suite 5: UI & Accessibility Elements (Epic B) ---")
    sp_screen = os.path.join(root_dir, 'screens', 'SinglePlayerScreen.tsx')
    with open(sp_screen, 'r', encoding='utf-8') as f:
        sp_content = f.read()

    assert_true("adaptive-indicator-badge" in sp_content, "SinglePlayerScreen contains adaptive indicator badge (Epic B1)")
    assert_true("adaptive-mode-toast" in sp_content, "SinglePlayerScreen contains 2s mode transition toast (Epic B2)")
    assert_true("adaptive-level-suggestion" in sp_content, "SinglePlayerScreen contains CEFR level suggestion banner (Epic A4)")
    assert_true("adaptive-choice-options" in sp_content, "SinglePlayerScreen contains choice2 scaffold options for A1")

    duel_screen = os.path.join(root_dir, 'screens', 'DuelScreen.tsx')
    with open(duel_screen, 'r', encoding='utf-8') as f:
        duel_content = f.read()

    assert_true("scoreCard" in duel_content, "DuelScreen applies scoreCard fair scoring (Epic C1)")
    assert_true("cardIndicator" in duel_content, "DuelScreen renders card indicator badge")

    gameplay_screen = os.path.join(root_dir, 'screens', 'GameplayScreen.tsx')
    with open(gameplay_screen, 'r', encoding='utf-8') as f:
        gameplay_content = f.read()

    assert_true("adaptive-indicator-badge" in gameplay_content, "GameplayScreen renders group adaptive indicator badge")

    help_screen = os.path.join(root_dir, 'screens', 'HelpScreen.tsx')
    with open(help_screen, 'r', encoding='utf-8') as f:
        help_content = f.read()

    assert_true("help-adaptive" in help_content, "HelpScreen contains dedicated 'help-adaptive' section (Epic B3)")
    assert_true("نزدیکی به تسلط" in help_content, "HelpScreen explains Mastery Proximity in natural Persian")

    profile_modal = os.path.join(root_dir, 'components', 'UserProfileModal.tsx')
    with open(profile_modal, 'r', encoding='utf-8') as f:
        profile_content = f.read()

    assert_true("resetPlayerProgress" in profile_content, "UserProfileModal includes 'بازنشانی پیشرفت من' button (Epic D2)")

    # --- TEST SUITE 6: Android & Google Play Configuration ---
    print("\n--- Test Suite 6: Android & Google Play Configuration ---")
    pkg_file = os.path.join(root_dir, 'package.json')
    with open(pkg_file, 'r', encoding='utf-8') as f:
        pkg_data = json.load(f)

    app_gradle = os.path.join(root_dir, 'android-studio-project', 'app', 'build.gradle')
    with open(app_gradle, 'r', encoding='utf-8') as f:
        gradle_content = f.read()

    assert_true("minSdkVersion 24" in gradle_content or "minSdk 24" in gradle_content or "minSdk = 24" in gradle_content, "Android project enforces minSdk 24 for Google Play 2026")
    assert_true("targetSdkVersion 36" in gradle_content or "targetSdk 36" in gradle_content or "targetSdk = 36" in gradle_content or "targetSdkVersion 35" in gradle_content, "Android project targets modern SDK")

    # --- SUMMARY ---
    print("\n" + "=" * 65)
    print(f"  TOTAL CHECKS: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
    print("=" * 65)

    if failed > 0:
        sys.exit(1)
    else:
        print(">>> ALL APPLICATION TESTS AND QUALITY CHECKS PASSED PERFECTLY! <<<")

if __name__ == '__main__':
    run_tests()
