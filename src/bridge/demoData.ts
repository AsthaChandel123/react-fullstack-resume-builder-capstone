// Shared demo-mode UI strings. All demo MATCH / REPLY / NOTIFICATION
// records live in Firestore now (tagged isDemo:true and readable by
// anyone via the public-read rule branch). This module only holds the
// user-facing banner copy so the dashboards can announce when they are
// showing the seeded dataset.

export const DEMO_BANNER_TEXT = 'Showing the live sample dataset because you have no real match signals yet. Run a Bridge test against any criteria code (try /bridge/FE2026) and your own scorecard will replace this view.';
