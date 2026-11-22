# POI label anchors and priority (2026-10-06)

Named POI label symbols now contain a small green precise-location sprite.
Text and dot share placement: rejected labels do not leave arbitrary dots.
Full pictograms render above dots, respect collisions and have enough label
spacing to avoid colliding with their own side labels. Universities have a
separate label and marker from zoom 13; university/pharmacy markers are
placed before ordinary POIs. Bus stops retain an exact anchor from zoom 13
through every scale while full pictograms respect collisions.

Local atlas mapping previously used subtype directly (university rather
than college), missing local sprite names. The live Martin atlas had a
university alias, but both university and college were bare black 15px
Maki glyphs. Updated education-college is the colored white-glyph 28px
marker; other server sprites are preserved. The new dot requires Martin
to reload its sprite inventory. Existing styles were backed up before the
approved deployment; no database refresh or public ingress change.

Runtime queries now include rendered POI names, pictograms, bus symbols,
stop anchors and stop names. Bus hit areas begin at zoom 13 and use a tiny
nonzero opacity. Visible POIs win over underlying roads; bus stops retain
interaction precedence. POI selection hides normal symbols by place_id
first, even if a queried feature has a different renderer ID. Deselect
restores original filters through the existing floating-marker lifecycle.

Compiled JSON deploys rendering only. Click routing, selection hiding and
1.6x selected enlargement require the consuming Demo_Map app to import
and build the updated runtime. The handoff directory/archive contains the
changed interaction, selection and icon helper modules. No Demo_Map/API/
SDK/Admin Panel repository was modified here.

Validation: all four test files pass, all three MapLibre styles validate,
every mapped subtype resolves to an atlas image. Local browser confirmed
the university pictogram and clicking the university name reaches POI
selection. Additional mobile selection/dense-collision visual verification
remains necessary in the consuming app.
