#! /usr/bin/env node
'use strict';

let util = require('./util.js')
let querystring = require('querystring')

function getProtocolAndHostPart(url){
    let host = url
    let protocol = 'http'
    let hostParts = host.split('://')
    if(hostParts.length > 1){
        protocol = hostParts[0]
        host = hostParts[1]
    }
    protocol = protocol.toLowerCase()
    return {'protocol' : protocol, 'hostPart' : host}
}

function getHostPortAndPath(hostPart){
    let port = null
    let path = ''
    let host = hostPart
    // get host
    let hostParts = hostPart.split(':')
    if(hostParts.length > 1){
        host = hostParts[0]
        hostParts = hostParts[1].split('/')
        // get port and path
        if(hostParts.length == 1){
            port = hostParts[0]
        }
        else{
            path = hostParts.slice(1).join('/')
        }
    }
    else{
        hostParts = hostParts[0].split('/')
        host = hostParts[0]
        path = hostParts.slice(1).join('/')
    }
    // path should be at least '/'
    path = '/' + path
    return {'host' : host, 'port':port, 'path' : path}
}

/*
TEST:
console.log(createHttpOption('http://facebook.com/abc/def'))
console.log(createHttpOption('http://facebook.com:80/abc/def'))
console.log(createHttpOption('https://facebook.com/abc/def'))
console.log(createHttpOption('https://facebook.com:80/abc/def'))
console.log(createHttpOption('facebook.com'))
console.log(createHttpOption('localhost:3000'))
*/
function createHttpOption(url, data, callback){
    // split protocol and host
    let protocolAndHostPart = getProtocolAndHostPart(url)
    let protocol = protocolAndHostPart.protocol 
    let hostPart = protocolAndHostPart.hostPart
    // deterimine default port based on protocol
    let port = protocol == 'https'? 443: 80
    // deterimine port, host, and part
    let hostPortAndPath = getHostPortAndPath(hostPart)
    let host = hostPortAndPath.host 
    let path = hostPortAndPath.path 
    if(!util.isNullOrUndefined(hostPortAndPath.port)){
        port = hostPortAndPath.port
    }
    // compose the result
    let result = {
        'protocol' : protocol+':',
        'host' : host,
        'port' : port,
        'path' : path,
        'method' : 'POST',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    }
    return util.runCallbackAndReturn(callback, result)
}

function send(host, chain, params, callback){
    let bodyRequest = querystring.stringify({'chain' : chain, 'input' : params})
    let httpOption = createHttpOption(host, bodyRequest)
    let protocol = httpOption.protocol
    // create request using required protocol
    let http = protocol == 'https'? require('https'): require('http')
    let httpreq = http.request(httpOption, function (response) {
        response.setEncoding('utf8')
        let output = ''
        // get each chunk as output
        response.on('data', function (chunk) {
            output += chunk
        })
        // show the output
        response.on('end', function() {
            try{
                output = JSON.parse(output)
                callback(output.response, output.success, output.errorMessage)
            }
            catch(error){
                callback(null, false, error.stack)
                console.error('[ERROR] Error parsing JSONG')
                console.error(error.stack)
            }
        })
    })
    // error handler
    httpreq.on('error', function (error) {
        callback(null, false, error.stack)
        console.error('[ERROR] Request failed')
        console.error(error.stack)
    });
    // timeout handler
    httpreq.on('timeout', function () {
        callback(null, false, 'Request timeout')
        console.error('[ERROR] Request timeout')
        httpreq.abort();
    });

    if(process.env.TIMEOUT){
        // get timeout from environment
        httpreq.setTimeout(parseInt(process.env.TIMEOUT))
    }
    else{
        // by default, a minute without response, cut it off
        httpreq.setTimeout(60000);
    }
    // send request
    httpreq.write(bodyRequest)
    httpreq.end()
}

module.exports = {
    'send' : send,
    'createHttpOption' : createHttpOption,
}

