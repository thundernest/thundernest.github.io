/**
 * This script is heavily based on the work of Christopher Leidigh:
 * https://github.com/cleidigh/ThunderKdB/blob/master/scripts/genExtensionList.js
 */

// Debug logging (0 - errors and basic logs only, 1 - verbose debug)
const debugLevel = 0;

const fs = require('fs-extra');

// replacement for deprecated request
const bent = require('bent');
const bentGetTEXT = bent('GET', 'string', 200);

const rootDir = "data";
const reportDir = "../add-on-reports";
const extsAllJsonFileName = `${rootDir}/xall.json`;

const badge_definitions = {
    "permission": { bLeftText: 'p', bColor: 'orange', bTooltip: "Requested permission" },
    "alternative_available": { bRightText: 'alternative available', bLeftText: '*', bColor: 'darkgreen' },
    "wip102": { bRightText: 'work in progress', bLeftText: 'TB102', bColor: 'yellow' },
    "incompatible91": { bRightText: 'incompatible', bLeftText: 'TB91', bColor: 'c90016' },
    "incompatible102": { bRightText: 'incompatible', bLeftText: 'TB102', bColor: 'c90016' },
    "compatible102": { bRightText: 'compatible', bLeftText: 'TB102', bColor: 'darkgreen' },
    "unknown": { bRightText: 'unknown', bLeftText: 'TB102', bColor: 'c90016' },
    "discontinued": { bRightText: 'discontinued', bLeftText: 'TB102', bColor: 'D3D3D3' },
    "contacted": { bRightText: 'waiting for feedback', bLeftText: 'TB102', bColor: 'ff8800' },
    "probably_compatible": { bRightText: 'probably compatible', bLeftText: 'TB102', bColor: 'darkgreen' },
    "pure": { bRightText: 'pure WebExtension', bLeftText: 'TB102', bColor: '570861' },

}

const discontinued = [
    "219725", //addon/autoslide/
    "986572", //addon/flat-folder-tree-updated/ - broken, core does not seem to support add-on modes anymore -> API
    "987978", //addon/monterail-darkness-extended/ - uses old WL and bad colors in TB91 already
    "987660", //addon/taskviewflexlayout/
    "988119", //addon/hera-test-demo/ - Demo - will not be updated
]

const wip102 = [
    "986338", //addon/eas-4-tbsync
    "986258", //addon/dav-4-tbsync
    "773590", //addon/tbsync/
    "472193", //addon/categorymanager/
    "988091", //addon/expression-search-ng/
    "1898",   //addon/folderflags/ - has Quota and Flags tab swapped - PR https://github.com/voccs/folderflags/pull/10
    "988293", //addon/joplin-export/
]

const contacted = [
    "852623", //addon/remote-content-by-folder/ - https://github.com/jikamens/remote-content-by-folder/issues/3
    "988146", //addon/smartcompose/ - needs to replace spellcheck APIs
    "988185", //addon/bookmark-mails-and-more/ - OpenMessageInNewTab
    "986323", //addon/confirmbeforedelete/ - cannot overlay new address book, but does not seem needed anymore
    "987689", //addon/changequote/ - https://github.com/caligraf/ChangeQuote/pull/33/files
]

// Works after lifting strict_max_version
const probably_compatible = [
    "605874", //addon/replywithheader/
    "988169", //addon/wikipediasearchwebapp/
    "988170", //addon/skypewebapp/
    "988168", //addon/onedrivewebapp/
    "988123", //addon/hera-hotel-reservation/
    "988166", //addon/googlesearchwebapp/
    "988171", //addon/msofficewebapp/
    "988167", //addon/todowebapp/
    "987916", //addon/telegramwebapp/
    "988060", //addon/text-insert-text-blocks/
    "988255", //addon/topic-tree-notebook/
    "988214", //addon/filter-email-folders/
    "988190", //addon/old-icons/ - only has to exclude addressbook.xhtml from overlay
    "988001", //addon/attachment-image-viewer/
    "327780", //addon/auto-select-latest-message/
    "356507", //addon/header-tools-lite/
    //102.0
    "988096", //addon/attachment-extractor/
    "711456", //addon/textra-thunderbird/
    "988173", //addon/thunderkey/
    "988196", //addon/message-filters-button-u/
]

