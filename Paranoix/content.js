(function () {
    function convertBoolArrayToBitNumber(bool_arr) {
        let a = 0, b = 1;
        for (let i = 0, l = bool_arr.length; i < l; i++) {
            a |= (bool_arr[i] ? b : 0);
            b <<= 1;
        }
        return a;
    }

    function convertBitNumberToBoolArray(num, bool_arr_len, is_to_bool) {
        let a = [], b = 1 << (bool_arr_len - 1), t = is_to_bool ? true : 1, f = is_to_bool ? false : 0;
        for (; b > 0; b >>= 1)
            a.push(num & b ? t : f);
        return a.reverse();
    }

    function insertPageScript(text) {
        let parent = document.documentElement;
        let script = document.createElement('script');
        script.text = text;
        script.async = false;
        parent.insertBefore(script, parent.firstChild);
        parent.removeChild(script);
    }
    function insertPageScriptEx(textOrFunc, vals) {
        if (typeof (textOrFunc) == "function")
            textOrFunc = "(" + textOrFunc + (")(" + JSON.stringify(vals) + ");");
        insertPageScript(textOrFunc);
    }
    function StringHash(Str) {
        let hash = 5381, i = Str.length;
        while (i)
            hash = (hash * 33) ^ Str.charCodeAt(--i);
        return hash >>> 0;
    }

    function sendAndReciveDataFromBackgroundSync(val) {
        if (window.location.href == "about:blank")
            return null;
        var priv_content_key = Math.floor(Math.random() * 0xFFFFFFFF);
        val.__content_key = priv_content_key.toString(16);
        val.__content_url = window.location.href;
        priv_content_key = priv_content_key % 0xff;
        var srch_cookie = "_usr_ag_chr_" + StringHash(val.__content_key).toString(16);
        chrome.runtime.sendMessage(val);

        for (let k = 0; k < 7000; k++) {
            let CookieVal = document.cookie;
            if (CookieVal.search(srch_cookie) != -1) {
                chrome.runtime.sendMessage({
                    __RemoveCookie: "__RemoveCookie",
                    __Cookie: srch_cookie,
                    __Url: window.location.href
                });
                try {
                    let found = CookieVal.match(new RegExp("[;]?[ \t]*" + srch_cookie + "[ \t]*=[ \t]*([A-Za-z0-9+/=]+)[ \t]*"));
                    if (found != null) {
                        found = found[1];
                        found = new String(atob(found));
                        let decoded_data = new String();
                        for (let i = 0, length = found.length; i < length; i++)
                            decoded_data += String.fromCharCode(found.charCodeAt(i) ^ priv_content_key);
                        return JSON.parse(decoded_data);
                    }
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }


    function insertCodeTemplate(param) {
        var injectFunc = function injectFunc(param) {

            console.log("Paranoix: script enjected for " + self.location);
            var disable_beacon = false;
            function isHasBeenApply(root) { return (root.navigator.getBattery == undefined) && (root.geolocation == undefined); }
            function isWorker(root) { return root.toString().search("DedicatedWorkerGlobalScope") != -1; }
            function _setObjectPropertyName(method, name){
                method.toString = function(){return"function "+name +"() { [native code] }";};
                if(("name" in method) && (method.name != name)) try{method.__defineGetter__("name", function(){return name});} catch(e){}
                return method;
            }
            function getOriginalProperty(obj, prop_name, g_s){
                switch(g_s){
                    case 'g':
                        try{if(obj.prototype.__lookupGetter__(prop_name) != undefined)return obj.prototype.__lookupGetter__(prop_name);}catch(e){
                            try{if(obj.__proto__.__lookupGetter__(prop_name) != undefined)return obj.__proto__.__lookupGetter__(prop_name);}catch(e){ }
                        }return undefined;
                    case 's':
                        try{if(obj.prototype.__lookupSetter__(prop_name) != undefined)return obj.prototype.__lookupSetter__(prop_name);}catch(e){
                            try{if(obj.__proto__.__lookupSetter__(prop_name) != undefined)return obj.__proto__.__lookupSetter__(prop_name);}catch(e){ }
                        }return undefined;
                }
                try{if(prop_name in obj.prototype)return obj.prototype[prop_name];else throw 1;}catch(e){try{if(prop_name in obj.__proto__)return obj.__proto__[prop_name];else throw 1;}catch(e){}}
                return undefined;
            }
            function isExistInObj(obj, name){return (name in obj) || !!obj.prototype && (name in obj.prototype) || !!obj.__proto__ && (name in obj.__proto__);}
            var sObjDontTouch = {};
            function setObjectPropertys(root, hierarchy){
                for(let i in hierarchy){
                    let elem = hierarchy[i];
                    if(elem == sObjDontTouch){
                        continue;
                    } else if(i == "%"){
                        for(let j = 0, l = elem.length; j < l;j++){
                            let prop_name = elem[j];
                            try{delete root.prototype[prop_name];}catch(e){try{delete root.__proto__[prop_name];}catch(e){}}
                            if(prop_name in root) delete root[prop_name];
                            if(prop_name in root) try{Object.defineProperty(root.__proto__, prop_name, {enumerable: false, configurable: false, value: undefined});} catch(e){}
                        }
                    } else if(i == "#constructor" && arguments[2]) {
                        try{
                            let parent = arguments[2];
                            var parent_name = arguments[3], callback = elem;
                            parent[parent_name] = function (v) {
                                new_instance.prototype = v.prototype;
                                new_instance.prototype.constructor = _setObjectPropertyName(function() { return (new new_instance).toString() }, parent_name);
                                return new_instance;
                                function new_instance(){return callback(this, v, arguments);}
                            }(parent[parent_name]);
                            _setObjectPropertyName(parent[parent_name], parent_name);
                        } catch(e){}
                        return sObjDontTouch;
                    } else if(i == "#prototype") {
                        for(let j in elem){
                            let field_val = elem[j];
                            if(field_val == undefined){try{delete root.prototype[j];}catch(e){}
                            } else if(field_val == sObjDontTouch){
                            } else { _setObjectPropertyName(field_val, j);
                                try{root.prototype[j] = field_val;if(root.prototype[j]!=field_val)throw 0;}catch(e){try{root.__proto__[j] = field_val;}catch(e){}}
                            }
                        }
                    } else if(i == "#this"){
                        for(let j in elem){
                            let field_val = elem[j];
                            if(field_val == undefined){try{delete root[j];}catch(e){}
                            } else if(field_val == sObjDontTouch){
                            } else{_setObjectPropertyName(field_val, j);try{root[j]=field_val;}catch(e){}}
                        }
                    } else if(elem == undefined){
                        try{delete root.prototype[i];}catch(e){}try{delete root.__proto__[i];}catch(e){}try{delete root[i];}catch(e){}
                        if(i in root) try{Object.defineProperty(root.__proto__, i, {enumerable: false, configurable: false, value: undefined});} catch(e){}
                    } else if(i.startsWith("@")) {
                        let name = i.substr(1); if(!isExistInObj(root, name))continue;
                        _setObjectPropertyName(elem, name);
                        try{root.prototype.__defineGetter__(name,elem);}catch(e){try{root.__proto__.__defineGetter__(name,elem);}catch(e){try{root.__defineGetter__(name,elem);}catch(e){}}}
                    } else if(i.startsWith("&")) {
                        let name = i.substr(1); if(!isExistInObj(root, name))continue;
                        _setObjectPropertyName(elem, name);
                        try{root.prototype.__defineSetter__(name,elem);}catch(e){try{root.__proto__.__defineSetter__(name,elem);}catch(e){try{root.__defineSetter__(name,elem);}catch(e){}}}
                    } else if(!isExistInObj(root, i)){
                        continue;
                    } else if(typeof(elem) == "object" && !(elem instanceof Array)){
                        if(setObjectPropertys(root[i], elem, root, i) == sObjDontTouch) setObjectPropertys(root[i], elem);
                    } else if(typeof(elem) == "function"){
                        _setObjectPropertyName(elem, i);
                        try{root.prototype[i] = elem;if(root.prototype[i] != elem)throw 0;}catch(e){try{root.__proto__[i]=elem;}catch(e){try{root[i]=elem;}catch(e){}}}
                    } else {
                        let handler = _setObjectPropertyName(function(){return elem;}, i);
                        try{root.prototype.__defineGetter__(i,handler);if(root.prototype.__lookupGetter__(i) != handler)throw 0;}catch(e){try{root.__proto__.__defineGetter__(i,handler);}catch(e){}}
                    }
                }
            }
            function arrayExclusion(a, b){
                for(let i = 0, l = b.length; i < l; i++){
                    let index = a.indexOf(b[i]);
                    if(index != -1) a.splice(index, 1);
                }
                return a;
            }

            function isURL(str) {
                var pattern = new RegExp('^((https|http)?:\\/\\/)?'+ // protocol
                '((((\\w|\\d)((\\w|\\d|-)*(\\w|\\d))?\\.)+(\\w|\\d)+)|'+ // domain name
                'localhost|' +
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                '(\\:\\d+)?' +  //port
                '(\\/[-a-z\\d%_.,!~+)($^`><"\'}{=|:;]*)*'+ // path
                '(\\?[;:&a-z\\d%_.,!~+=-><"\')($^`}{|]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$', 'i' ); // fragment locator
                return pattern.test(str);
            }

            function domainFromURL(url) { return url.toLowerCase().replace(/^(?:https|http)?:\/\//, "").replace(/\/.*$/, "").replace(/:.*$/, ""); }

            function topDomainFromURL(url) {
                let h = {
                    "co.uk":1, "ltd.uk":1, "me.uk":1, "net.uk":1, "org.uk":1, "plc.uk":1, "ac.uk":1, "gov.uk":1, "mod.uk":1, "mil.uk":1, "nhs.uk":1, "police.uk":1, "nic.uk":1, "sch.uk":1,
                    "ac.jp":1, "ad.jp":1, "co.jp":1, "ed.jp":1, "go.jp":1, "gr.jp":1, "lg.jp":1, "ne.jp":1, "or.jp":1,
                    "com.fr":1, "tm.fr":1, "gouv.fr":1, "asso.fr":1, "nom.fr":1, "presse.fr":1, 
                    "com.au":1, "net.au":1, "org.au":1, "edu.au":1, "gov.au":1, "csiro.au":1, "asn.au":1, "id.au":1
                };
                let dp = domainFromURL(url).split('.');
                let res = dp.pop();
                res = ((dp.length > 0)? (dp.pop() + "."): "") + res;
                if(h[res] && (dp.length > 0))
                    res = dp.pop() + "." + res;
                return res;
            }
            var self_domain = topDomainFromURL(self.location.hostname);

            function isNotSameDomainIframe(url) { return (url != "") && (url != "about:blank") && (topDomainFromURL(url) != self_domain); }

            function windowSetInfo(flags, is_iframe, win) {
                console.log("Paranoix: windowSetInfo " + win.location.href + ((is_iframe) ? " iframe" : " main_frame"));
                let ud = undefined;
                setObjectPropertys(win, {
                    navigator: {
                        getBattery: ud, mozBattery: ud,
                        battery: ud, webkitBattery: ud,
                        geolocation: ud, getUserMedia: ud,
                        cpuClass: ud, oscpu: ud,
                        deviceMemory: ud, browserLanguage: ud,
                        userLanguage: ud, permissions: ud,
                        systemLanguage: ud, maxTouchPoints: ud,
                        userAgent: (param.user_agent == null)? ud: param.user_agent,
                        platform: (param.user_agent == null)? ud: param.platform,
                        appVersion: (param.user_agent == null)? ud: param.app_version,
                        hardwareConcurrency: (param.hardware_conc != null)? param.hardware_conc: sObjDontTouch
                    },
                    performance:{
                        memory:{
                            totalJSHeapSize: 0,
                            jsHeapSizeLimit: 0,
                            usedJSHeapSize: 0
                        },
                        navigation:{
                            type: 0,
                            redirectCount: 0
                        },
                        timing:{
                            navigationStart: 0, unloadEventStart: 0,
                            unloadEventEnd: 0, redirectStart: 0,
                            redirectEnd: 0, fetchStart: 0,
                            domainLookupStart: 0, domainLookupEnd: 0,
                            connectStart: 0, connectEnd: 0,
                            requestStart: 0, responseStart: 0,
                            responseEnd: 0, domLoading: 0,
                            domInteractive: 0, domContentLoadedEventStart: 0,
                            domContentLoadedEventEnd: 0, domComplete: 0,
                            loadEventStart: 0, loadEventEnd: 0,
                            secureConnectionStart: 0
                        }
                    },
                    Intl: (flags&(1<<11)) ? ud : sObjDontTouch,
                    openDatabase: (flags&(1<<9))? ud: sObjDontTouch,
                    Worker: (flags&(1<<10)) ? ud : sObjDontTouch,
                    SharedWorker: (flags&(1<<18)) ? ud : sObjDontTouch,
                    SharedArrayBuffer: (flags&(1<<19)) ? ud : sObjDontTouch,
                    XMLHttpRequest: (flags&(1<<23)) ? ud : sObjDontTouch
                });

                /* Remove WebRTC API*/
                if (flags&(1<<7)) {
                    setObjectPropertys(win, {
                        "%": [
                            "RTCPeerConnection",  "webkitRTCPeerConnection", "mozRTCPeerConnection", "msRTCPeerConnection",
                            "RTCIceCandidate", "RTCDataChannel", "RTCDataChannelEvent", "RTCCertificate" ,"RTCPeerConnectionIceEvent",
                            "RTCSessionDescription", "RTCConfiguration", "RTCRtpSender", "RTCRtpReceiver", "RTCRtpContributingSource",
                            "RTCTrackEvent", "RTCSctpTransport", "NetworkInformation", "RTCIdentityProvider", "RTCIdentityAssertion",
                            "RTCIdentityProviderRegistrar", "RTCIdentityEvent", "RTCIdentityErrorEvent", "RTCDTMFSender", "RTCDTMFToneChangeEvent"
                        ],
                        navigator: { mediaDevices: ud }
                    });
                }
                if (flags&(1<<28)){ //clear_plugin_list
                    setObjectPropertys(win, {
                        navigator: {
                            plugins: [],
                            mimeTypes: ud
                        }
                    });
                }
                if (flags&1) {
                    setObjectPropertys(win, {
                        navigator: {
                            language: "en-US",
                            languages: ["en-US", "en"]
                        }
                    });
                    setObjectPropertys(Intl.DateTimeFormat(), {resolvedOptions: function(){ 
                        return { 
                            locale: "en-US", 
                            calendar: "gregory",
                            numberingSystem: "latn", 
                            timeZone: ((param.use_timezon_name)? param.timezone_name: "UTC"),
                            month: "numeric", 
                            day: "numeric",
                            year: "numeric" 
                        };
                    }});
                }

                if (flags&(1<<3)) {
                    setObjectPropertys(win, {
                        indexedDB: {open: ud},
                        IDBFactory: {open: ud},
                        IDBDatabase: {transaction: ud, createObjectStore: ud },
                        IDBTransaction:{objectStore: ud},
                        "%":[
                            "indexedDB", "msIndexedDB", "mozIndexedDB", "webkitIndexedDB", "IDBDatabase",
                            "IDBTransaction", "webkitIDBTransaction", "msIDBTransaction", "IDBKeyRange", "webkitIDBKeyRange",
                            "msIDBKeyRange", "IDBFactory", "IDBIndex", "IDBCursor", "IDBObjectStore", "IDBRequest", "IDBCursorWithValue",
                            "IDBOpenDBRequest", "IDBVersionChangeEvent"
                        ]
                    });
                }
                if (flags&(1<<4)) {
                    /* Remove service worker API*/
                    setObjectPropertys(win, {
                        navigator: {
                            serviceWorker: ud
                        },
                        "%": [ 
                            "Cache", "CacheStorage", "Client", "Clients", "ExtendableEvent", "ExtendableMessageEvent", "FetchEvent",
                            "InstallEvent", "NavigationPreloadManager", "NotificationEvent", "ServiceWorker", "ServiceWorkerContainer",
                            "ServiceWorkerRegistration", "ServiceWorkerGlobalScope", "ServiceWorkerMessageEvent", "ServiceWorkerState",
                            "SyncEvent", "SyncManager", "WindowClient"
                        ]
                    }
                    );
                }
                if (flags&(1<<17)) {
                    setObjectPropertys(win, { WebAssembly: ud });
                }
                if (flags&(1<<5)) {
                    /* Remove application cache API*/
                    setObjectPropertys(win, { "%": ["applicationCache", "ApplicationCache", "ApplicationCacheErrorEvent"]});
                }
                if (flags&(1<<8)) {
                    setObjectPropertys(win, { 
                        "%": [ 
                            "CanvasRenderingContext2D", "WebGL2RenderingContext", "WebGLRenderingContext", "ImageBitmapRenderingContext",
                            "WebGLFramebuffer", "WebGLShader", "WebGLActiveInfo", "WebGLSync", "WebGLProgram", "WebGLBuffer", "WebGLContextEvent",
                            "WebGLQuery", "WebGLSampler", "WebGLRenderbuffer", "WebGLShaderPrecisionFormat", "WebGLTransformFeedback", 
                            "WebGLUniformLocation", "WebGLVertexArrayObject", "WebGLTexture", "CanvasPattern", "CanvasGradient", "CanvasCaptureMediaStreamTrack"
                        ], 
                        HTMLCanvasElement:{
                            "#prototype": {
                                getContext: function (a) { return null; }
                            }
                        } 
                    });
                } else if ((flags&(1<<13)) && win.HTMLCanvasElement) {
                    let getMethod = function (name){
                        const orig_Method = getOriginalProperty(win.HTMLCanvasElement, name);
                        return (function () {
                            let shift = {
                                'r': Math.floor(Math.random() * 10) - 5,
                                'g': Math.floor(Math.random() * 10) - 5,
                                'b': Math.floor(Math.random() * 10) - 5,
                                'a': Math.floor(Math.random() * 10) - 5
                            };
                            let width = this.width, height = this.height, context = this.getContext("2d");
                            let imageData = context.getImageData(0, 0, width, height);
                            for (let i = 0; i < height; i++) {
                                for (let j = 0; j < width; j++) {
                                    let n = ((i * (width * 4)) + (j * 4));
                                    imageData.data[n + 0] = imageData.data[n + 0] + shift.r;
                                    imageData.data[n + 1] = imageData.data[n + 1] + shift.g;
                                    imageData.data[n + 2] = imageData.data[n + 2] + shift.b;
                                    imageData.data[n + 3] = imageData.data[n + 3] + shift.a;
                                }
                            }
                            context.putImageData(imageData, 0, 0);
                            return orig_Method.apply(this, arguments);
                    });};
                    setObjectPropertys(win, { 
                        HTMLCanvasElement:{
                            "#prototype": {
                                toBlob: getMethod("toBlob"),
                                toDataURL: getMethod("toDataURL")
                            }
                        } 
                    });
                }

                if (flags&(1<<14)) {
                    var original_getExtension, original_getExtension2, original_getSupportedExtensions, original_getSupportedExtensions2,
                        original_getParamenter, original_getParamenter2;
                    if(win.WebGLRenderingContext){
                        original_getExtension = getOriginalProperty(win.WebGLRenderingContext, "getExtension");
                        original_getSupportedExtensions = getOriginalProperty(win.WebGLRenderingContext, "getSupportedExtensions");
                        original_getParamenter = getOriginalProperty(win.WebGLRenderingContext, "getParameter");
                    }
                    if(win.WebGL2RenderingContext){
                        original_getExtension2 = getOriginalProperty(win.WebGL2RenderingContext, "getExtension");
                        original_getSupportedExtensions2 = getOriginalProperty(win.WebGL2RenderingContext, "getSupportedExtensions");
                        original_getParamenter2 = getOriginalProperty(win.WebGL2RenderingContext, "getParameter");
                    }
                    var MaxTextureImageUnit = null, MaxTextureSize = null, MaxRenderbufferSize = null, MaxVaryingVectors = null, MaxFragmentUniformVectors = null,
                        MaxVertexUniformVectors = null, MaxTextureImageUnit2 = null, MaxTextureSize2 = null, MaxRenderbufferSize2 = null, MaxVaryingVectors2 = null,
                        MaxFragmentUniformVectors2 = null, MaxVertexUniformVectors2 = null;;
                    setObjectPropertys(win, {
                        WebGLRenderingContext: {
                            "#prototype":{
                                getExtension: function(name){
                                    if(
                                        name == "WEBGL_debug_renderer_info" || 
                                        name == "EXT_texture_filter_anisotropic" ||
                                        name == "WEBKIT_EXT_texture_filter_anisotropic" ||
                                        name == "WEBGL_debug_shaders"
                                    ) return null;
                                    return original_getExtension.apply(this, arguments);
                                },
                                getSupportedExtensions: function(){
                                    let res = original_getSupportedExtensions.apply(this, arguments);
                                    return arrayExclusion(res, ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic", "WEBKIT_EXT_texture_filter_anisotropic", "WEBGL_debug_shaders"]);
                                },
                                getParameter: function(){
                                    let res = original_getParamenter.apply(this, arguments);
                                    if(res != null && arguments[0])
                                        switch(arguments[0]){
                                            case this.MAX_TEXTURE_IMAGE_UNITS:
                                                return MaxTextureImageUnit = ((MaxTextureImageUnit == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxTextureImageUnit);
                                            case this.MAX_TEXTURE_SIZE:
                                                return MaxTextureSize = ((MaxTextureSize == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxTextureSize);
                                            case this.MAX_RENDERBUFFER_SIZE:
                                                return MaxRenderbufferSize = ((MaxRenderbufferSize == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxRenderbufferSize);
                                            case this.MAX_VARYING_VECTORS:
                                                return MaxVaryingVectors = ((MaxVaryingVectors == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxVaryingVectors);
                                            case this.MAX_FRAGMENT_UNIFORM_VECTORS:
                                                return MaxFragmentUniformVectors = ((MaxFragmentUniformVectors == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxFragmentUniformVectors);
                                            case this.MAX_VERTEX_UNIFORM_VECTORS:
                                                return MaxVertexUniformVectors = ((MaxVertexUniformVectors == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxVertexUniformVectors);
                                        }
                                    return res;
                                }
                            }
                        },
                        WebGL2RenderingContext:{
                            "#prototype":{
                                getExtension: function(name){
                                    if(
                                        name == "WEBGL_debug_renderer_info" || 
                                        name == "EXT_texture_filter_anisotropic" || 
                                        name == "WEBKIT_EXT_texture_filter_anisotropic" ||
                                        name == "WEBGL_debug_shaders"
                                    )
                                        return null;
                                    return original_getExtension2.apply(this, arguments);
                                },
                                getSupportedExtensions: function(){
                                    let res = original_getSupportedExtensions2.apply(this, arguments);
                                    return arrayExclusion(res, ["WEBGL_debug_renderer_info", "EXT_texture_filter_anisotropic", "WEBKIT_EXT_texture_filter_anisotropic", "WEBGL_debug_shaders"]);
                                },
                                getParameter: function(){
                                    let res = original_getParamenter2.apply(this, arguments);
                                    if(res != null && arguments[0])
                                        switch(arguments[0]){
                                            case this.MAX_TEXTURE_IMAGE_UNITS:
                                                return MaxTextureImageUnit2 = ((MaxTextureImageUnit2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxTextureImageUnit2);
                                            case this.MAX_TEXTURE_SIZE:
                                                return MaxTextureSize2 = ((MaxTextureSize2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxTextureSize2);
                                            case this.MAX_RENDERBUFFER_SIZE:
                                                return MaxRenderbufferSize2 = ((MaxRenderbufferSize2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxRenderbufferSize2);
                                            case this.MAX_VARYING_VECTORS:
                                                return MaxVaryingVectors2 = ((MaxVaryingVectors2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxVaryingVectors2);
                                            case this.MAX_FRAGMENT_UNIFORM_VECTORS:
                                                return MaxFragmentUniformVectors2 = ((MaxFragmentUniformVectors2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxFragmentUniformVectors2);
                                            case this.MAX_VERTEX_UNIFORM_VECTORS:
                                                return MaxVertexUniformVectors2 = ((MaxVertexUniformVectors2 == null)? Math.floor(Math.pow(2, Math.log2(res) + Math.floor(Math.random() * 3))): MaxVertexUniformVectors2);
                                        }
                                    return res;
                                }
                            }
                        }
                    });
                }
                if(param.clear_and_disable_ls) {
                    if(win.localStorage){
                        win.localStorage.clear();
                        win.sessionStorage.clear();
                    }
                    if(win.HTMLDocument){
                        setObjectPropertys(win, {
                            HTMLDocument:{
                                "@cookie": function(){return "";},
                                "&cookie": function(newval){return newval;}
                            }
                        });
                    }
                } else if (flags&(1<<6)) {
                    setObjectPropertys(win, {localStorage: ud, sessionStorage: ud});
                }
                if(win.navigator.sendBeacon){
                    var orig_sendBeacon = getOriginalProperty(win.navigator, "sendBeacon");
                    setObjectPropertys(win, {
                        navigator:{
                            sendBeacon: function(){
                                if(orig_sendBeacon && !((flags&(1<<15)) || disable_beacon))
                                    return orig_sendBeacon.apply(this, arguments);
                                return true;
                            }
                        }
                    });
                }
                if(win.HTMLDocument){
                    /* Redefine cookie */
                    var orig_CookieGetter = getOriginalProperty(win.HTMLDocument, "cookie", 'g');
                    var orig_CookieSetter = getOriginalProperty(win.HTMLDocument, "cookie", 's');
                    setObjectPropertys(win, {
                        HTMLDocument:{
                            "@cookie": (flags&(1<<21))? function () { return ""; }: function () { return orig_CookieGetter.apply(this, []).replace(/[;]?[ \t]*_usr_ag_chr_[0-9A-Za-z]+[ \t]*=[ \t]*[A-Za-z0-9+/=]+[ \t]*/g, ""); },
                            "&cookie": (flags&(1<<21))? function (newval) { return newval; } : function (newval) { return orig_CookieSetter.apply(this, [newval]); }
                        }
                    });
                }
                if(flags&(1<<20)){
                    var orig_PerformanceNow = getOriginalProperty(win.performance, "now"), last = 0;
                    setObjectPropertys(win, {
                        performance:{
                            now: function(){
                                let v = orig_PerformanceNow.apply(this, arguments);
                                v = Math.round(v / 100) * 100;
                                if(last < v)
                                    last = v;
                                last += (Math.random() * 5.0);
                                return last;
                            }
                        }
                    });
                }

                /* Redefine cookie */
                var bind = Function.bind;
                var unbind = bind.bind(bind);
                function ___instantiate(constructor, args) { return new (unbind(constructor, null).apply(null, args)); }

                var params_for_wrk = Object.assign({}, param);
                params_for_wrk.is_iframe = is_iframe;
                if (is_iframe) params_for_wrk.flags = params_for_wrk.flags_iframe;
                setObjectPropertys(win, {
                    Worker:{
                        "#constructor": function(t, v, args){
                            if(args.length == 0)
                                return ___instantiate(v, []);
                            try{
                                if(typeof(args[0]) != "string" || ((new URL(args[0])).origin != win.location.origin))
                                    throw 0;
                            } catch(e){ 
                                if(e == 0)
                                    return ___instantiate(v, Array.from(args));
                            }
                            let wrk_args = [URL.createObjectURL(new Blob([
                                "(function(importScriptName,param){",
                                injectFunc.toString(),
                                ";injectFunc(param); importScripts(importScriptName);})(",
                                JSON.stringify(args[0]),
                                ",",
                                JSON.stringify(params_for_wrk),
                                ");"
                            ], {type: 'application/javascript'}))];
                            if(args.length > 1)
                                wrk_args.push(args[1]);
                            return ___instantiate(v, wrk_args);
                        }
                    }
                });
                if(isWorker(win)){
                    var url = new URL(importScriptName);
                    setObjectPropertys(win, {
                        location:{
                            href: url.href,
                            pathname: url.pathname,
                            protocol: url.protocol,
                            host: url.host,
                            hostname: url.hostname,
                            origin: url.origin,
                            port: url.port,
                            search: url.search,
                            hash: url.hash,
                            "#prototype":{
                                toString: function(){ return importScriptName; }
                            }
                        }
                    });
                }

                if (param.use_time_offset || param.use_timezon_name || param.use_timezon) {
                    var orig_TimezoneOffset = (new win.Date()).getTimezoneOffset();
                    var orig_toLocaleString = getOriginalProperty(win.Date, "toLocaleString");
                    var orig_toString = getOriginalProperty(win.Date, "toString");
                    var orig_getTime = getOriginalProperty(win.Date, "getTime");
                    var orig_setTime = getOriginalProperty(win.Date, "setTime");
                    var rnd_last = 0;

                    function number_to_string_ex(num, radx, zero_fixed) {
                        let is_minus;
                        if (is_minus = ((num < 0) ? 1 : 0)) num = -num;
                        let str = num.toString(radx);
                        if (zero_fixed !== undefined && zero_fixed !== null) {
                            for (let i = str.length; i < zero_fixed; i++)
                                str = "0" + str;
                        }
                        if (is_minus) str = "-" + str;
                        return str;
                    }
                    setObjectPropertys(win, {
                        Date:{
                            "#constructor": function(t, v, args){
                                var new_date_instance = ___instantiate(v, args);
                                if (param.use_time_offset && args.length == 0){
                                    let v = orig_getTime.apply(new_date_instance, []) + param.time_offset;
                                    if( flags&(1<<20)) {v = Math.round(v / 100) * 100; if(rnd_last < v)rnd_last = v; rnd_last += Math.round(Math.random() * 5.0); v = rnd_last;}
                                    orig_setTime.apply(new_date_instance, [v]);
                                }
                                return new_date_instance;
                            },
                            "#prototype":(param.use_timezon_name && param.use_timezon)?{
                                getTimezoneOffset: function () { return param.fake_timezone; },
                                getMilliseconds: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCMilliseconds(); },
                                getSeconds: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCSeconds(); },
                                getMinutes: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCMinutes(); },
                                getHours: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCHours(); },
                                getDay: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCDay(); },
                                getMonth: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCMonth(); },
                                getFullYear: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCFullYear(); },
                                getDate: function () { return (new win.Date(orig_getTime.apply(this, []) - param.fake_timezone * 60000)).getUTCDate(); },
                                setMilliseconds: function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCMilliseconds.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                setSeconds:function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCSeconds.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                setMinutes: function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCMinutes.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                setHours: function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCHours.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                setDate: function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCDate.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                setFullYear: function () {
                                    let TimeZoneOff = param.fake_timezone * 60000;
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) - TimeZoneOff]);
                                    let res = win.Date.prototype.setUTCFullYear.apply(this, Array.from(arguments));
                                    orig_setTime.apply(this, [orig_getTime.apply(this, []) + TimeZoneOff]);
                                    return res + TimeZoneOff;
                                },
                                toString: function () {
                                    let res = orig_toString.apply(new win.Date(orig_getTime.apply(this, []) - (param.fake_timezone - orig_TimezoneOffset) * 60000), []);
                                    let to = (param.fake_timezone);
                                    let h = -parseInt(to / 60);
                                    let m = Math.abs(to) - Math.abs(h) * 60;
                                    let time_indicator = number_to_string_ex(h, 10, 2) + number_to_string_ex(m, 10, 2);
                                    res = res.replace(
                                        /GMT[+-]\d{4}.*$/,
                                        "GMT" +
                                        ((h >= 0) ? "+" : "") +
                                        time_indicator +
                                        " (" + param.timezone_name + ")"
                                    );
                                    return res;
                                },
                                toLocaleString: function () {
                                    return orig_toLocaleString.apply(new win.Date(orig_getTime.apply(this, []) - (param.fake_timezone - orig_TimezoneOffset) * 60000), []);
                                },
                                toLocaleFormat: undefined,
                            }: sObjDontTouch,
                            "#this":(param.use_timezon_name && param.use_timezon)? {
                                now: function () { return orig_getTime.apply(new win.Date(), []); },
                                parse: function (date_string) { return orig_getTime.apply(new win.Date(date_string), []); },
                                UTC: function (){return orig_getTime.apply(new (win.Date.bind.apply(win.Date, [null].concat(Array.from(arguments))))(),[]) - param.fake_timezone * 60000;}
                            }: sObjDontTouch
                        }
                    });
                }
                console.log("Paranoix: windowSetInfo " + win.location.href + " end");
            }

            if (!isHasBeenApply(self) || isWorker(self)){
                windowSetInfo(param.flags, param.is_iframe, self);
                if (param.flags&(1<<12)) {
                    setObjectPropertys(self, {HTMLDocument:{ referrer: ""}});
                }
                if ((param.flags&(1<<16)) && self.document) {
                    var window_open = self.open;
                    var eventHandler = function (e) {
                        let targetElem = e.target;
                        if(targetElem.nodeName.toLowerCase() == "a" || ((targetElem = targetElem.parentNode) && targetElem.nodeName.toLowerCase() == "a")){
                            let href = targetElem.href;
                            let innerText = targetElem.innerText;
                            let locationTopDomain = self_domain;
                            let targetUrl = null;
                            if (isURL(innerText) && !/^((((\w|\d)((\w|\d|-)*(\w|\d))?\.)+(\w|\d)+)|localhost|((\d{1,3}\.){3}\d{1,3}))$/i.test(innerText) && !innerText.endsWith("...")) {
                                if(!/^(https|http):\/\//i.test(innerText))
                                    innerText = "http://" + innerText;
                                if(topDomainFromURL(innerText) != locationTopDomain){
                                    targetElem.href = innerText;
                                    targetUrl = innerText;
                                }
                            }
                            if(targetUrl == null && typeof(href) == "string" && isURL(href)){
                                if(topDomainFromURL(href) == locationTopDomain)
                                    return;
                                targetUrl = href;
                            }
                            if(targetUrl != null){
                                e.preventDefault();
                                e.stopPropagation();
                                if(e.type == "mouseup" && e.button == 0){
                                    if(targetElem.target == "_blank"){
                                        window_open(targetUrl, '_blank');
                                    } else{
                                        disable_beacon = true;
                                        try{ self.XMLHttpRequest.prototype.open = function(){}; delete self.XMLHttpRequest;} catch(_){}
                                        self.location = targetUrl;
                                    }
                                }
                            }
                        }
                    };
                    self.document.addEventListener("mousedown", eventHandler, true);
                    self.document.addEventListener("mouseup", eventHandler, true);
                    self.document.addEventListener("click", eventHandler, true);
                    var originalWindowListener = self.addEventListener;
                    self.addEventListener = function (type, handler, is_top){
                        if(type == "unload"){
                            console.log("Paranoix: ignore unload event");
                            return;
                        }
                        return originalWindowListener.apply(this, arguments);
                    }
                    self.addEventListener.toString = function () { return "function addEventListener() { [native code] }"; };
                }
            }
            if(self.document){
                try {
                    let iframes = self.document.getElementsByTagName("iframe");
                    for (let i = 0, l = iframes.length; i < l; i++) {
                        try {
                            let content_win = iframes[i].contentWindow;
                            if (!isHasBeenApply(content_win)) {
                                let is_iframe = param.is_iframe;
                                if(!is_iframe){ try{is_iframe = isNotSameDomainIframe(iframes[i].src);} catch(e){} }
                                windowSetInfo((is_iframe) ? param.flags_iframe : param.flags, is_iframe, content_win);
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
            }
            if(self.HTMLIFrameElement){
                var orig_ContentWindowGetter = getOriginalProperty(self.HTMLIFrameElement, "contentWindow", 'g');
                var orig_ContentDocumentGetter = getOriginalProperty(self.HTMLIFrameElement, "contentDocument", 'g');
                setObjectPropertys(self, {
                    HTMLIFrameElement:{
                        "@contentWindow":function () {
                            let win = orig_ContentWindowGetter.apply(this, []);
                            try {
                                if (!isHasBeenApply(win)) {
                                    let is_iframe = param.is_iframe;
                                    if (!is_iframe) { try { is_iframe = isNotSameDomainIframe(this.src); } catch (e) { } }
                                    windowSetInfo((is_iframe) ? param.flags_iframe : param.flags, is_iframe, win);
                                }
                            } catch (e) { }
                            return win;
                        },
                        "@contentDocument":function () {
                            let doc = orig_ContentDocumentGetter.apply(this, []);
                            try {
                                let win = doc.defaultView;
                                if (!isHasBeenApply(win)) {
                                    let is_iframe = param.is_iframe;
                                    if (!is_iframe) { try { is_iframe = isNotSameDomainIframe(this.src); } catch (e) { } }
                                    windowSetInfo((is_iframe) ? param.flags_iframe : param.flags, is_iframe, win);
                                }
                            } catch (e) { }
                            return doc;
                        }
                    }
                });
            }
            console.log("Paranoix: enjected script executed");
        };
        insertPageScriptEx(injectFunc, param);
    }

    var response = sendAndReciveDataFromBackgroundSync({
        type: "getUserAgent",
        url: window.location.host
    });

    console.log("Paranoix: Sync data recived from background");
    if (response != null) {
        let user_agent = response[0];
        let platform = null;
        let app_version = null;
        if (user_agent != undefined && user_agent != null) {
            platform = (user_agent == "") ? "" : user_agent.match(/\([^;]*;\s*([^;]+)/)[1];
            app_version = (user_agent == "") ? "" : user_agent.match(/^[^/]+\/(.+)$/)[1];
        }
        insertCodeTemplate({
            user_agent: response[0],
            platform: platform,
            app_version: app_version,
            hardware_conc: response[4],
            use_time_offset: response[1] != null,
            use_timezon_name: response[3] != null,
            use_timezon: response[2] != null,
            is_iframe: response[5],
            time_offset: response[1],
            fake_timezone: response[2],
            timezone_name: response[3],
            clear_and_disable_ls: response[6],
            flags: response[7],
            flags_iframe: response[8]
        });

        console.log("Paranoix: script executed");
    }
})();

