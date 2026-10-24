#!/usr/bin/env bash
# Entry point of the Docker test runner (compose.tests.yaml).
# The first argument selects the test layer, all other arguments go to Playwright unchanged.
set -uo pipefail

usage() {
  cat <<'EOF'
Usage: docker compose -f compose.tests.yaml run --build --rm tests [layer] [Playwright arguments]

Layers:
  all          Isolated UI tests, then API, DB, Hybrid and E2E tests (default)
  ui           Isolated UI tests only; no database needed
  integrated   API, DB, Hybrid and E2E tests; recreates the test database first

Examples:
  ... tests ui tests/ui/cart.cross-tab.ui.spec.ts
  ... tests integrated --project=api
  ... tests all --grep "adds a product to the cart"
  ... run --build --rm -e FEATURE=cart -e BROWSERS=firefox tests ui

Variables (pass with -e): BROWSERS, FEATURE, SMOKE_ONLY.
EOF
}

layer="${1:-all}"

if [[ $# -gt 0 ]]; then
  shift
fi

case "$layer" in
  ui)
    exec npm run test:ui -- "$@"
    ;;
  integrated)
    exec npm run test:integrated -- "$@"
    ;;
  all)
    # A filter such as --grep can match tests in only one of the two configs.
    # --pass-with-no-tests keeps the other config from failing the run.
    npm run test:ui -- --pass-with-no-tests "$@"
    ui_exit_code=$?

    # Integrated tests run even if UI tests failed, so one run shows every failure.
    npm run test:integrated -- --pass-with-no-tests "$@"
    integrated_exit_code=$?

    if ((ui_exit_code != 0 || integrated_exit_code != 0)); then
      echo "Test run failed: ui exit code ${ui_exit_code}, integrated exit code ${integrated_exit_code}." >&2
      exit 1
    fi
    ;;
  help | -h | --help)
    usage
    ;;
  *)
    echo "Unknown layer: \"${layer}\"." >&2
    echo >&2
    usage >&2
    exit 2
    ;;
esac
