# Changelog

All notable changes to Open Travel are documented here.

## [0.1.1] - 2026-04-18

### Fixed

- Map popup no longer crashes when a place has null or undefined name/notes/location
- Clicking a map marker no longer throws a null pointer error due to a race condition between the markers effect and map cleanup
- Map popup outbound link now safely rejects `javascript:` and other non-HTTPS URLs
- Newline characters in place URLs can no longer be used to bypass the URL safety check
- Place coordinates with unexpected string or non-numeric values are now safely coerced before being passed to Mapbox
- `fitBounds` is no longer called when no places have valid coordinates, preventing an empty-bounds error
- XSS (cross-site scripting) via single-quote injection in place names/notes is now blocked by `escapeHtml`

## [0.1.0] - 2026-04-01

### Added

- Initial release of Open Travel
- Trip management with collaborative member access
- Places map with category filters
- Checklists, documents, flights, and reservations
- Budget tracking
- Push notifications and offline PWA support
