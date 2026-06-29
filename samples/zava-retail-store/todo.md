# Zava Retail Copilot - Development Todo

## Phase 1 - Foundation
- [x] Analyze existing SPFx Copilot component and manifest capabilities.
- [x] Define React-based architecture with functional components.
- [x] Add React 17.0.1 and Fluent UI v9 dependencies.

## Phase 2 - Copilot Host Integration
- [x] Replace plain text render with React mounting in copilot component.
- [x] Add teardown unmount logic for clean lifecycle handling.
- [x] Add fullscreen request handler based on host display mode switching.

## Phase 3 - Configurable Properties
- [x] Add useMock property to control mock/real service behavior.
- [x] Add dataServiceUrl property for real service mode wiring.
- [x] Add theme property with light/dark values.
- [x] Enforce schema rule: dataServiceUrl required when useMock=false.

## Phase 4 - Data Layer
- [x] Add service abstraction for loading dashboard data.
- [x] Implement startup mock data generation with dynamic date/time context.
- [x] Add `isDataLoading` state-driven spinner handling.
- [x] Scaffold real data mode path for future API integration.
- [x] In real mode, use Microsoft Graph for current user profile/photo with fallback.

## Phase 5 - UI Experience
- [x] Build INLINE experience inspired by target design.
- [x] Build FULL SCREEN dashboard experience inspired by target design.
- [x] Implement display mode switch based on hostContext.displayMode.
- [x] Implement top products carousel with next/previous controls.
- [x] Add settings panel opened via fullscreen gear icon.
- [x] Add static footer text: AI-generated disclaimer, Work IQ attribution, feedback action.
- [x] Add light/dark theme support and runtime selection in settings.

## Phase 6 - Product Assets
- [x] Generate and embed 8 product images as local SVG assets.
- [x] Bind product assets into mock product dataset for deployment packaging.

## Phase 7 - Validation
- [x] Install/update npm dependencies.
- [x] Run project build and fix any type or compile issues.
- [ ] Verify runtime behavior in inline and fullscreen host modes.