const knownWorking102 = [
    "987839", //addon/findnow/ - move init code into startup code
    "10052",  //addon/filtaquilla/
    "988234", //addon/tbhints/
    "4454",   //addon/priority-switcher/
    "49594",  //addon/subswitch/
    "161820", //addon/alertswitch/
    "708783", //addon/emojiaddin/ - PR https://github.com/mganss/EmojiAddIn/pull/53
    "116388", //addon/automatic-dictionary-switching/ - content_frame id and multiple spell - https://github.com/beltrachi/automatic_dictionary/issues/56#issuecomment-1162817647
    "1203",   //addon/correct-identity/
    "988115", //addon/clippings-tb/ - content-frame
    "310",    //addon/bidi-mail-ui/ - https://github.com/eyalroz/bidimailui/pull/58/files
    "2610",   //addon/mailbox-alert/ - onItemAdded - onMessageadded and does not remove folderListener
    "988228", //addon/cb_thunderlink/ - can be turned into a pure WebExt - unavailable for a few weeks
    "161710", //addon/more-snooze/
    "287743", //addon/mailhops/
    "987740", //addon/nostalgy_ng/ - https://github.com/opto/nostalgy-xpi/issues/174#issuecomment-1165895633
    "987888", //addon/msghdr-toolbar-customize/ - lots of changes in the header area
    "986643", //addon/filelink-provider-for-webdav/
    "986686", //addon/importexporttools-ng/
    "372603", //addon/enhanced-priority-display/
    "987749", //addon/marked-lightning/
    "988303", //addon/tud-cert-phishing-report/ - getURLSpecFromFile 
    "1392",   //addon/maximize-message-pane/
    "811161", //addon/warnattachment/
    "2299",   //addon/threadkey/ - replace getElementsByClassName("tabmail-tab") by win.document.getElementById("tabmail").currentTabInfo
    "986523", //addon/hide-email-folders/ - could fix a bug for feeds and news
    "46207",  //addon/mailmindr/
    "64758",  //addon/xnotepp/ - PR https://github.com/xnotepp/xnote/pull/95
    "988188", //addon/morelayouts/
    "324497", //addon/smarttemplate4/
    "559954", //addon/tidybird/ - folderUtils.jsm
    "987906", //addon/full-address-column/
    "987840", //addon/printingtools-ng/
    "217293", //addon/signal-spam/
    "986685", //addon/phoenity-icons/
    "4654",   //addon/removedupes
    "386321", //addon/Lightning calendar tabs
    "4970",   //addon/tag-toolbar/
    "56935",  //addon/identity-chooser/
    "12018",  //addon/quick-folder-move
    "742199", //addon/attach-from-clipboard/
    "987908", //addon/deepl-selected-text/
    "987727", //addon/monterail-full-dark-2/
    "987995", //addon/hide-local-folders-for-tb78/
    "2874",   //addon/folder-account/
    "11727",  //addon/refwdformatter/
    "987726", //addon/monterail-dark-2-0-for-tb-68/
    "640",    //addon/quicktext
    "331666", //addon/quickarchiver/
    "360086", //addon/toggle-headers/
    "987914", //addon/filter-on-folder-button/
    "987865", //addon/previous-colors/
    "10149",  //addon/new-tab-button/
    "988056", //addon/get-all-mail-button-for-tb78/
    "988098", //addon/thunderbird-todoist/
    "988057", //addon/keeprunning/
    "987925", //addon/eml-editor/
    "987838", //addon/sender-domain/
    "986610", //addon/userchromejs-2/
    "987901", //addon/transfer-immunity/
    "12802",  //addon/phoenity-buttons/
    "987911", //addon/spam-scores/
    "987757", //addon/taskviewstyles
    "987868", //addon/next-unread-group/
    "987863", //addon/eventview/
    "987869", //addon/next-unread-thread/
    "988106", //addon/toggle-address-box/ - Fixed probably soon
    "987988", //addon/toggle-inline/
    "987986", //addon/select-prev-on-delete/
    "987665", //addon/lefttodaysubpaneorlogoorclock/
    "987945", //addon/treechildrenheight50/
    "987989", //addon/toggle-summary/
    "988086", //addon/confirmconversionsatselecting/
    "1279",   //addon/xpunge/
    "987821", //openattachmentbyextension/
    "986522", //addon/popmaillistrecipients-2/
    "546538", //addon/single-domain/
    "987860", //addon/empty-folder/
    "987892", //addon/quotecolors/
    "330066", //addon/edit-email-subject/

    "704523", //addon/europeanmx/
    "988024", //addon/open-in-browser
    "988038", //addon/archive-old-messages/

    "1556",   //addon/allow-html-temp/
    "902",    //addon/getsendbutton/
    "987885", //addon/tbkeys-lite/
    "986692", //addon/profile-switcher/
    "987775", //addon/search-button/
    "987764", //addon/header-tools-improved/

    "988138", //addon/grammar-and-spell-checker/
    "987934", //addon/simple-mail-redirection/
    "11646",  //addon/no-message-pane-sort-by-mouse/
    "2561",   //addon/copy-sent-to-current/
    "987779", //addon/browseintab/
    "3492",   //addon/show-inout/
    "987933", //addon/toggle-line-wrap/
    "987796", //addon/messagepreview/
    "987979", //addon/attachmentcount/
    "988195", //addon/filter-manager/
    "987902", //addon/deselect-on-delete-tb78/
    "987987", //addon/toggle-html/
    "987857", //addon/preferences-button/
    "987786", //addon/devtools-button/
    "534258", //addon/received/
    "987664", //addon/copy-patch/
    "987976", //addon/findtasksbutton/
    "988260", //addon/x-original-to-column/
    "987844", //addon/insertsignature/
    "2533",   //addon/addressbooks-synchronizer/
    "676875", //addon/rspamd-spamness/
    "47144",  //addon/mail-merge/
    "988108", //addon/openpgp-alias-updater/
    "988289", //addon/keepassxc-mail/
    "988281", //addon/regimail/
];

