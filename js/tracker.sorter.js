// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const sorter = {
    prevBoxes: {}, // TODO: remove if only one with same idx, timer do boxów i usuwanie po czasie
    mapping: {},
    prevMapping: {},
    maxId: 0,
    boxMaxAge: 5,

    /*
        Append previous bound
     */
    addPrevBox: function (idx) {
        let id = sorter.maxId + 1;
        // if ID is already in boxes, but this ID was not in prev box then create new
        while (typeof sorter.prevBoxes[id] !== 'undefined') {
            id++;
        }
        if (tracker.objects[idx]['box']['xMin'] != null && tracker.objects[idx]['box']['width'] != 0) {
            sorter.prevBoxes[id] = {
                box: tracker.objects[idx]['box'],
                dt: new Date(),
                c: 0
            };
            sorter.mapBox(id, idx);
            sorter.maxId = id;
        }
    },

    /*
        Map bound to ID
     */
    mapBox: function (id, idx) {
        sorter.mapping[id] = idx;
        if (id > sorter.maxId) {
            sorter.maxId = id;
        }
    },

    /*
        Find closest bound
     */
    getClosestBound: function (idx) {
        id = null;

        // id in index
        scores = keypoints.getBoundingScoresDict(tracker.objects[idx]['center'], sorter.prevBoxes);
        if (scores.length > 0) {
            id = Object.keys(scores).reduce(function (a, b) {
                return scores[a] < scores[b] ? a : b
            });
        }
        if (id != null && id < 0) {
            id = null;
        }
        return id;
    },

    /*
        Apply by bound
     */
    byPrevBox: function (idx) {
        tmpId = sorter.getClosestBound(idx);

        // if not found in any box then create new box and create new ID
        if (tmpId == null) {
            sorter.addPrevBox(idx);
            return;
        }

        // if this ID matched with prev box with same ID then update box with current position
        if (tracker.objects[idx]['box']['xMin'] != null && tracker.objects[idx]['box']['width'] != 0) {
            c = sorter.prevBoxes[tmpId]['c'] + 1;
            sorter.prevBoxes[tmpId] = {
                box: tracker.objects[idx]['box'],
                dt: new Date(),
                c: c
            };
            sorter.mapBox(tmpId, idx);
        }
    },

    /*
        Sort objects and apply IDs by bounds
     */
    sortByBounds: function () {
        for (let idx of tracker.objects.keys()) {
            if (typeof tracker.objects[idx].center === 'undefined' || typeof tracker.objects[idx].box === 'undefined') {
                continue;
            }
            if (tracker.objects[idx].score < 0.2) {
                continue;
            }
            sorter.byPrevBox(idx);
        }
    },

    /*
        Sort by X position
     */
    sortByX: function () {
        function compare(a, b) {
            if (a['center']['x'] < b['center']['x']) {
                return -1;
            }
            if (a['center']['x'] > b['center']['x']) {
                return 1;
            }
            return 0;
        }

        tracker.objects.sort(compare);
    },

    clearExpired: function () {
        for (id in sorter.prevBoxes) {
            r = ((new Date()).getTime() - sorter.prevBoxes[id]['dt'].getTime()) / 1000;
            if (r > sorter.boxMaxAge) {
                delete sorter.prevBoxes[id];
            }
        }
    },

    clear: function () {
        sorter.clearExpired();
    },

    /*
        Clear unused objects
     */
    clean: function () {
        for (let idx of tracker.objects.keys()) {
            let id = tracker.objects[idx]['id'];

            // if was previously matched
            if (typeof sorter.prevMapping[id] !== 'undefined') {

                // if prev mapping idx == current idx
                if (sorter.prevMapping[id] == idx) {

                    // remove not matched for current
                    for (let mapId in sorter.mapping) {

                        // get old idx
                        oldIdx = sorter.mapping[mapId];

                        // if old idx not this idx then continue
                        if (oldIdx != idx) {
                            continue;
                        }

                        // if this is current idx:
                        // if is current idx but is not matched to this ID then delete
                        if (mapId != id) {
                            delete sorter.mapping[mapId];
                        }
                    }
                }
            }
        }
    },

    /*
        Append sorting and ID mapping
     */
    append: function () {
        sorter.maxId = 0;
        sorter.sortByX();

        // append sorted initial ID's
        for (let idx of tracker.objects.keys()) {
            tracker.objects[idx]['id'] = idx;
        }

        sorter.sortByBounds();

        // append mapped Ids, last best matched will be applied
        let i;
        for (let id in sorter.mapping) {
            idx = sorter.mapping[id];
            if (typeof tracker.objects[idx] !== 'undefined') {
                tracker.objects[idx]['id'] = id;
            }
        }

        // store previous
        sorter.prevMapping = sorter.mapping;

        sorter.clear();

        if (sorter.maxId > 100 || Object.keys(sorter.prevBoxes).length > 100) {
            sorter.maxId = 0;
            sorter.prevBoxes = {};
            sorter.mapping = {};
            sorter.prevMapping = {};
        }
    },
}