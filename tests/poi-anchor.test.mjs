import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createExpression, validateStyleMin} from '@maplibre/maplibre-gl-style-spec';
import {poiMarkerImageExpression, getPoiMarkerImage} from '../src/icons/poi-icons.mjs';
import {poiIconBySubtype} from '../src/icons/poi-icon-data.mjs';
import {createStyle} from '../src/style.mjs';
import {enableInteractions} from '../sdk/interactions/index.mjs';

test('every subtype resolves to an existing sprite, including university and unknown types', () => {
    const result = createExpression(poiMarkerImageExpression, 'layers[0].layout.icon-image');
    assert.equal(result.result, 'success');
    const atlas = JSON.parse(fs.readFileSync('public/sprites/map.json'));
    for (const subtype of [...Object.keys(poiIconBySubtype), 'unknown-type']) {
        const properties = {category: 'education', subtype};
        const image = result.value.evaluate({zoom: 13}, {properties});
        assert.equal(image, getPoiMarkerImage(properties));
        assert.ok(atlas[image], image);
    }
    assert.ok(atlas['poi-location-dot']);
});

test('all representations validate and place label dots under full markers', () => {
    for (const representation of ['2d', 'aerial', '3d-buildings']) {
        const style = createStyle(representation, {sprite: '/sprite/sprites'});
        assert.deepEqual(validateStyleMin(style).map(error => error.message), []);
        assert.ok(style.layers.findIndex(l => l.id === 'poi-labels-detail') < style.layers.findIndex(l => l.id === 'poi-markers-detail'));
        assert.equal(style.sources.places.promoteId, 'place_id');
        const university = style.layers.find(l => l.id === 'poi-markers-university');
        for (const zoom of [13,14,15,16,18,20,22]) {
            assert.ok(zoom >= university.minzoom && zoom < (university.maxzoom ?? Infinity));
        }
        assert.equal(university.layout['icon-allow-overlap'], false);
    }
});

test('visible labels take click precedence over underlying roads and show pointer cursor', () => {
    const handlers = {};
    const canvas = {style: {}};
    let queried;
    const map = {
        on: (event, callback) => { handlers[event] = callback; },
        getLayer: () => null,
        getSource: () => null,
        getStyle: () => ({layers: [{id: 'poi-labels-detail'}, {id: 'poi-markers-detail'}]}),
        getCanvas: () => canvas,
        queryRenderedFeatures: (point, options) => {
            queried = options.layers;
            return [{layer: {id: 'poi-labels-detail'}, properties: {place_id: 'stable-id'}}];
        }
    };
    enableInteractions(map);
    handlers.mousemove({point: {x: 0,y: 0}});
    assert.ok(queried.includes('poi-labels-detail'));
    assert.equal(canvas.style.cursor, 'pointer');
    // Exercise the click routing with an invalid geometry so floating selection exits safely.
    let selected;
    enableInteractions(map, {onSelect: feature => { selected = feature; }});
    handlers.click({point: {x: 0, y: 0}});
    assert.equal(selected.properties.place_id, 'stable-id');
});

test('selected POI exclusion uses persistent UUID across renderer IDs and restores filters', async () => {
    const {poiSelectionMatch} = await import('../sdk/selection/index.mjs');
    const {hideOriginalFeature, restoreHiddenLayers} = await import('../sdk/selection/floating-marker/layers.mjs');
    const feature = {id: 123, properties: {place_id: 'persistent-uuid'}};
    const match = poiSelectionMatch(feature);
    const evaluator = createExpression(match, 'layers[0].filter');
    assert.equal(evaluator.value.evaluate({zoom: 13}, {id: 456, properties: feature.properties}), true);
    assert.equal(evaluator.value.evaluate({zoom: 13}, {id: 123, properties: {place_id: 'another-uuid'}}), false);
    const layers = [{id: 'poi-labels-detail', filter: ['has', 'display_name']}, {id: 'poi-markers-detail'}];
    const filters = new Map();
    const map = {getStyle: () => ({layers}), getLayer: id => layers.find(l=>l.id===id), setFilter: (id, value) => filters.set(id,value)};
    const state = {hiddenFilters: new Map()};
    hideOriginalFeature(map, state, layers.map(l=>l.id), match);
    assert.deepEqual(filters.get('poi-markers-detail'), ['!', match]);
    restoreHiddenLayers(map,state);
    assert.equal(filters.get('poi-markers-detail'), null);
    assert.deepEqual(filters.get('poi-labels-detail'), ['has', 'display_name']);
});

test('bus symbols and anchors select transit stops directly from zoom 13', () => {
    for (const layerId of ['transit-stop-anchors', 'transit-bus-stops', 'transit-bus-stop-labels']) {
        const handlers = {};
        let selected;
        const feature = {id: 42, layer: {id: layerId}, properties: {display_name: 'Bus stop'}};
        const map = {
            on: (event, callback) => { handlers[event] = callback; },
            getLayer: () => null, getSource: () => null,
            getStyle: () => ({layers: [{id:layerId}]}),
            queryRenderedFeatures: (point, {layers}) => {assert.ok(layers.includes(layerId)); return [feature];}
        };
        enableInteractions(map,{onSelect: value => {selected=value;}});
        handlers.click({point:{x:0,y:0}});
        assert.equal(selected,feature);
    }
});
