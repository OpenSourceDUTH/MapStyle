import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transitStopLayers} from '../src/layers/transit/stops.mjs';
import {poiMarkerLayers} from '../src/layers/poi/markers.mjs';
import {selectedPoiAnimationValues} from '../sdk/selection/floating-marker/animation.mjs';
test('bus stops keep precise anchors through all zoom bands without forcing full icon overlap', () => {
 for(const zoom of [13,14,15,16,17,17.99,18,19,20,22]) {
  const anchor=transitStopLayers.find(l=>l.id==='transit-stop-anchors');
  assert.equal(anchor.minzoom,13); assert.equal(anchor.layout['icon-allow-overlap'],true);
  const active=transitStopLayers.filter(l=>l.id!=='transit-stop-anchors').filter(l=>zoom>=l.minzoom&&zoom<(l.maxzoom??Infinity));
  assert.equal(active.length,1);assert.equal(active[0].layout['icon-allow-overlap'],false);
 }
});
test('pharmacy eligibility does not depend on rank bands',()=>{
 const l=poiMarkerLayers.find(l=>l.id==='poi-markers-pharmacy');
 assert.equal(l.minzoom,13);assert.equal(l.maxzoom,undefined);
 assert.equal(l.layout['icon-allow-overlap'],false);
 assert.deepEqual(l.filter,['==',['get','subtype'],'pharmacy']);
});
test('selected 28px pictogram is bounded for mobile layouts',()=>{
 assert.equal(selectedPoiAnimationValues(0).scale,1);
 assert.equal(selectedPoiAnimationValues(1).scale,1.6);
 assert.ok(28*selectedPoiAnimationValues(1).scale<45);
});
