/// <reference path="../node_modules/typescript/bin/lib.dom.d.ts" />
import {Deferred} from 'prophecy/Deferred';
import {XHRConnection} from './XHRConnection';
import {assert} from 'assert';
import {serialize} from './Serialize';
import {toQueryString} from './QueryParams';
import {Provide} from 'di/annotations';
import {IInterceptResolution} from './IInterceptResolution';
import {IResponse} from './IResponse';
import {IRequest} from './IRequest';

function http$$setRequestHeaders(tuple) {
  var key;
  for (key of tuple.request.headers.keys()) {
    tuple.connection.setRequestHeader(key, tuple.request.headers.get(key));
  }
  return tuple;
}

function http$$openConnection(tuple) {
  tuple.connection.open(tuple.request.method, tuple.request.url);
  return tuple;
}

function http$$sendRequest(tuple) {
  tuple.connection.send(tuple.request.data);
  return tuple.connection;
}

interface Handler {
  resolve: (any);
  reject: (any);
}
interface IRequest {
  method: string;
  url: string;
  data: string;
  responseType: string;
  params: Map<string, any>;
  headers: Map<string, string>;
}
interface IResponse {
  method: string;
  data: string;
  responseType: string;
  params: Map<string, any>;
  headers: Map<string, string>;
}
interface IInterceptResolution {
  req?: IRequest;
  res?: IResponse;
  err?: any;
  interceptType: string;
}

class Http {
  private globalInterceptors: { request: Array<Handler>; response: Array<Handler> };

  constructor () {
    Object.defineProperty(this, 'globalInterceptors', {
      configurable: false,
      value: {
        response: [],
        request: []
      }
    });
    // Prevent response and request from being reassigned
    Object.freeze(this.globalInterceptors);
  }

  /**
   * @param config
   * @param config.method - GET, POST, PUT etc
   * @returns {Promise<T>}
   */
  request (config: {method: string; url: string;
                  params: Map<string, any>;
                  data: string;
                  headers: Map<string, string>;
                  responseType: string;
                  ConnectionClass: any}) {
    var connection, http = this;
    return new Promise(function(resolve, reject) {
      var request, promise;
      var {method, url, params, data, headers, responseType} = config;
      assert.type(method, assert.string);
      assert.type(url, assert.string);

      connection = new (config.ConnectionClass || XHRConnection)();

      request = {
        method: method,
        url: url,
        data: serialize(data),
        responseType: responseType || 'text',
        params: objectToMap(params),
        headers: objectToMap(headers)
      };

      function onResponse (response) {
        return http.intercept({
          req: request,
          res: response,
          interceptType: 'response'
        });
      }

      function onResponseError (reason) {
        return http.intercept({
          err: reason,
          req: request,
          interceptType: 'response'
        });
      }

      http.intercept({req: request, interceptType: 'request'}).
        then(() => ({request: request, connection: connection})).
        then(http$$openConnection).
        then(http$$setRequestHeaders).
        then(http$$sendRequest).
        then(onResponse, onResponseError).
        then(resolve, reject);
    });
  }

  /**
   * Creates a promise chain of interceptors from the globalInterceptors
   * object, based on the 'interceptType' property of resolution
   */
  intercept (resolution:IInterceptResolution) {
    var deferred = new Deferred(),
        interceptors;

    for (var i = 0; i < this.globalInterceptors[resolution.interceptType].length; i++) {
      interceptors = this.globalInterceptors[resolution.interceptType][i];
      deferred.promise = deferred.promise.then(interceptors.resolve, interceptors.reject);
    }

    deferred[resolution.err ? 'reject' : 'resolve'](resolution);
    return deferred.promise;
  }
}

function fullUrl (url:string, params:Map) {
  var hash = url.indexOf('#'), separator;
  if (hash >= 0) {
    url = url.substring(0, hash);
  }
  separator = url.indexOf('?') > -1 ? '&' : '?';
  return `${url}${separator}${toQueryString(params)}`;
}

function objectToMap (object) {
  var map = new Map(), key;
  if (!object) return map;
  for (key in object) {
    if (object.hasOwnProperty(key)) {
      map.set(key, object[key]);
    }
  }
  return map;
}

export {Http, fullUrl, objectToMap};
