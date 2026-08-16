#!/usr/bin/env bash
set +e
commands=(
  "npm run lint"
  "npm run build"
  "npm run test:conversation-generation"
  "npm run test:conversation-first-routing"
  "npm run test:conversation-turn-contract"
  "npm run test:conversational-intelligence"
  "npm run test:natural-interleaving"
  "npm run test:context-arbitration"
  "npm run test:canonical-conversation-owner"
  "npm run test:conversation-models"
  "npm run test:ai-semantic-proposal"
  "npm run test:agent-runtime"
  "npm run test:agent-control"
  "npm run test:economic-lifecycle"
  "npm run test:execution-boundary"
  "npm run test:subscription"
  "npm run test:reminder-safety-coordinator"
  "npm run test:referral"
  "npm run test:points"
  "npm run test:qr"
  "npm run test:notification-queue"
  "npm run test:discovery-network"
  "npm run test:local-repair-outcome"
  "npm run test:routes"
  "npm run test:security"
  "npm run test:pwa"
  "npm run test:public"
  "npm run audit:accessibility"
  "npm run audit:css:all"
  "npm run audit:css:strict"
)
log="/tmp/kurukoo-requested-validation.log"
: > "$log"
pass=0
fail=0
for command in "${commands[@]}"; do
  printf '\n===== %s =====\n' "$command" | tee -a "$log"
  bash -lc "$command" >> "$log" 2>&1
  status=$?
  if [ "$status" -eq 0 ]; then pass=$((pass+1)); result=PASS; else fail=$((fail+1)); result=FAIL; fi
  printf '%s\t%s\t%s\n' "$result" "$status" "$command" | tee -a "$log"
done
printf '\nSUMMARY pass=%s fail=%s\n' "$pass" "$fail" | tee -a "$log"
exit "$fail"