const knownBroken102 = [
 "988198", //addon/dontrestoretabsrevival/
 "508826", //addon/eds-calendar-integration/
];

var gAlternativeData;

var groups = [
    {
        id: "atn-errors",
        header: "Extensions with invalid ATN settings"
    },
    {
        id: "all",
        header: "General reports"
    },
    {
        id: "102",
        header: "Thunderbird 102 reports"
    },
    {
        id: "91",
        header: "Thunderbird 91 reports"
    },
    {
        id: "78",
        header: "Thunderbird 78 reports"
    },
    {
        id: "68",
        header: "Thunderbird 68 reports"
    },

]
var reports = {
    "all": {
        group: "all",
        header: "All Extensions compatible with TB60 or newer.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vHighest = getExtData(extJson, "102").version ||
                getExtData(extJson, "91").version ||
                getExtData(extJson, "78").version ||
                getExtData(extJson, "68").version ||
                getExtData(extJson, "60").version;

            return { include: !!vHighest };
        },
    },
    "purge-candidates": {
        group: "all",
        header: "All Extensions not compatible with TB68, which should be purged from ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v68 = getExtData(extJson, "68").version;
            let v78 = getExtData(extJson, "78").version;
            let v91 = getExtData(extJson, "91").version;
            let v102 = getExtData(extJson, "102").version;
            return { include: !v68 && !v78 && !v91 && !v102 };
        },
    },
    "parsing-error": {
        group: "all",
        header: "Extensions whose XPI files could not be parsed properly and are excluded from analysis.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            return { include: !current_version };
        }
    },
    "recent-activity": {
        group: "all",
        header: "Extensions updated within the last 2 weeks.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let current_version = getExtData(extJson, "current").data;
            if (current_version) {
                let c = current_version.atn.files[0].created;
                let cv = new Date(c);
                let today = new Date();
                const msDay = 24 * 60 * 60 * 1000;
                let d = (today - cv) / msDay;
                return { include: (d <= 14) };
            }
            return { include: false };
        }
    },
    "max-atn-value-raised-above-max-xpi-value": {
        group: "all",
        header: "Extensions whose max version has been raised in ATN above the XPI value (excluding legacy extensions).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) < 0);
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            }

            return { include, badges };
        }
    },
    "requested-permissions": {
        group: "all",
        header: "Extensions requesting WebExtension permissions.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "current").data;
            let badges = [];

            let permissions = data?.manifest?.permissions;
            if (Array.isArray(permissions)) {
                for (let permission of permissions) {
                    // We do not see each individual contentScript definition
                    if (permission.includes(":/") || permission == "<all_urls>") {
                        if (badges.filter(e => e.badge == "permission.contentScript").length == 0) {
                            badges.push({ badge: `permission.contentScript` });
                        }
                    } else {
                        badges.push({ badge: `permission.${permission}` });
                    }
                }
            }

            let manifest = data?.manifest;
            const keys = ["compose_action", "browser_action", "message_display_action", "cloud_file", "commands"];
            if (manifest) {
                for (let key of keys)
                    if (manifest[key])
                        badges.push({ badge: `permission.${key}` });
            }

            return {
                include: !!permissions,
                badges
            };
        },
    },
    // -- ATN error reports ------------------------------------------------------------------------
    "wrong-order": {
        group: "atn-errors",
        header: "Extension with wrong upper limit setting in older versions, which will lead to the wrong version reported compatible by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;

            if (v60 && v68 && compareVer(v60, v68) > 0) return { include: true };
            if (v60 && v78 && compareVer(v60, v78) > 0) return { include: true };
            if (v60 && v91 && compareVer(v60, v91) > 0) return { include: true };
            if (v60 && v102 && compareVer(v60, v102) > 0) return { include: true };

            if (v68 && v78 && compareVer(v68, v78) > 0) return { include: true };
            if (v68 && v91 && compareVer(v68, v91) > 0) return { include: true };
            if (v68 && v102 && compareVer(v68, v102) > 0) return { include: true };

            if (v78 && v91 && compareVer(v78, v91) > 0) return { include: true };
            if (v78 && v102 && compareVer(v78, v102) > 0) return { include: true };

            if (v91 && v102 && compareVer(v91, v102) > 0) return { include: true };

            return { include: false };
        },
    },
    "experiments-without-upper-limit": {
        group: "atn-errors",
        header: "Experiments without upper limit in ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let atn_min = vCurrent?.atn?.compatibility?.thunderbird?.min || "*";
            let include = !!vCurrent && vCurrent.mext && vCurrent.experiment && atn_max == "*";
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            }

            return { include, badges };
        }
    },
    "max-atn-value-reduced-below-max-xpi-value": {
        group: "atn-errors",
        header: "Extensions whose max version has been reduced in ATN below the XPI value, which is ignored during install and app upgrade (excluding legacy).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include = vCurrent.mext && !vCurrent.legacy && (compareVer(strict_max, atn_max) > 0);
            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            }

            return { include, badges };
        }
    },
    "latest-current-mismatch": {
        group: "atn-errors",
        header: "Extensions, where the latest upload is for an older release, which will fail to install in current ESR (current = defined current in ATN) from within the add-on manager.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vHighest = getExtData(extJson, "102").version ||
                getExtData(extJson, "91").version ||
                getExtData(extJson, "78").version ||
                getExtData(extJson, "68").version ||
                getExtData(extJson, "60").version;

            let vCurrent = getExtData(extJson, "current").version;
            return { include: !reports["wrong-order"].rowData(extJson).include && !!vHighest && vHighest != vCurrent };
        },
    },
    "false-positives-tb68": {
        group: "atn-errors",
        header: "Extensions claiming to be compatible with Thunderbird 68, but are legacy extensions and therefore unsupported.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "68").data;
            return { include: !!data && data.legacy && !data.mext };
        }
    },
    "false-positives-tb78": {
        group: "atn-errors",
        header: "Extensions claiming to be compatible with Thunderbird 78, but are legacy extensions or legacy WebExtensions and therefore unsupported.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let data = getExtData(extJson, "78").data;
            return { include: !!data && data.legacy };
        }
    },
    // -- v102 -------------------------------------------------------------------------------------
    "atn-tb102": {
        group: "102",
        header: "Extensions compatible with Thunderbird 102 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max;

            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            } else if (!!vCurrent && vCurrent.mext && !vCurrent.experiment) {
                badges.push({ badge: "pure" });
            } else if (atn_max && (
                atn_max == "102.*" ||
                parseInt(atn_max.split(".")[0], 10) > 102
            )) {
                badges.push({ badge: "compatible102" });
            }

            return {
                include: !!(getExtData(extJson, "102").version),
                badges
            };
        }
    },
    "valid-according-to-strict-max-but-atn-value-reduced": {
        group: "102",
        header: "Extensions whose strict_max_version allows installation in Thunderbird 102, but ATN value has been lowered (which is ignored during install and app upgrade).",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let vCurrent = getExtData(extJson, "current").data;
            if (!vCurrent)
                return { include: false };

            let atn_max = vCurrent?.atn?.compatibility?.thunderbird?.max || "*";
            let strict_max = vCurrent.manifest?.applications?.gecko?.strict_max_version ||
                vCurrent.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
                "*";

            let include =
                vCurrent.mext && // WebExtension
                !vCurrent.legacy && // Not legacy
                compareVer(strict_max, 102) > 0 && // strict max not below 102/* (add-ons with max xpi 97 do not install)
                compareVer(strict_max, atn_max) > 0 && // atn lower than xpi (which is ignored)
                compareVer(atn_max, 91) >= 0 && // atn limit > 91 (if it is lowered below 91, it is already lost from 78 to 91)
                compareVer(atn_max, "102.*") < 0; // atn limit < 102.*

            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            } 

            return { include, badges };
        }
    },
    "tb102-experiments-with-102-0-limit": {
        group: "102",
        header: "Experiments who have an upper limit of 102.0.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").data;
            let atn_max = v102?.atn?.compatibility?.thunderbird?.max || "*";

            let include = atn_max == "102.0";

            let badges = [];
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            }

            return { include, badges };
        }
    },
    "lost-tb91-to-tb102": {
        group: "102",
        header: "Extensions which have been lost from TB91 to TB102 as seen by ATN",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").version;
            let v91 = getExtData(extJson, "91").version;
            let include = !!v91 && !v102;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                }
                if (knownBroken102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "incompatible102" });
                } else if (knownWorking102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "compatible102" });
                } else if (wip102.includes(`${extJson.id}`)) {
                    badges.push({ badge: "wip102" });
                } else if (discontinued.includes(`${extJson.id}`)) {
                    badges.push({ badge: "discontinued" });
                } else if (contacted.includes(`${extJson.id}`)) {
                    badges.push({ badge: "contacted" });
                } else if (probably_compatible.includes(`${extJson.id}`)) {
                    badges.push({ badge: "probably_compatible" });
                }
            }
            return { include, badges };
        }
    },
    "tb102-incompatible": {
        group: "102",
        header: "Add-ons incompatible with Thunderbird 102: A worst case scenario",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v102 = getExtData(extJson, "102").data;
            let v91 = getExtData(extJson, "91").data;
            let atn_max = v102?.atn?.compatibility?.thunderbird?.max || "0";
            
            let include = atn_max != "102.*" && parseInt(atn_max.split(".")[0], 10) > 102 == false &&  !knownWorking102.includes(`${extJson.id}`) && (
                (!!v91 && !v102) ||
                knownBroken102.includes(`${extJson.id}`) ||
                wip102.includes(`${extJson.id}`) ||
                contacted.includes(`${extJson.id}`) ||
                probably_compatible.includes(`${extJson.id}`)
            );

            let badges = [];
            if (getAlternative(extJson)) {
                badges.push({ badge: "alternative_available" });
            }
            if (knownBroken102.includes(`${extJson.id}`)) {
                badges.push({ badge: "incompatible102" });
            } else if (knownWorking102.includes(`${extJson.id}`)) {
                badges.push({ badge: "compatible102" });
            } else if (wip102.includes(`${extJson.id}`)) {
                badges.push({ badge: "wip102" });
            } else if (discontinued.includes(`${extJson.id}`)) {
                badges.push({ badge: "discontinued" });
            } else if (contacted.includes(`${extJson.id}`)) {
                badges.push({ badge: "contacted" });
            } else if (probably_compatible.includes(`${extJson.id}`)) {
                badges.push({ badge: "probably_compatible" });
            } else {
                badges.push({ badge: "unknown" });
            }

            return { include, badges };
        }
    },
    // -- v91 --------------------------------------------------------------------------------------
    "atn-tb91": {
        group: "91",
        header: "Extensions compatible with Thunderbird 91 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let badges = [];

            return {
                include: !!(getExtData(extJson, "91").version),
                badges
            };
        }
    },
    "lost-tb78-to-tb91": {
        group: "91",
        header: "Extensions which have been lost from TB78 to TB91, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v91 = getExtData(extJson, "91").version;
            let v78 = getExtData(extJson, "78").version;
            let include = !!v78 && !v91;

            let badges = [];
            if (include) {
                if (getAlternative(extJson)) {
                    badges.push({ badge: "alternative_available" });
                } else {
                    badges.push({ badge: "incompatible91" });
                }
            }
            return { include, badges };
        }
    },
    // -- v78 --------------------------------------------------------------------------------------
    "atn-tb78": {
        group: "78",
        header: "Extensions compatible with Thunderbird 78 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            return { include: !!(getExtData(extJson, "78").version) };
        }
    },
    "lost-tb68-to-tb78": {
        group: "78",
        header: "Extensions which have been lost from TB68 to TB78, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v78 = getExtData(extJson, "78").version;
            let v68 = getExtData(extJson, "68").version;
            return { include: !!v68 && !v78 };
        }
    },
    // -- 68 ------------------------------------------------------------------- -------------------
    "atn-tb68": {
        group: "68",
        header: "Extensions compatible with Thunderbird 68 as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            return { include: !!(getExtData(extJson, "68").version) };
        }
    },
    "lost-tb60-to-tb68": {
        group: "68",
        header: "Extensions which have been lost from TB60 to TB68, as seen by ATN.",
        template: "report-template.html",
        enabled: true,
        generate: genStandardReport,
        rowData: function (extJson) {
            let v68 = getExtData(extJson, "68").version;
            let v60 = getExtData(extJson, "60").version;
            return { include: !!v60 && !v68 };
        }
    },
}

