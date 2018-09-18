//Paranoix background.js 
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


///////////////////////////////////////
/////////////Utils////////////////////
//////////////////////////////////////

var Utils = {};
Utils.convertBoolsToNumber = function(bool_arr) {
    let a = 0, b = 1;
    for (let i = bool_arr.length - 1; i >= 0; i--) {
        a |= (bool_arr[i] ? b : 0);
        b <<= 1;
    }
    return a;
}
Utils.convertNumberToBools = function(num, bool_arr_len, is_to_bool) {
    let a = [], b = 1 << (bool_arr_len - 1), t = is_to_bool ? true : 1, f = is_to_bool ? false : 0;
    for (; b > 0; b >>= 1)
        a.push(num & b? t: f);
    return a;
}
Utils.cloneObject = function(obj) {
    if (typeof (obj) == "object") {
        if (obj == null) return null;
        if (obj.clone) return obj.clone();
        let ret = (obj instanceof Array) ? [] : {};
        for (let i in obj)
            ret[i] = Utils.cloneObject(obj[i]);
        return ret;
    }
    return obj;
}
Utils.JSONstringify = function (obj, radx, isbasn, is_fieldname_witout_quot, custum_obj_callback) {
    if (!radx) radx = 10;
    switch (typeof (obj)) {
        case "boolean": return (isbasn) ? (obj ? "1" : "0") : (obj ? "true" : "false");
        case "number": return ((obj >= 10 || radx < 10) && obj > 0) ? (((radx == 16) ? "0x" : ((radx == 8) ? "0" : ((radx == 2) ? "0b" : ""))) + obj.toString(radx)) : obj.toString();
        case "string": return '"' + obj + '"';
        case "function":
        case "object": {
            let ret;
            if (custum_obj_callback) {
                let k = custum_obj_callback(obj);
                if (k != null && k != undefined) return k;
            }
            if (obj == null) {
                return "null";
            } else if (obj instanceof Array) {
                ret = "[";
                for (let i = 0; i < obj.length; i++) {
                    if (i > 0) ret += ",";
                    ret += Utils.JSONstringify(obj[i], radx, isbasn, is_fieldname_witout_quot, custum_obj_callback);
                }
                ret += "]";
            } else {
                ret = "{";
                let f = !1;
                for (let i in obj) {
                    if (f) ret += ","; f = !0;
                    ret += (((is_fieldname_witout_quot && (typeof (i) == "string")) ? i :
                        Utils.JSONstringify(i, radx, isbasn, is_fieldname_witout_quot, custum_obj_callback)) + ":"
                        + Utils.JSONstringify(obj[i], radx, isbasn, is_fieldname_witout_quot, custum_obj_callback));
                }
                ret += "}";
            }
            return ret;
        }
    }
    return "undefined";
}

