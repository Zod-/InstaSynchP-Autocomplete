// ==UserScript==
// @name        InstaSynchP Autocomplete
// @namespace   InstaSynchP
// @description Autocompletes emotes

// @version     1.0.2
// @author      Zod-
// @source      https://github.com/Zod-/InstaSynchP-Autocomplete
// @license     GPL-3.0

// @include     http://*.instasynch.com/*
// @include     http://instasynch.com/*
// @include     http://*.instasync.com/*
// @include     http://instasync.com/*
// @grant       none
// @run-at      document-start

// @require     https://greasyfork.org/scripts/5647-instasynchp-library/code/InstaSynchP%20Library.js
// ==/UserScript==

function Autocomplete(version) {
    "use strict";
    this.version = version;
    this.menuActive = false;
    this.enabled = true;
    this.sources = [];
    this.selects = [];
    this.settings = [{
        'label': 'Emotes',
        'id': 'autocomplete-emotes',
        'type': 'checkbox',
        'default': true,
        'section': ['Chat', 'Autocomplete']
    }, {
        'label': 'Sort results',
        'id': 'autocomplete-sort',
        'type': 'checkbox',
        'default': true,
        'section': ['Chat', 'Autocomplete']
    }, {
        'label': '# of results',
        'id': 'autocomplete-results',
        'type': 'int',
        'min': 0,
        'default': 7,
        'size': 1,
        'section': ['Chat', 'Autocomplete']
    }];
}

Autocomplete.prototype.resetVariables = function () {
    "use strict";
    this.menuActive = false;
    this.enabled = true;
};

Autocomplete.prototype.addSource = function (source, select) {
    "use strict";
    this.sources.push(source);
    this.selects.push(select);
};

Autocomplete.prototype.executeOnce = function () {
    "use strict";
    var th = this;
    events.on(th, 'InputKeydown[9]', function (event) {
        if (!th.menuActive) {
            return;
        }
        event.keyCode = $.ui.keyCode.ENTER;
        $(this).trigger(event);
    });

    th.addSource(function (term) {
            if (!gmc.get('autocomplete-emotes')) {
                return [];
            }
            var lastIndex = term.lastIndexOf('/'),
                partToComplete = term.substring(lastIndex, term.length).toLowerCase();
            return $.map(Object.keys(window.$codes), function (item) {
                item = '/' + item;
                if (item.toLowerCase().startsWith(partToComplete)) {
                    return item;
                }
            });
        },
        function (val, item) {
            if (window.$codes[item.substring(1, item.length)]) {
                return val.lastIndexOf(item) === 0;
            }
            return false;
        });
    events.on(th, 'InputKeydown', function (event) {
        if (event.keyCode !== 40 && event.keyCode !== 38) {
            th.enabled = true;
        }
    });
};

Autocomplete.prototype.preConnect = function () {
    "use strict";
    var th = this;
    //add the jquery autcomplete widget to InstaSynch's input field
    $("#cin").autocomplete({
        delay: 0,
        minLength: 0,
        source: function (request, response) {
            var result = [],
                i,
                words = request.term.split(' '),
                last = words[words.length - 1];
            //return if autocomplete has been turned off by other plugins
            if (!th.enabled || last.length === 0 || request.term.length !== $('#cin')[0].selectionStart) {
                response(result);
                return;
            }
            for (i = 0; i < th.sources.length; i += 1) {
                try {
                    result = result.concat(th.sources[i].apply(this, [last]));
                } catch (err) {
                    window.console.log(err);
                }
            }
            if (gmc.get('autocomplete-sort')) {
                result.sort();
            }

            response(result.slice(0, gmc.get('autocomplete-results')));
        },
        select: function (event, ui) {
            var val = this.value,
                uiVal = ui.item.value,
                i;
            this.value = val.substring(0, val.lastIndexOf(uiVal[0])) + uiVal;

            for (i = 0; i < th.selects.length; i += 1) {
                try {
                    //check if the item can be sent instantly
                    if (th.selects[i].apply(this, [this.value, uiVal])) {
                        $(this).trigger(
                            $.Event('keypress', {
                                which: 13,
                                keyCode: 13
                            })
                        );
                        break;
                    }
                } catch (err) {
                    window.console.log(err);
                }
            }
            return false;
        },
        autoFocus: true,
        focus: function () {
            return false;
        },
        close: function () {
            th.menuActive = false;
        },
        open: function () {
            th.menuActive = true;
        }
    }).on('paste', function () {
        th.enabled = false;
    });
};

window.plugins = window.plugins || {};
window.plugins.autocomplete = new Autocomplete("1.0.2");
