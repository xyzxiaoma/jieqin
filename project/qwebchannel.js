"use strict";

var QWebChannelMessageTypes = {
    signal: 1,
    propertyUpdate: 2,
    init: 3,
    idle: 4,
    debug: 5,
    invokeMethod: 6,
    connectToSignal: 7,
    disconnectFromSignal: 8,
    setProperty: 9,
    response: 10,
};

var QWebChannel = function(transport, initCallback, converters) {
    if (typeof transport !== "object" || typeof transport.send !== "function") {
        console.error("QWebChannel expects transport with send/onmessage.");
        return;
    }

    var channel = this;
    this.transport = transport;

    var converterRegistry = {
        Date: function(response) {
            if (typeof response === "string" && response.match(
                /^-?\d+-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?([-+\u2212](\d{2}):(\d{2})|Z)?$/)) {
                var date = new Date(response);
                if (!isNaN(date)) return date;
            }
            return undefined;
        }
    };

    this.usedConverters = [];

    this.addConverter = function(converter) {
        if (typeof converter === "string") {
            if (converterRegistry.hasOwnProperty(converter))
                this.usedConverters.push(converterRegistry[converter]);
        } else if (typeof converter === "function") {
            this.usedConverters.push(converter);
        }
    };

    if (Array.isArray(converters)) {
        converters.forEach(c => this.addConverter(c));
    } else if (converters !== undefined) {
        this.addConverter(converters);
    }

    this.send = function(data) {
        if (typeof(data) !== "string") data = JSON.stringify(data);
        channel.transport.send(data);
    };

    this.transport.onmessage = function(message) {
        var data = message.data;
        if (typeof data === "string") data = JSON.parse(data);
        switch (data.type) {
            case QWebChannelMessageTypes.signal:
                channel.handleSignal(data); break;
            case QWebChannelMessageTypes.response:
                channel.handleResponse(data); break;
            case QWebChannelMessageTypes.propertyUpdate:
                channel.handlePropertyUpdate(data); break;
            default:
                console.error("invalid message:", message.data);
        }
    };

    this.execCallbacks = {};
    this.execId = 0;
    this.exec = function(data, callback) {
        if (!callback) { channel.send(data); return; }
        data.id = channel.execId++;
        channel.execCallbacks[data.id] = callback;
        channel.send(data);
    };

    this.objects = {};

    this.handleSignal = function(message) {
        var obj = channel.objects[message.object];
        if (obj) obj.signalEmitted(message.signal, message.args);
    };

    this.handleResponse = function(message) {
        if (!message.hasOwnProperty("id")) return;
        channel.execCallbacks[message.id](message.data);
        delete channel.execCallbacks[message.id];
    };

    this.handlePropertyUpdate = function(message) {
        message.data.forEach(function(d) {
            var obj = channel.objects[d.object];
            if (obj) obj.propertyUpdate(d.signals, d.properties);
        });
        channel.exec({type: QWebChannelMessageTypes.idle});
    };

    channel.exec({type: QWebChannelMessageTypes.init}, function(data) {
        for (var name in data) new QObject(name, data[name], channel);
        for (var name in channel.objects) channel.objects[name].unwrapProperties();
        if (initCallback) initCallback(channel);
        channel.exec({type: QWebChannelMessageTypes.idle});
    });
};

function QObject(name, data, webChannel) {
    this.__id__ = name;
    webChannel.objects[name] = this;
    this.__objectSignals__ = {};
    this.__propertyCache__ = {};

    var object = this;

    this.unwrapQObject = function(response) {
        for (var c of webChannel.usedConverters) {
            var r = c(response);
            if (r !== undefined) return r;
        }
        if (response instanceof Array) return response.map(q => object.unwrapQObject(q));
        if (!(response instanceof Object)) return response;
        if (!response["__QObject*__"] || response.id === undefined) {
            var jObj = {};
            for (var k in response) jObj[k] = object.unwrapQObject(response[k]);
            return jObj;
        }
        var qObject = new QObject(response.id, response.data, webChannel);
        qObject.destroyed.connect(function() {
            delete webChannel.objects[response.id];
        });
        qObject.unwrapProperties();
        return qObject;
    };

    this.unwrapProperties = function() {
        for (var idx in object.__propertyCache__) {
            object.__propertyCache__[idx] = object.unwrapQObject(object.__propertyCache__[idx]);
        }
    };

    function addSignal(signalData, isProperty) {
        var sigName = signalData[0];
        var sigIdx = signalData[1];
        object[sigName] = {
            connect: function(cb) {
                if (typeof cb !== "function") return;
                object.__objectSignals__[sigIdx] = object.__objectSignals__[sigIdx] || [];
                object.__objectSignals__[sigIdx].push(cb);
                if (!isProperty && sigName !== "destroyed") {
                    webChannel.exec({type: QWebChannelMessageTypes.connectToSignal, object: object.__id__, signal: sigIdx});
                }
            },
            disconnect: function(cb) {
                if (typeof cb !== "function") return;
                object.__objectSignals__[sigIdx] = (object.__objectSignals__[sigIdx] || []).filter(c => c !== cb);
                if (!isProperty && object.__objectSignals__[sigIdx].length === 0) {
                    webChannel.exec({type: QWebChannelMessageTypes.disconnectFromSignal, object: object.__id__, signal: sigIdx});
                }
            }
        };
    }

    this.signalEmitted = function(sigName, sigArgs) {
        var cbs = object.__objectSignals__[sigName];
        if (cbs) cbs.forEach(cb => cb.apply(cb, object.unwrapQObject(sigArgs)));
    };

    this.propertyUpdate = function(signals, propMap) {
        for (var pi in propMap) object.__propertyCache__[pi] = object.unwrapQObject(propMap[pi]);
        for (var sn in signals) object.signalEmitted(sn, signals[sn]);
    };

    data.methods.forEach(function(m) {
        var mName = m[0], mIdx = m[1];
        var invokeName = mName[mName.length - 1] === ')' ? mIdx : mName;
        object[mName] = function() {
            var args = [], cb, errCb;
            for (var i = 0; i < arguments.length; ++i) {
                var a = arguments[i];
                if (typeof a === "function") cb = a;
                else args.push(a);
            }
            var result;
            if (!cb && typeof Promise === "function") {
                result = new Promise(function(resolve, reject) { cb = resolve; errCb = reject; });
            }
            webChannel.exec({type: QWebChannelMessageTypes.invokeMethod, object: object.__id__, method: invokeName, args: args}, function(resp) {
                var r = object.unwrapQObject(resp);
                if (cb) cb(r);
                else if (errCb) errCb();
            });
            return result;
        };
    });

    data.properties.forEach(function(p) {
        var pIdx = p[0], pName = p[1], notifySig = p[2];
        object.__propertyCache__[pIdx] = p[3];
        if (notifySig) {
            if (notifySig[0] === 1) notifySig[0] = pName + "Changed";
            addSignal(notifySig, true);
        }
        Object.defineProperty(object, pName, {
            configurable: true,
            get: function() { return object.__propertyCache__[pIdx]; },
            set: function(val) {
                if (val === undefined) return;
                object.__propertyCache__[pIdx] = val;
                webChannel.exec({type: QWebChannelMessageTypes.setProperty, object: object.__id__, property: pIdx, value: val});
            }
        });
    });

    data.signals.forEach(function(s) { addSignal(s, false); });
    Object.assign(object, data.enums);
}

QObject.prototype.toJSON = function() {
    if (this.__id__ === undefined) return {};
    return { id: this.__id__, "__QObject*__": true };
};

if (typeof module === "object") module.exports = { QWebChannel: QWebChannel };