Utils.domainFromURL = function(website) { return website.toLowerCase().replace(/^(?:https|http)?:\/\//, "").replace(/\/.*$/, "").replace(/:.*$/, ""); }
Utils.topDomainFromURL = function(website) {
    let h = {
        "co.uk": 1, "ltd.uk": 1, "me.uk": 1, "net.uk": 1, "org.uk": 1, "plc.uk": 1, "ac.uk": 1, "gov.uk": 1, "mod.uk": 1, "mil.uk": 1, "nhs.uk": 1, "police.uk": 1, "nic.uk": 1, "sch.uk": 1,
        "ac.jp": 1, "ad.jp": 1, "co.jp": 1, "ed.jp": 1, "go.jp": 1, "gr.jp": 1, "lg.jp": 1, "ne.jp": 1, "or.jp": 1,
        "com.fr": 1, "tm.fr": 1, "gouv.fr": 1, "asso.fr": 1, "nom.fr": 1, "presse.fr": 1,
        "com.au": 1, "net.au": 1, "org.au": 1, "edu.au": 1, "gov.au": 1, "csiro.au": 1, "asn.au": 1, "id.au": 1
    };
    let dp = Utils.domainFromURL(website).split('.');
    let res = dp.pop();
    res = ((dp.length > 0) ? (dp.pop() + ".") : "") + res;
    if (h[res] && (dp.length > 0))
        res = dp.pop() + "." + res;
    return res;
}

Utils.protoFromURL = function(website) { return website.toLowerCase().match(/^([^:]*):\/\//)[1]; }

///////////////////////////////////////
/////////////classes//////////////////
//////////////////////////////////////

var BitField = (function () {
    //static
    function data_for_copy_constructor(field_off, as_object, as_number) { this.field_off = field_off; this.as_object = Utils.cloneObject(as_object); this.as_number = as_number; }
    // constructor
    var obj_def = function (arr_field_struct, number) {
        // private
        var field_off = {};
        var as_object = {};
        var as_number = 0;

        if (arr_field_struct instanceof data_for_copy_constructor) {
            field_off = arr_field_struct.field_off;
            as_object = arr_field_struct.as_object;
            as_number = arr_field_struct.as_number;
        } else if ((arr_field_struct instanceof Array) && (arr_field_struct[0] instanceof Array)) {
            for (let i = 0, l = arr_field_struct.length; i < l; i++) {
                let field_name = arr_field_struct[i][0];
                field_off[field_name] = i;
                as_object[field_name] = arr_field_struct[i][1];
                as_number |= (arr_field_struct[i][1] ? (1 << i) : 0);
            }
        } else if (typeof (number) == "object" && !(number instanceof Array)) {
            for (let i = 0, l = arr_field_struct.length; i < l; i++) {
                let field_name = arr_field_struct[i];
                field_off[field_name] = i;
                as_object[field_name] = number[field_name];
                as_number |= (number[field_name] ? (1 << i) : 0);
            }
        } else if (typeof (number) == "number") {
            for (let i = 0, l = arr_field_struct.length; i < l; i++) {
                let field_name = arr_field_struct[i];
                field_off[field_name] = i;
                as_object[field_name] = !!(number & (1 << i));
            }
            as_number = number;
        } else {
            for (let i = 0, l = arr_field_struct.length; i < l; i++) {
                let field_name = arr_field_struct[i];
                field_off[field_name] = i;
                as_object[field_name] = false;
            }
        }
        // public (this instance only)
        Object.defineProperty(this, 'num', {
            get: function () { return as_number },
            set: function (number) {
                as_number = number;
                for (let i in field_off)
                    as_object[i] = !!(number & (1 << field_off[i]));
                return as_number;
            }
        });
        Object.defineProperty(this, 'obj', {
            get: function () { return as_object },
            set: function (obj) {
                if (obj instanceof Array) {
                    as_object[obj[0]] = !!obj[1];
                    as_number = (obj[1]) ? (as_number | (1 << field_off[obj[0]])) : (as_number & ~(1 << field_off[obj[0]]));
                } else {
                    for (let i in obj) {
                        as_number = (obj[i]) ? (as_number | (1 << field_off[i])) : (as_number & ~(1 << field_off[i]));
                        as_object[i] = !!obj[i];
                    }
                }
                return obj;
            }
        });

        this.clone = function () { return new BitField(new data_for_copy_constructor(field_off, as_object, as_number)) }
    };
    // public static
    //obj_def.static_method = function () {
    //};
    // public (shared across instances)
    obj_def.prototype = {
        toString: function () { return this.getAsNumber().toString(); },
        valueOf: function () { return this.getAsNumber(); }
    };
    return obj_def;
})();


var current_update_tab = -1;

function SyncTabInfo() {
    var tabs = {};
    chrome.tabs.query({}, function (results) { results.forEach(function (tab) { tabs[tab.id] = tab; }); });
    function onUpdatedListener(tabId, changeInfo, tab) { tabs[tab.id] = tab; }
    function onRemovedListener(tabId) { delete tabs[tabId]; }
    chrome.tabs.onUpdated.addListener(onUpdatedListener);
    chrome.tabs.onRemoved.addListener(onRemovedListener);

    this.get = function (id) { return tabs[id]; }
    this.unregister = function () {
        chrome.tabs.onUpdated.removeListener(onUpdatedListener);
        chrome.tabs.onRemoved.removeListener(onRemovedListener);
    }
}

var tab_info = new SyncTabInfo();

function Domains() {
    var default_bitfield_instance = new BitField([
            ["use_only_en_lang", true],             //0
            ["rand_timezone", true],          //1
            ["rand_time_off", true],           //2
            ["disable_idb", true],                  //3
            ["disable_sw", true],                   //4
            ["disable_ac", true],                   //5
            ["disable_ls", false],                  //6
            ["disable_wrtc", true],                 //7
            ["disable_canvas", false],              //8  
            ["disable_wsql", true],                 //9
            ["disable_worker", false],              //10
            ["disable_intl", false],                //11
            ["disable_referrer", true],             //12
            ["canvas_randomizer", true],            //13
            ["webgl_randomizer", true],             //14
            ["disable_beacon", true],               //15
            ["use_direct_url", true],               //16
            ["disable_webasm", false],              //17
            ["disable_shared_worker", true],        //18
            ["disable_sarrbuff", true],//anti-spectre 19
            ["randomize_time_counters", true],      //20
            ["disable_cookie", false],              //21
            ["randomize_each", false],              //22
            ["disable_ajax", false],                //23
            ["connection_close", false],            //24
            ["disable_cache", false],               //25
            ["send_no_cache", false],               //26
            ["disable_cache_strong", false],        //27
            ["clear_plugin_list", false],           //28
            ["disable_popup", false],               //29
    ]);

    var domain_data = {};
    var domain_settings = {
        "*": {
            flags: default_bitfield_instance.clone(),
            iframe_flags: null,
            user_agents: ["Mozilla/5.0 (Windows NT 10.0; Win32; x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36 OPR/44.0.2510.1218"]
        }
    };

    {
        function parseBitField(num) {
            let res = default_bitfield_instance.clone();
            res.num = num;
            return res;
        }

        let dd = localStorage["domains_data"];
        if (dd != null && dd != undefined)
            domain_data = eval("(" + dd + ")");  //// uuuuuuuuu... dangerous... but not here))
        let ds = localStorage["domains_settings"];
        if (ds != null && ds != undefined)
            domain_settings = eval("(" + ds+ ")");
    }

    function _get_dname(url_req) {
        var url = null;
        if (typeof (url_req) == "string") {
            url = url_req;
        } else if ("tab" in url_req) {
            url = url_req.tab.url;
        } else if (url_req.tabId > 0 && url_req.type != "main_frame") {
            try { url = tab_info.get(url_req.tabId).url; } catch (e) { url = url_req.url; }
        } else {
            url = url_req.url;
        }
        return Utils.topDomainFromURL(url);
    }

    function _isiframe(url_req) {
        if (typeof (url_req) == "string") 
            return false;
        return ("frameId" in url_req) && (url_req.frameId != 0) && (url_req.url != "about:blank") && (Utils.topDomainFromURL(url_req.url) != _get_dname(url_req));
    }


    this.get = function(url) {
        let dname = _get_dname(url);
        var dd = domain_data[dname];
        if (dd == undefined) {
            var timezones = [
                [+0, 0, "AZOST"], [+0, 0, "EGST"], [+0, 0, "GMT"], [+0, 0, "WT"], [+0, 0, "Z"], [+1, 0, "A"], [+1, 0, "BST"],
                [+1, 0, "CET"], [+1, 0, "IST"], [+1, 0, "WAT"], [+1, 0, "WEST"], [+1, 0, "WST"], [-1, 0, "AZOT"], [-1, 0, "CVT"],
                [-1, 0, "EGT"], [-1, 0, "N"], [+2, 0, "B"], [+2, 0, "CAT"], [+2, 0, "CEST"], [+2, 0, "EET"], [+2, 0, "IST"],
                [+2, 0, "SAST"], [+2, 0, "WAST"], [-2, 0, "BRST"], [-2, 0, "FNT"], [-2, 0, "GST"], [-2, 0, "O"], [-2, 0, "PMDT"],
                [-2, 0, "UYST"], [-2, 0, "WGST"], [-2, 30, "NDT"], [+3, 0, "AST"], [+3, 0, "C"], [+3, 0, "EAT"], [+3, 0, "EEST"],
                [+3, 0, "FET"], [+3, 0, "IDT"], [+3, 30, "IRST"], [+3, 0, "MSK"], [+3, 0, "SYOT"], [+3, 0, "TRT"], [-3, 0, "ADT"],
                [-3, 0, "ART"], [-3, 0, "BRT"], [-3, 0, "CLST"], [-3, 0, "FKST"], [-3, 0, "GFT"], [-3, 0, "P"], [-3, 0, "PMST"],
                [-3, 0, "PYST"], [-3, 0, "ROTT"], [-3, 0, "WARST"], [-3, 0, "WGT"], [-3, 0, "UYT"], [-3, 0, "SRT"], [-3, 30, "NST"],
                [+4, 0, "ADT"], [+4, 0, "AMT"], [+4, 0, "AZT"], [+4, 0, "D"], [+4, 0, "GET"], [+4, 0, "GST"], [+4, 0, "KUYT"],
                [+4, 0, "MSD"], [+4, 0, "MUT"], [+4, 0, "RET"], [+4, 0, "SAMT"], [+4, 0, "SCT"], [+4, 30, "AFT"], [+4, 30, "IRDT"],
                [-4, 0, "AMT"], [-4, 0, "AST"], [-4, 0, "BOT"], [-4, 0, "CDT"], [-4, 0, "CIDST"], [-4, 0, "CLT"], [-4, 0, "EDT"],
                [-4, 0, "FKT"], [-4, 0, "GYT"], [-4, 0, "PYT"], [-4, 0, "Q"], [-4, 0, "VET"], [+5, 0, "AMST"], [+5, 0, "AQTT"],
                [+5, 45, "NPT"], [-5, 0, "ACT"], [+6, 0, "ALMT"], [+6, 30, "CCT"], [-6, 0, "CST"], [+7, 0, "DAVT"], [-7, 0, "MST"],
                [+8, 0, "BNT"], [+8, 30, "PYT"], [+8, 45, "ACWST"], [-8, 0, "AKDT"], [+9, 0, "AWDT"], [+9, 30, "ACST"], [-9, 0, "GAMT"],
                [+10, 0, "AEST"], [+10, 30, "ACDT"], [-10, 0, "CKT"], [+11, 0, "AEDT"], [-11, 0, "NUT"], [+12, 0, "ANAT"], [-12, 0, "AoE"],
                [+12, 45, "CHAST"], [+13, 0, "FJST"], [+13, 45, "CHADT"], [+14, 0, "LINT"]
            ];
            let timezone_index = Math.floor(Math.random() * timezones.length);
            let hardware_conc;
            do {
                hardware_conc = (parseInt(Math.random() * 16.0)) * 2;
            } while (hardware_conc == 0);
            dd = domain_data[dname] = {
                tzh: timezones[timezone_index][0],
                tzm: timezones[timezone_index][1],
                tzn: timezones[timezone_index][2],
                hardw_concur: hardware_conc
            };
        }
        if (dd.ua == null || dd.ua == undefined) {
            let setti = domain_settings[(dname in domain_settings) ? dname : "*"];
            if (setti.user_agents.length > 0) {
                dd.ua = setti.user_agents[Math.floor(Math.random() * setti.user_agents.length)];
            } else {
                dd.ua = "";
            }
        }
        return dd;
    }

    this.delete = function (url) { delete domain_data[_get_dname(url)]; }

    this.deleteAll = function () { domain_data = {}; }

    this.isIndiSettings = function (url) { return _get_dname(url) in domain_settings; }

    this.createIndiSettings = function (url) {
        let dname = _get_dname(url);
        if (!(dname in domain_settings)) domain_settings[dname] = Utils.cloneObject(domain_settings["*"]);
        return domain_settings[dname];
    }

    this.setSetting = function (url, name_setting, val) {
        let dname = _get_dname(url);
        let d = domain_settings[(dname in domain_settings) ? dname : "*"];
        let res = null;
        if (name_setting == "is_iframe") {
            res = d.iframe_flags != null;
            if (val) {
                if (d.iframe_flags == null)
                    d.iframe_flags = d.flags.clone();
            } else {
                d.iframe_flags = null;
            }
            return res;
        }
        if (name_setting.startsWith("iframe_")) {
            name_setting = name_setting.substr("iframe_".length);
            if (d.iframe_flags == null) {
                res = d.flags.obj[name_setting];
                d.flags.obj = [name_setting, val];
            } else {
                res = d.iframe_flags.obj[name_setting];
                d.iframe_flags.obj = [name_setting, val];
            }
        } else {
            if (name_setting in d.flags.obj) {
                res = d.flags.obj[name_setting];
                d.flags.obj = [name_setting, val];
            } else {
                res = d[name_setting];
                d[name_setting] = val;
                if (name_setting == "user_agents") {
                    if (dname in domain_settings) { 
                        domain_data[dname].ua = undefined;
                    } else { //is used default settings
                        for (let i in domain_data)
                            if (!(i in domain_settings))
                                domain_data[i].ua = undefined;
                    }
                }
            }
        }
        return res;
    }

    this.getSetting = function (url, name_setting) {
        let dname = _get_dname(url);
        let d = domain_settings[(dname in domain_settings) ? dname : "*"];
        if (name_setting == "is_iframe")
            return d.iframe_flags != null;
        if (name_setting.startsWith("iframe_")) {
            name_setting = name_setting.substr("iframe_".length);
            if (d.iframe_flags == null)
                return d.flags.obj[name_setting];
            else
                return d.iframe_flags.obj[name_setting];
        }
        if (name_setting in d.flags.obj)
            return d.flags.obj[name_setting];
        return d[name_setting];
    }

    this.getAllSettings = function (url) {
        let dn = _get_dname(url);
        let d = domain_settings[(dn in domain_settings) ? dn : "*"];
        if (_isiframe(url) && d.iframe_flags != null)
            return { f: d.iframe_flags.obj, ua: d.user_agents };
        return { f: d.flags.obj, ua: d.user_agents };
    }

    this.deleteIndiSettings = function (url) { delete domain_settings[_get_dname(url)]; }
    this.deleteAllIndiSettings = function () { domain_settings = {"*": domain_settings["*"]}; }

    this.saveInfo = function () {
        localStorage["domains_data"] = Utils.JSONstringify(domain_data, 16, false, false);
        localStorage["domains_settings"] = Utils.JSONstringify(
            domain_settings,
            16,
            false,
            false,
            function (obj) {
            if (obj instanceof BitField)
                return "(parseBitField(" + obj.num.toString() + "))";
            return null;
        });
    }
    this.getSettingsForContentScript = function (sender) {
        let tab = sender.tab;
        let time_offset = null;
        let timezone = null;
        let timezone_name = null;
        let dname = _get_dname(sender);
        let domain = this.get(dname);
        let is_iframe = _isiframe(sender);
        let settings = domain_settings[(dname in domain_settings) ? dname : "*"];
        let flags;
        if (is_iframe && settings.iframe_flags != null)
            flags = settings.iframe_flags;
        else
            flags = settings.flags;
        if (flags.obj.randomize_each) {
            domains.delete(sender);
            domain = domains.get(sender);
        }
        if (flags.obj.rand_timezone) {
            timezone = (Math.abs(domain.tzh) * 60) + domain.tzm;
            if (domain.tzh < 0)
                timezone = -timezone;
            timezone_name = domain.tzn;
        }

        if (flags.obj.rand_time_off) {
            let seconds_interval = 1000.0 * 60.0 * 3.0;
            time_offset = Math.floor(Math.random() * seconds_interval) - Math.floor(seconds_interval / 2);
        }
        return [
            domain.ua,
            time_offset,
            timezone,
            timezone_name,
            domain.hardw_concur,
            is_iframe,
            ((current_update_tab != -1) && (current_update_tab == tab.id)),
            (is_iframe && settings.iframe_flags != null)? settings.iframe_flags.num: settings.flags.num,
            (settings.iframe_flags == null)? settings.flags.num: settings.iframe_flags.num
        ];
    }
}


//end classes

var domains = new Domains();

function getTimeOffset() {
    let seconds_interval = 62.0 * 1000.0;
    return parseInt(Math.random() * seconds_interval) - parseInt(seconds_interval / 2);
}


////////////

function clearCookieForSite(request){
    var Res = false;
    var WithPluginDomainData = (arguments.length > 1) ? arguments[1] : false;
    if ("tabid" in request) {
        chrome.tabs.executeScript(
          request.tabid,
          {
              allFrames: true,
              code: "[window.location.protocol.replace(\":\", \"\"), window.location.hostname]"
          },
          function (results) {
              Res = true;
              for (let i = 0; i < results.length; i++) {
                  var prtcl = results[i][0];
                  var dmn = results[i][1];
                 
                  var callback = function (cookies) {
                      for (var j = 0; j < cookies.length; j++) {
                          chrome.cookies.remove({ url: prtcl + "://" + cookies[j].domain + cookies[j].path, name: cookies[j].name });
                      }
                  }
                  let cur_dmn = Utils.topDomainFromURL(dmn);
                  if (WithPluginDomainData) 
                      domains.delete(cur_dmn);
                  chrome.cookies.getAll({ domain: cur_dmn }, callback);
                  cur_dmn = dmn;
                  if (WithPluginDomainData)
                      domains.delete(cur_dmn);
                  chrome.cookies.getAll({ domain: cur_dmn }, callback);
                  console.log("Cookie for " + dmn + " cleared");
              }
          }
        );
    } else {
        Res = true;
        var prtcl = ("proto" in request) ? request.proto : "https";
        var callback = function (cookies) {
            for (var j = 0; j < cookies.length; j++) {
                chrome.cookies.remove({ url: prtcl + "://" + cookies[j].domain + cookies[j].path, name: cookies[j].name });
            }
        }
        let cur_dmn = Utils.topDomainFromURL(request.domain);
        if (WithPluginDomainData)
            domains.delete(cur_dmn);
        chrome.cookies.getAll({ domain: cur_dmn }, callback);
        cur_dmn = request.domain;
        if (WithPluginDomainData)
            domains.delete(cur_dmn);
        chrome.cookies.getAll({ domain: cur_dmn }, callback);
        console.log("Cookie for " + request.domain + " cleared");
    }
    return Res;
}

function clearLocalStorageForSite(request){
    var Res = false;
    chrome.tabs.executeScript(
        request.tabid,
        {
            allFrames: true,
            code: "localStorage.clear(); sessionStorage.clear(); true"
        },
        function (callback_res) {
            Res = true;
            for(var i = 0; i < callback_res.length; i++){
                Res &= callback_res[i];
            }
            console.log("Storage for " + (("domain" in request) ? request.domain : ("id" + request.tabid.toString())) + " cleared");
        }
     );
    return Res;
}

function clearLocalStorageAndCookieForSite(request) {
    if (current_update_tab != -1) {
        alert("In process...")
        return;
    }
    current_update_tab = request.tabid;
    var cookie_urls = [];
    let code_for_clear = "(" + function () {
         let code = "(" + function () {
            try{
                HTMLDocument.prototype.__defineGetter__('cookie', function(){});
                HTMLDocument.prototype.__defineSetter__('cookie', function(newval){});
            }catch(_){}
            try{
                window.localStorage.clear();
                window.sessionStorage.clear();
            }catch(_){}
            try{
                delete window.localStorage;
                delete window.sessionStorage;
                window.navigator.__proto__.sendBeacon = function(){};
            }catch(_){}
            try{
                window.XMLHttpRequest.prototype.open = function(){};
                delete window.XMLHttpRequest;
            }catch(_){}
            try{
                let ttt = document.getElementsByTagName("html")[0];
                document.removeChild(document.getElementsByTagName("html")[0]);
                document.appendChild(ttt);
            }catch(_){}
        } + ")()";
        let parent = document.documentElement;
        let script = document.createElement('script');
        script.text = code;
        script.async = false;
        try { parent.insertBefore(script, parent.firstChild); } catch (e) { }
        parent.removeChild(script);
    } + ")()";

    var navigate_listener = function (a) {
        if (current_update_tab != -1 && current_update_tab == a.tabId) {
            try {
                if (Utils.topDomainFromURL(a.url) == undefined || protoFromURL(a.url) == undefined)
                    throw "";
                cookie_urls.push(a.url);
            } catch (e) { }
        }
    };

    var IntervalId = setTimeout(
        function () {
            chrome.tabs.executeScript(request.tabid, { allFrames: true, code: code_for_clear });
            chrome.tabs.remove(request.tabid);
            for (var i = 0; i < cookie_urls.length; i++) {
                clearCookieForSite({ proto: protoFromURL(cookie_urls[i]), domain: domainFromURL(cookie_urls[i]) }, true);
            }
            cookie_urls = {};
            chrome.webNavigation.onBeforeNavigate.removeListener(navigate_listener);
            current_update_tab = -1;
            chrome.browsingData.remove({}, { "cache": true });
        },
        8000
    );
    clearCookieForSite(request, true);
    clearLocalStorageForSite(request);
    clearCookieForSite(request, true);

    chrome.browsingData.remove({}, { "cache": true });
    chrome.webNavigation.onBeforeNavigate.addListener(navigate_listener);

    chrome.tabs.executeScript(request.tabid, { code: code_for_clear });
    chrome.tabs.reload(request.tabid, {});
}

/* listeners */



function contentScriptResponceSync(content_data, data_for_content) {
    function StringHash(Str) {
        var hash = 5381, i = Str.length;
        while (i)
            hash = (hash * 33) ^ Str.charCodeAt(--i);
        return hash >>> 0;
    }

    let priv_content_key = parseInt(content_data.__content_key, 16) % 0xff;
    let content_key = StringHash(content_data.__content_key);

    let encode_data = Utils.JSONstringify(data_for_content, 10, true), encoded_data = "";
    for (let i = 0, l = encode_data.length; i < l; i++)
        encoded_data += String.fromCharCode(encode_data.charCodeAt(i) ^ priv_content_key);
    encoded_data = btoa(encoded_data);
    try {
        chrome.cookies.set({
            url: content_data.__content_url,
            name: "_usr_ag_chr_" + content_key.toString(16),
            value: encoded_data
        });
    } catch (e) { }
}

function __syncResponceClear(responce) {
    //window.Cookie.put
    if (("__RemoveCookie" in responce) && (responce.__Url != "about:blank")) {
        chrome.cookies.remove({
            url: responce.__Url,
            name: responce.__Cookie
        });
        return true;
    }
    return false;
}

function setSettings(req) {
    let old_val;
    let new_val = req.val;
    let url = req.taburl; // = getDomainData(topDomainFromURL(req.taburl));
    if (req.settings_name == "for_current_domain") {
        old_val = domains.isIndiSettings(url);
        if (new_val != null && new_val != undefined) {
            if (new_val)
                domains.createIndiSettings(url);
            else
                domains.deleteIndiSettings(url);
            domains.saveInfo();
        }
        return old_val;
    }
    old_val = domains.getSetting(url, req.settings_name);
    if (new_val != null && new_val != undefined) {
        domains.setSetting(url, req.settings_name, new_val);
        domains.saveInfo();
    }
    return old_val;
}

///////////////////////////////////////
/////////////Handlers//////////////////
//////////////////////////////////////


function onBeforeSendHeaders(info) {
    let domain = domains.get(info);
    let settings = domains.getAllSettings(info);
   
    let is_main_frame = info.type == "main_frame";
    if (settings.f.disable_beacon && info.type == "ping")
        return { cancel: true };

    if (settings.f.disable_cache_strong && is_main_frame)
        chrome.browsingData.removeCache({});

    let is_set_cache_control = settings.f.send_no_cache, is_set_pragma = settings.f.send_no_cache, is_set_connection_close = settings.f.connection_close;
    for (let pos = 0; pos < info.requestHeaders.length; pos++) {
        let HeaderName = info.requestHeaders[pos].name.toLowerCase();
        switch(HeaderName) {
            case "user-agent":
                if (domain.ua != undefined && domain.ua != "") {
                    info.requestHeaders[pos].value = domain.ua;
                } else {
                    info.requestHeaders.splice(pos, 1), pos--;
                }
                break;
            case "accept-language":
                if (settings.f.use_only_en_lang) {
                    info.requestHeaders[pos].value = "en-US,en;q=0.5";
                }
                break;
            case "cookie":
                if (settings.f.disable_cookie) {
                    info.requestHeaders.splice(pos, 1), pos--;
                } else {
                    info.requestHeaders[pos].value = info.requestHeaders[pos].value.replace(/[;]?[ \t]*_usr_ag_chr_[0-9A-Za-z]+[ \t]*=[ \t]*[A-Za-z0-9+/=]+[ \t]*/g, "");
                }
                break;
            case "referer":
                if (settings.f.disable_referrer && info.frameId == 0 && info.parentFrameId == -1 && is_main_frame && info.method == "GET")
                    info.requestHeaders.splice(pos, 1), pos--;
                break;
            case "cache-control":
                if (settings.f.send_no_cache) {
                    info.requestHeaders[pos].value = "no-cache"; is_set_cache_control = false;
                }
                break;
            case "pragma":
                if (settings.f.send_no_cache) {
                    info.requestHeaders[pos].value = "no-cache"; is_set_pragma = false;
                }
                break;
            case "connection":
                if (settings.f.connection_close && is_main_frame) {
                    info.requestHeaders[pos].value = "close"; is_set_connection_close = false;
                }
                break;
        }
    }
    if (is_set_cache_control)
        info.requestHeaders.push({
            name: "Cache-Control",
            value: "no-cache"
        });
    if (is_set_pragma)
        info.requestHeaders.push({
            name: "Pragma",
            value: "no-cache"
        });
    if (is_set_connection_close && is_main_frame)
        info.requestHeaders.push({
            name: "Connection",
            value: "close"
        });
    return { requestHeaders: info.requestHeaders };
}

function onHeadersReceived(info) {
    let settings = domains.getAllSettings(info);
    let is_main_frame = info.type == "main_frame";
    let is_set_cache_control = settings.f.disable_cache, is_set_pragma = settings.f.disable_cache, is_set_connection_close = settings.f.connection_close;
    for (let pos = 0; pos < info.responseHeaders.length; pos++) {
        let HeaderName = info.responseHeaders[pos].name.toLowerCase();
        switch (HeaderName) {
            case "cache-control":
                if (is_set_cache_control)
                    info.responseHeaders[pos].value = "no-cache", is_set_cache_control = false;
                break;
            case "connection":
                if (settings.f.connection_close && is_main_frame) {
                    info.responseHeaders[pos].value = "close"; is_set_connection_close = false;
                }
                break;
        }
    }
    if (is_set_cache_control)
        info.responseHeaders.push({
            name: "Cache-Control",
            value: "no-cache"
        });
    if (is_set_connection_close && is_main_frame)
        info.responseHeaders.push({
            name: "Connection",
            value: "close"
        });
    return { responseHeaders: info.responseHeaders };
}


function onMessageRecived(request, sender, sendResponse) {
    if (__syncResponceClear(request))
        return;

    switch (request.type) {
        case "getUserAgent": {
            var responseData = domains.getSettingsForContentScript(sender);
            contentScriptResponceSync(request, responseData);
            sendResponse({});
        } break;
        case "clearCookieForSite": {
            clearCookieForSite(request);
            sendResponse({});
        } break;
        case "clearStorageForThisSite": {
            clearLocalStorageForSite(request);
            sendResponse({});
        } break;
        case "clearStorageAndCookieForSiteAndRefresh": {
            clearLocalStorageAndCookieForSite(request);
            sendResponse({});
        } break;
        case "clearAllCookieAndLocalStorage": {
            chrome.browsingData.remove({}, { "cookies": true, "localStorage": true });
            sendResponse({});
        } break;
        case "clearAllData": {
            chrome.browsingData.remove({
            }, {
                "appcache": true,
                "cache": true,
                "cookies": true,
                "downloads": true,
                "fileSystems": true,
                "formData": true,
                "history": true,
                "indexedDB": true,
                "localStorage": true,
                "pluginData": false,
                "passwords": true,
                "webSQL": true
            });
            domains.deleteAll();
            domains.saveInfo();
            sendResponse({});
        } break;
        case "clearAllCache": {
            chrome.browsingData.remove({}, { "cache": true });
            sendResponse({});
        } break;
        case "Settings":
            sendResponse({ val: setSettings(request) });
            break;
        case "ClearPluginDomainData": {
            domains.deleteAll();
            domains.saveInfo();
            sendResponse({});
        } break;
        case "ClearPluginDataForDomain": {
            chrome.tabs.executeScript(
                request.tabid,
                {
                    allFrames: true,
                    code: "window.location.hostname"
                },
                function (results) {
                    for (let i = 0; i < results.length; i++) {
                        domains.delete(results[i]);
                    }
                    domains.saveInfo();
                }
              );
        } break;
        case "set_defaults": {
            domains.deleteAllIndiSettings();
            domains.saveInfo();
            sendResponse({});
        } break;
    }
}

chrome.runtime.onMessage.addListener(onMessageRecived);

chrome.webRequest.onBeforeSendHeaders.addListener(
  onBeforeSendHeaders,
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);

chrome.runtime.onSuspend.addListener(function () {
    domains.saveInfo();
});

//chrome.webRequest.onErrorOccurred.addListener();

var onButtonClick = function (tab) {
}

chrome.browserAction.onClicked.addListener(onButtonClick);