// -----------------------------------------------------------------------------

function genStandardReport(extsJson, name, report) {
    let extsListFile = fs.readFileSync(report.template, 'utf8');
    let rows = [];
    let stats = [];

    function genStandardRow(extJson, rowData) {
        let default_locale = extJson.default_locale;
        if (default_locale === undefined) {
            if (typeof extJson.name["en-US"] === 'string') {
                default_locale = "en-US";
            } else {
                let locales = Object.keys(extJson.name);
                default_locale = extJson.name[locales[0]];
            }
        } else {
            if (typeof extJson.name["en-US"] !== 'string') {
                let locales = Object.keys(extJson.name);
                default_locale = locales[0];
            }
        }

        const idSlug = `${extJson.id}-${extJson.slug}`;
        const name_link = `<a id="${idSlug}" href="${extJson.url}">${extJson.name[default_locale].substr(0, 38)}</a>`;

        let rank = extJson.xpilib.rank;
        let current_version = getExtData(extJson, "current").data;
        let v_min = current_version?.atn.compatibility.thunderbird.min || "*";
        let v_max = current_version?.atn.compatibility.thunderbird.max || "*";
        let v_strict_max = current_version?.manifest?.applications?.gecko?.strict_max_version ||
            current_version?.manifest?.browser_specific_settings?.gecko?.strict_max_version ||
            "*";

        // Helper function to return the version cell for a given ESR
        const cv = (esr) => {
            let rv = [];
            let { version, data } = getExtData(extJson, esr);

            if (version) {
                rv.push(version);
            }

            if (data) {
                let cBadge_type_setup = { bLeftText: 'T', bRightText: 'MX', bColor: 'purple', bTooltip: "Extension Type:" };
                let cBadge_legacy_setup = { bLeftText: 'L', bRightText: '+', bColor: 'green', bTooltip: "Legacy Type:" };
                let cBadge_experiment_setup = { bLeftText: 'E', bRightText: '+', bColor: 'blue', bTooltip: "Experiment APIs: " };

                if (data.mext == true && data.legacy == false) {
                    cBadge_type_setup.bRightText = "MX"
                    cBadge_type_setup.bTooltip += "&#10; - MX : MailExtension (manifest.json)";
                } else if (data.mext == true && data.legacy == true) {
                    cBadge_type_setup.bRightText = "WE"
                    cBadge_type_setup.bTooltip += "&#10; - WE : Legacy WebExtension (manifest.json)";
                } else {
                    cBadge_type_setup.bRightText = "RDF";
                    cBadge_type_setup.bTooltip += "&#10; - RDF : Legacy Extension (install.rdf)";
                }
                rv.push(makeBadgeElement(cBadge_type_setup));

                if (data.legacy == true) {
                    if (data.legacy_type == 'xul') {
                        cBadge_legacy_setup.bRightText = "XUL"
                        cBadge_legacy_setup.bTooltip += "&#10; - XUL : XUL overlay (requires restart)";
                    } else {
                        cBadge_legacy_setup.bRightText = "BS"
                        cBadge_legacy_setup.bTooltip += "&#10; - RS : Bootstrap";
                    }
                    rv.push(makeBadgeElement(cBadge_legacy_setup));
                }

                if (data.experiment) {
                    if (data.experimentSchemaNames.includes("WindowListener")) {
                        cBadge_experiment_setup.bRightText = "WL"
                    } else if (data.experimentSchemaNames.includes("BootstrapLoader")) {
                        cBadge_experiment_setup.bRightText = "BL"
                    }

                    let schema = data.experimentSchemaNames;
                    if (schema) {
                        let max = Math.min(schema.length, 14);
                        for (let index = 0; index < max; index++) {
                            cBadge_experiment_setup.bTooltip += `&#10; - ${schema[index]}`;
                        };

                        if (data.experimentSchemaNames.length > 15) {
                            cBadge_experiment_setup.bTooltip += "&#10; ...";
                        }
                    }
                    rv.push(makeBadgeElement(cBadge_experiment_setup));
                }
            }

            return rv.join("<br>");
        }

        return `
		<tr>
		  <td style="text-align: right" valign="top">${rank}</td>
		  <td style="text-align: right" valign="top">${extJson.id}</td>
		  <td style="text-align: left"  valign="top">${name_link}${getAlternative(extJson) ? getAlternative(extJson).join("") : ""}</td>
		  <td style="text-align: right" valign="top">${extJson.average_daily_users}</td>
		  <td style="text-align: right" valign="top">${cv("60")}</td>
		  <td style="text-align: right" valign="top">${cv("68")}</td>
		  <td style="text-align: right" valign="top">${cv("78")}</td>
		  <td style="text-align: right" valign="top">${cv("91")}</td>
		  <td style="text-align: right" valign="top">${cv("102")}</td>
		  <td style="text-align: right" valign="top">${current_version?.atn.files[0].created.split('T')[0]}</td>
		  <td style="text-align: right" valign="top">${cv("current")}</td>
		  <td style="text-align: right" valign="top">${v_min}</td>
		  <td style="text-align: right" valign="top">${v_strict_max}</td>
		  <td style="text-align: right" valign="top">${v_max}</td>
		  <td style="text-align: right; font-style: italic" valign="top">${rowData.badges ? rowData.badges.map(e => getBadgeElement(e.badge, e.link)).join("<br>") : ""}</td>
		</tr>`;
    }

    extsJson.map((extJson, index) => {
        debug('Extension ' + extJson.id + ' Index: ' + index);

        if (extJson === null) {
            return "";
        }

        if (extJson.xpilib === undefined) {
            console.error('Error, xpilib data missing: ' + extJson.slug);
            extJson.xpilib = {};
        }
        extJson.xpilib.rank = index + 1;

        let rowData = report.rowData(extJson);
        if (rowData.include) {
            rows.push(genStandardRow(extJson, rowData));
            if (rowData.badges) stats.push(...rowData.badges);
        } else {
            debug('Skip ' + extJson.slug);
        }
    })

    // Calculate stats
    let stats_counts = {};
    for (let i = 0; i < stats.length; i++) {
        stats_counts[stats[i].badge] = 1 + (stats_counts[stats[i].badge] || 0);
    };

    function sortStats(a, b) {
        if (a[1] > b[1]) return -1;
        if (a[1] < b[1]) return 1;
        return 0;
    }

    // Generate stats
    let stats_entries = [];
    for (let [name, count] of Object.entries(stats_counts).sort(sortStats)) {
        stats_entries.push(`<tr><td style="text-align: right">${count}</td><td>${getBadgeElement(name)}</td></tr>`)
    }
    if (stats_entries.length > 0) {
        stats_entries.unshift("<h3>Statistics</h3>", "<table class='statstable'>");
        stats_entries.push("</table>");
    }


    extsListFile = extsListFile.replace('__header__', report.header);
    extsListFile = extsListFile.replace('__description__', report.description);

    extsListFile = extsListFile.replace('__count__', rows.length);
    let today = new Date().toISOString().split('T')[0];
    extsListFile = extsListFile.replace('__date__', today);
    extsListFile = extsListFile.replace('__table__', rows.join("\n"));

    extsListFile = extsListFile.replace('__stats__', stats_entries.join("\n"));

    fs.ensureDirSync(`${reportDir}`);
    fs.writeFileSync(`${reportDir}/${name}.html`, extsListFile);

    debug('Done');
    return rows.length;
}

