import {
    representation2D
} from './2d.mjs';

import {
    representation3DBuildings
} from './3d-buildings.mjs';

import {
    representationSatellite
} from './satellite.mjs';

import {
    representationAerial
} from './aerial.mjs';


export const representations = {
    '2d':
        representation2D,

    '3d-buildings':
        representation3DBuildings,

    'satellite':
        representationSatellite,

    'aerial':
        representationAerial
};


export function getRepresentation(
    representation = '2d'
) {
    const result =
        representations[representation];

    if (!result) {
        throw new Error(
            `Unknown map representation: ${representation}`
        );
    }

    return result;
}


export function getRepresentationIds() {
    return Object.keys(
        representations
    );
}