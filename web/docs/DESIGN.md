# UI refresh

Applied the user-selected [AI Design Skills](https://github.com/elayadesign/ai-design-skills) at commit `1c1e97cb9878e236552c772092dda7adcdddbcb2`, plus its recommended [existing-project redesign companion](https://github.com/elayadesign/redesign-skill). These repositories contain design instructions, not an executable UI transformation script. No global agent configuration or tools were installed.

## Diagnosis

The original interface used browser fonts, many 9–13px labels, inconsistent spacing and radii, small tap targets, a flat header, and emoji markers. Buttons lacked distinct pressed states; the roster had no loading skeleton; keyboard users had no skip link.

## Changes

- Self-hosted Manrope at weights 400, 500, 600, and 700; OFL license included.
- Tailwind-aligned text scale and the skill's spacing scale, larger labels and touch targets.
- Existing green brand retained with flat surfaces, a floating navigation island, and one primary session action.
- Phosphor icons with their MIT license; initials replace emoji markers and distinguish people.
- Consistent hover, pressed, focus, loading, empty and error treatments.
- Accessible skip link, current-page navigation, custom 404, factual data/privacy page, and share metadata.
- IntersectionObserver entrances with the skill's easing curve; reduced-motion users receive static content.

The dashboard remains a working application. Marketing-only sections, testimonials, invented proof metrics, a sales FAQ, and a tagline reveal section were not added. Session API, storage, room geometry, sensor capture, and coordinate semantics are preserved.