// -----------------------------------------------------------------------------

function debug(...args) {
    if (debugLevel > 0) {
        console.debug(...args);
    }
}

function getBadgeElement(badgeName, bLink) {
    // manipulate bRightText to reuse base bage
    let badgeParts = badgeName.split(".");
    let badgeOpt = badge_definitions[badgeName];
    if (!badgeOpt && Array.isArray(badgeParts) && badge_definitions[badgeParts[0]]) {
        badgeOpt = badge_definitions[badgeParts[0]];
        badgeOpt.bRightText = badgeParts.slice(1).join(".");
    }
    return makeBadgeElement(badgeOpt, bLink);
}

function makeBadgeElement(bOpt, bLink) {
    let title = bOpt.bTooltip ? `title='${bOpt.bTooltip}'` : ``;

    let tag = `<img src='https://img.shields.io/badge/${bOpt.bLeftText}-${bOpt.bRightText}-${bOpt.bColor}.png' ${title}>`
    return bLink ? `<a href="${bLink}">${tag}</a>` : tag;
}

// A versioncompare, taken from https://jsfiddle.net/vanowm/p7uvtbor/
function compareVer(a, b) {
    function prep(t) {
        return ("" + t)
            //treat non-numerical characters as lower version
            //replacing them with a negative number based on charcode of first character
            .replace(/[^0-9\.]+/g, function (c) { return "." + ((c = c.replace(/[\W_]+/, "")) ? c.toLowerCase().charCodeAt(0) - 65536 : "") + "." })
            //remove trailing "." and "0" if followed by non-numerical characters (1.0.0b);
            .replace(/(?:\.0+)*(\.-[0-9]+)(\.[0-9]+)?\.*$/g, "$1$2")
            .split('.');
    }

    if (a != "*" && b == "*") return -1;
    if (a == "*" && b != "*") return 1;
    if (a == "*" && b == "*") return 0;

    a = prep(a);
    b = prep(b);
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
        //convert to integer the most efficient way
        a[i] = ~~a[i];
        b[i] = ~~b[i];
        if (a[i] > b[i])
            return 1;
        else if (a[i] < b[i])
            return -1;
    }
    return 0;
}

