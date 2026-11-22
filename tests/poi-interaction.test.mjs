import {test} from 'node:test';
import assert from 'node:assert/strict';

import {poiLabelLayers} from '../src/layers/poi/labels.mjs';
import {poiSelectionLayers} from '../sdk/selection-layers/poi.mjs';
import {selectedPoiAnimationValues} from '../sdk/selection/floating-marker.mjs';


test('unselected POI labels retain dynamic side placement and a coupled origin dot', () => {
    const label = poiLabelLayers.find(layer => layer.id === 'poi-labels-detail');

    assert.ok(label);
    assert.deepEqual(label.layout['text-variable-anchor'], ['left', 'right']);
    assert.equal(label.layout['icon-image'], 'poi-location-dot');
    assert.equal(label.layout['icon-optional'], false);
    assert.equal(label.layout['text-optional'], false);
    assert.deepEqual(label.layout['text-field'], [
        'coalesce',
        ['get', 'display_name'],
        ['get', 'name'],
        ['get', 'name:el'],
        ['get', 'name:en'],
        ['get', 'brand'],
        ['get', 'operator'],
        ''
    ]);
});


test('POI selection keeps the semantic hit area separate from selected layers', () => {
    const hitArea = poiSelectionLayers.find(layer => layer.id === 'poi-hit-area');
    const selectedLayers = poiSelectionLayers.filter(layer => layer.id.startsWith('selected-poi-'));

    assert.ok(hitArea);
    assert.equal(hitArea.type, 'circle');
    assert.equal(hitArea.filter, undefined);
    assert.ok(selectedLayers.length > 0);
    assert.ok(selectedLayers.every(layer => Array.isArray(layer.filter)));
});


test('selected bubble and icon geometry share one bounded progress curve', () => {
    const start = selectedPoiAnimationValues(0);
    const middle = selectedPoiAnimationValues(0.5);
    const end = selectedPoiAnimationValues(1);

    assert.equal(start.progress, 0);
    assert.equal(start.lift, 0);
    assert.equal(start.tailLength, 0);
    assert.equal(end.progress, 1);
    assert.equal(end.lift, 62);
    assert.equal(end.tailLength, 3);
    assert.ok(middle.progress > 0 && middle.progress < 1);
    assert.ok(middle.scale > start.scale && middle.scale < end.scale);
    assert.ok(middle.lift > start.lift && middle.lift < end.lift);
    assert.ok(middle.bubbleRadius === start.bubbleRadius && middle.bubbleRadius === end.bubbleRadius);
    assert.ok(middle.tailLength > start.tailLength && middle.tailLength < end.tailLength);
    assert.deepEqual(selectedPoiAnimationValues(-1), start);
    assert.deepEqual(selectedPoiAnimationValues(2), end);
});
