//Paranoix popup.js 
//Copyright (C) 2018  Solodov A.N.
//
//    This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//any later version.
//
//    This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.  If not, see <https://www.gnu.org/licenses/>.

"use strict";

window.$ = function (id) { return id ? document.getElementById(id) : []; };
window.$.__defineGetter__("canCloseWindow", function () { return true; });
window.$.closeSelf = function () { window.close(); };
window.$.nm = function (elname) { return document.getElementsByName(elname); };
window.$.all = function (selector) { return document.querySelectorAll(selector); };
window.$.empty = function (id) {
    var element = "string" == typeof id ? document.getElementById(id) : id;
    if (element) for (; element.hasChildNodes() ;) element.removeChild(element.firstChild);
};
window.$.verCompare = function (a, b) {
    for (var na, nb, pa = a.split("."), pb = b.split("."), i = 0; i < 3; i++) {
        na = Number(pa[i]);
        nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};

window.$.__defineGetter__("extensionVersion", function () { return chrome.runtime.getManifest().version; });
window.$.__defineGetter__("background", function () { return chrome.extension.getBackgroundPage(); });
window.$.getBackgroundAsync = function (callback) { chrome.runtime.getBackgroundPage(callback); };
window.$.__defineGetter__("popup", function () {
    var popup = chrome.extension.getViews({
        type: "popup"
    });
    return popup.length > 0 ? popup[0] : null;
});
window.$.runtime = {
    onMessageListener: function (callback) {
        chrome.runtime.onMessage.addListener(callback);
    }
};
window.$.tab = {
    open: function (url) {
        chrome.tabs.create({
            url: url
        });
    }
};

window.$.commandEvent = function (callback) { };

window.$.icon = {};

window.$.icon.__defineSetter__("title", function (value) {
    chrome.browserAction.setTitle({
        title: value
    });
});

window.$.icon.__defineSetter__("path", function (value) {
    chrome.browserAction.setIcon({
        path: value
    });
});

window.$.icon.badge = {};

window.$.icon.badge.__defineSetter__("text", function (value) {
    chrome.browserAction.setBadgeText({
        text: value
    });
});

window.$.icon.badge.__defineSetter__("backgroundColor", function (value) {
    chrome.browserAction.setBadgeBackgroundColor({
        color: value
    });
});

window.$.storage = {};

window.$.storage.get = function (type, keys, onGot, onError) {
    type = "local";
    chrome.storage[type].get(keys, function (data) {
        chrome.extension.lastError ? onError && onError(chrome.extension.lastError) : onGot(data);
    });
};

window.$.storage.set = function (type, keys, onSet, onError) {
    type = "local";
    chrome.storage[type].set(keys, function () {
        chrome.extension.lastError ? onError && onError(chrome.extension.lastError) : onSet && onSet();
    });
};

window.$.storage.onChangedListen = function (callback) { chrome.storage.onChanged.addListener(callback); };

window.$.openOptionsPage = function () {
    chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : chrome.tabs.create({
        url: "options.html"
    });
};

window.$.options = {};
window.$.options.getBoolean = function (value, defaultValue) { return "boolean" == typeof value ? value : defaultValue; };
window.$.options.getObject = function (value, defaultValue) { return "object" == typeof value ? value : defaultValue; };
window.$.options.getObjectIndividual = function (value, defaultValue) {
    if ("object" == typeof value) {
        var newValue = {};
        for (var item in defaultValue) newValue[item] = "undefined" != typeof value[item] ? value[item] : defaultValue[item];
        return newValue;
    }
    return defaultValue;
};

window.$.options.loadCheckbox = function (storage, key) { "boolean" == typeof storage[key] && (window.$(key).checked = storage[key]); };

window.$.options.loadInput = function (storage, key) {
    "undefined" != typeof storage[key] && (window.$(key).value = storage[key]);
};

window.$.options.loadRadios = function (storage, key) {
    for (var radios = window.$.nm(key), storageValue = storage[key], i = 0; i < radios.length; i++) if (radios[i].value === storageValue) {
        radios[i].checked = !0;
        break;
    }
};

window.$.options.saveCheckbox = function (storage, key) { storage[key] = window.$(key).checked; };
window.$.options.saveInput = function (storage, key) { storage[key] = window.$(key).value; };
window.$.options.saveRadios = function (storage, key) {
    for (var radios = window.$.nm(key), i = 0; i < radios.length; i++) if (radios[i].checked) {
        storage[key] = radios[i].value;
        break;
    }
};


/*============*/
var CurrentTab = null;

var backg;

function domainFromURL(website) {
    website = website.toLowerCase().replace(/^(?:https|http)?:\/\//, "").replace(/\/.*$/, "").replace(/:.*$/, "");
    return website;
}

function topDomainFromURL(website) {
    website = domainFromURL(website);
    var i = website.search(/[^.]*\.[^0-9.]+$/);
    if (i > 0)
        website = website.substr(i);
    return website;
}

function protoFromURL(website) {
    return website.toLowerCase().match(/^([^:]*):\/\//)[1];
}

function RemoveCookie(dmn) {
    chrome.cookies.getAll(
        { domain: dmn },
        function (cookies) {
            for (var i = 0; i < cookies.length; i++) {
                chrome.cookies.remove({ url: dmn + cookies[i].path, name: cookies[i].name });
            }
        }
    );
}
/*=============*/

function setOrGetSetting(settings_name, new_val, callback_getter) {
    let req = {
        type: "Settings",
        settings_name: settings_name,
        tabid: CurrentTab.id,
        taburl: CurrentTab.url
    };
    if (new_val != undefined && new_val != null)
        req["val"] = new_val;
    if (callback_getter != null && callback_getter != undefined && typeof (callback_getter) == "function") {
        chrome.runtime.sendMessage(req, function (response) { callback_getter(response?response.val: null); });
    } else {
        chrome.runtime.sendMessage(req);
    }
}

function bindBackgroundSettings(settings_name, elem_name, addition_data_callback, responce_callback) {
    if (elem_name == null || elem_name == undefined)
        elem_name = settings_name;
    var elem = $(elem_name);
    if (elem.tagName.toLowerCase() == "input" && elem.getAttribute("type") == "checkbox") {
        setOrGetSetting(
            settings_name,
            null,
            function (r) {
                elem.checked = r;
            }
        );
        elem.addEventListener(
            "change",
            function (r) {
                setOrGetSetting(settings_name, r.currentTarget.checked);
            },
            false
        );
    } else if (elem.tagName.toLowerCase() == "button") {
        elem.addEventListener(
            "click",
            function (r) {
                var data = {};
                if (typeof (addition_data_callback) == "function") {
                    data = addition_data_callback(r);
                    if (data == undefined || data == null)
                        data = {};
                }
                data["type"] = settings_name;
                data["tabid"] = CurrentTab.id;
                data["taburl"] = CurrentTab.url;
                if (responce_callback != undefined && responce_callback != null) {
                    chrome.runtime.sendMessage(data, responce_callback);
                } else {
                    chrome.runtime.sendMessage(data);
                }
            },
            false
        );
    }

}

window.addEventListener(
    "DOMContentLoaded",
    function () {
        $.getBackgroundAsync(
            function (backgroundPage) {
                backg = backgroundPage;
                if (backg) {
                    chrome.tabs.query(
                        {
                            active: true,
                            currentWindow: true
                        },
                        function (tabs) {
                            if (tabs.length == 1)
                                CurrentTab = tabs[0];
                            {
                                let cloned_tab = $("main_tab").cloneNode(true);
                                cloned_tab.id = "iframe_tab";
                                let inputs = cloned_tab.getElementsByTagName("input");
                                for (let i = 0; i < inputs.length; i++) {
                                    inputs[i].id = "iframe_" + inputs[i].id;
                                }                           
                                let labels = cloned_tab.getElementsByTagName("label");
                                for (let i = 0; i < labels.length; i++) {
                                    labels[i].htmlFor = "iframe_" + labels[i].htmlFor;
                                }
                                cloned_tab.style.display = "none";
                                $("main_tab").parentElement.appendChild(cloned_tab);
                            }
                            $("tab").addEventListener("change", function (elem) {
                                if ($("tab").checked) {
                                    if (!$("is_iframe").checked) {
                                        $("tab").checked = false;
                                        return;
                                    }
                                    $("tab_label").innerText = "Iframe";
                                    $("iframe_tab").style.display = "block";
                                    $("main_tab").style.display = "none";
                                }
                                if (!$("tab").checked) {
                                    $("tab_label").innerText = "Main frame";
                                    $("iframe_tab").style.display = "none";
                                    $("main_tab").style.display = "block";
                                }
                            }, false);

                            bindBackgroundSettings("clearCookieForSite", "cookie_clear", function (r) {
                                return {
                                    domain: topDomainFromURL(CurrentTab.url),
                                    proto: protoFromURL(CurrentTab.url),
                                    tabid: CurrentTab.id
                                };
                            });
                            bindBackgroundSettings("clearAllCookieAndLocalStorage", "all_storage_cookie_clear");
                            bindBackgroundSettings("clearAllData", "all_data_clear");
                            bindBackgroundSettings("clearAllCache", "cache_clear");
                            bindBackgroundSettings("Settings", "user_agents_set", function (r) {
                                return { val: $("user_agents").value.split(/[\r\n]{1,2}/), settings_name: "user_agents" };
                            }, function (response) {
                                //$("user_agents").value = response.val.join("\n");
                            });

                            bindBackgroundSettings("clearStorageForThisSite", "storage_clear", function (r) {
                                return {
                                    domain: topDomainFromURL(CurrentTab.url),
                                    proto: protoFromURL(CurrentTab.url),
                                    tabid: CurrentTab.id
                                };
                            });
                            bindBackgroundSettings("clearStorageAndCookieForSiteAndRefresh", "storage_cookie_clear", function (r) {
                                return {
                                    domain: topDomainFromURL(CurrentTab.url),
                                    proto: protoFromURL(CurrentTab.url),
                                    tabid: CurrentTab.id
                                };
                            });
                            bindBackgroundSettings("ClearPluginDataForDomain", "clear_plugin_data_for_domen", function (r) {
                                return {
                                    tabid: CurrentTab.id
                                };
                            });



                            bindBackgroundSettings("ClearPluginDomainData", "clear_plugin_dmn_data");
                            bindBackgroundSettings("set_defaults");
                            bindBackgroundSettings("for_current_domain");

                            bindBackgroundSettings("use_only_en_lang");
                            bindBackgroundSettings("rand_timezone");
                            bindBackgroundSettings("rand_time_off");
                            bindBackgroundSettings("disable_idb");
                            bindBackgroundSettings("disable_sw");
                            bindBackgroundSettings("disable_ac");
                            bindBackgroundSettings("disable_ls");
                            bindBackgroundSettings("disable_wrtc");
                            bindBackgroundSettings("disable_canvas");
                            bindBackgroundSettings("disable_wsql");
                            bindBackgroundSettings("disable_worker");
                            bindBackgroundSettings("disable_intl");
                            bindBackgroundSettings("disable_referrer");
                            bindBackgroundSettings("canvas_randomizer");
                            bindBackgroundSettings("webgl_randomizer");
                            bindBackgroundSettings("disable_beacon");
                            bindBackgroundSettings("use_direct_url");
                            bindBackgroundSettings("disable_webasm");
                            bindBackgroundSettings("disable_shared_worker");
                            bindBackgroundSettings("disable_sarrbuff");
                            bindBackgroundSettings("randomize_time_counters");
                            bindBackgroundSettings("disable_cookie");
                            bindBackgroundSettings("randomize_each");
                            bindBackgroundSettings("disable_ajax");
                            bindBackgroundSettings("disable_cache");
                            bindBackgroundSettings("connection_close");
                            bindBackgroundSettings("disable_cache_strong");
                            bindBackgroundSettings("send_no_cache");
                            bindBackgroundSettings("clear_plugin_list");
                            bindBackgroundSettings("disable_popup");

                            bindBackgroundSettings("is_iframe");

                            //for iframe tab
                            bindBackgroundSettings("iframe_use_only_en_lang");
                            bindBackgroundSettings("iframe_rand_timezone");
                            bindBackgroundSettings("iframe_rand_time_off");
                            bindBackgroundSettings("iframe_disable_idb");
                            bindBackgroundSettings("iframe_disable_sw");
                            bindBackgroundSettings("iframe_disable_ac");
                            bindBackgroundSettings("iframe_disable_ls");
                            bindBackgroundSettings("iframe_disable_wrtc");
                            bindBackgroundSettings("iframe_disable_canvas");
                            bindBackgroundSettings("iframe_disable_wsql");
                            bindBackgroundSettings("iframe_disable_worker");
                            bindBackgroundSettings("iframe_disable_intl");
                            bindBackgroundSettings("iframe_disable_referrer");
                            bindBackgroundSettings("iframe_canvas_randomizer");
                            bindBackgroundSettings("iframe_webgl_randomizer");
                            bindBackgroundSettings("iframe_disable_beacon");
                            bindBackgroundSettings("iframe_use_direct_url");
                            bindBackgroundSettings("iframe_disable_webasm");
                            bindBackgroundSettings("iframe_disable_shared_worker");
                            bindBackgroundSettings("iframe_disable_sarrbuff");
                            bindBackgroundSettings("iframe_randomize_time_counters");
                            bindBackgroundSettings("iframe_disable_cookie");
                            bindBackgroundSettings("iframe_randomize_each");
                            bindBackgroundSettings("iframe_disable_ajax");
                            bindBackgroundSettings("iframe_disable_cache");
                            bindBackgroundSettings("iframe_connection_close");
                            bindBackgroundSettings("iframe_disable_cache_strong");
                            bindBackgroundSettings("iframe_send_no_cache");
                            bindBackgroundSettings("iframe_clear_plugin_list");
                            bindBackgroundSettings("iframe_disable_popup");
                            setOrGetSetting("user_agents", null,  function (r) {
                                $("user_agents").value = r.join("\n");
                            });
                        }
                    );
                } else {
                    if (!chrome.extension.inIncognitoContext)
                        throw new Error("Missing background page");
                    document.body.className = "menu-hide extension-incognito";
                }
            }
        );
    },
    false
);