// Returns the special xpilib object for the given ESR (or current).
function getExtData(extJson, esr) {
    let cmp_data = extJson?.xpilib?.cmp_data;
    let version = cmp_data
        ? cmp_data[esr]
        : null;

    let ext_data = extJson?.xpilib?.ext_data;
    let data = version && ext_data
        ? ext_data[version]
        : null;

    return { version, data };
}

async function loadAlternativeData() {
    return bentGetTEXT("https://raw.githubusercontent.com/thundernest/extension-finder/master/data.yaml").then(alternativeDataToLinks);
}

async function alternativeDataToLinks(data) {
    let entries = {};

    let lines = data.split(/\r\n|\n/);
    let i = 0;

    do {
        let entry = {};
        while (i < lines.length) {
            i++;
            let line = lines[i - 1].trim();

            // End of Block
            if (line.startsWith("---")) {
                break;
            }
            // Skip comments.
            if (line.startsWith("#")) {
                continue;
            }
            let parts = line.split(":");
            let key = parts.shift().trim();
            if (key) {
                let value = parts.join(":").trim();
                entry[key] = value;
            }
        }

        // Add found entry.
        if (Object.keys(entry).length > 0) {
            if (!entries[entry.u_id]) {
                entries[entry.u_id] = [];
            }
            if (entry.r_link)
                entries[entry.u_id].push(`<br> &#8627; <a href="${entry.r_link}">${entry.r_name}</a>`);
            else
                entries[entry.u_id].push(`<br> &#8627; ${entry.r_name}`);

        }
    } while (i < lines.length);

    return entries;
}

function getAlternative(extJson) {
    return gAlternativeData[extJson.guid];
}

// -----------------------------------------------------------------------------

function genIndex(index) {
    let extsListFile = fs.readFileSync("index-template.html", 'utf8');
    let today = new Date().toISOString().split('T')[0];
    extsListFile = extsListFile.replace('__date__', today);
    extsListFile = extsListFile.replace('__index__', index.join(""));
    fs.ensureDirSync(`${reportDir}`);
    fs.writeFileSync(`${reportDir}/index.html`, extsListFile);
}

async function main() {
    console.log("Downloading alternative add-ons data...");
    gAlternativeData = await loadAlternativeData();

    console.log('Generating reports...');
    let extsJson = fs.readJSONSync(extsAllJsonFileName);
    let index = [];
    for (let group of groups) {
        index.push(`<h1><a name="group${group.id}"></a>${group.header}</h1>`);
        for (let [name, report] of Object.entries(reports)) {
            if (report.enabled && report.group == group.id) {
                console.log("  -> " + name);
                let counts = report.generate(extsJson, name, report);
                index.push(`<p><a href="${name}.html">${name}</a> (${counts})</p><blockquote><p>${report.header}</p></blockquote>`);
            }
        }
    }
    genIndex(index);
}

main();
