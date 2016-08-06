/*
 * File: post-massage.js
 * Version: 1.0.5
 * Desc: A stupid simple postMessage wrapper for bi-directional communication between windows
 * Doc: https://github.com/tkasten/postMassage
 * Author: Tyler Kasten tyler.kasten@gmail.com
 */

var PostMassage = function(opts){
  this.namespace   = opts.namespace   || 'pmb',
  this.tx_origin   = opts.tx_origin   || '*'
  this.rx_origin   = opts.rx_origin   || /.*/
  this.window      = opts.window      || parent,
  this.methods     = opts.methods     || {}
  this.logging     = opts.logging     || false
  this.addListener = opts.addListener === false ? false : true

  this.call = function(method, data, callback){
     /***************************************************************************
     * Messages passed using postMessage() are wrapped in an object
     * that contains a namespace to avoid collisions with other people
     * also using postMessage() concurrently.  The structure is as follows:
     *
     * {
     *   'myConfiguredNamespace':{
     *     method:
     *     data:
     *     callback:
     *   }
     * }
     *
     * method: the name of the method to be dispatched in the other window's
     *         listening PostMassage object.
     *
     * data: the data your shipping to the other side's method
     *
     * callback (optional): the value returned from the above 'method' will be
     *                      passed to this method on this window's listening
     *                      PostMassage object.  The typical
     *                      use case is to get back the value of the method
     *                      you called in the remote window (the receiving
     *                      PostMassage is instructed to send it back to
     *                      you via this named callback.)
     ***************************************************************************/
    msg = {}
    msg[this.namespace] = {
      method: method,
      data: data,
      callback: callback
    }
    // IE9 (of course) calls toString on the message object. So stringify it first.
    msg = JSON.stringify(msg)
    this.window.postMessage(msg, this.tx_origin)
  },

  this.bind = function(method, functionObj){
    this.methods[method] = functionObj
  },

  this.log = function(msg){
    this.logging && console.log('PostMassage: ' + msg)
  }

  this.buildRxEventListener = function(){
    var self = this
    var listener = function(event){
      try{
        var msg = JSON.parse(event.data);
      }catch(e){
        self.log('ignoring non-JSON encoded string message');
        return;
      }
      if(msg[self.namespace]){
        if(self.rx_origin.exec(event.origin)){
          var method = msg[self.namespace].method,
            data     = msg[self.namespace].data,
            callback = msg[self.namespace].callback
          if(self.methods[method]){
            var value = self.methods[method](data, event)
            if(callback){
              self.call(callback, value)
            }
          }else{
            self.log('received a message but has no method named `' + method + '` registered')
          }
        }else{
          self.log('received a message namespaced to `' + self.namespace + '` but its origin `' + event.origin + '` didnt match ' + self.rx_origin)
        }
      }else{
        self.log('ignoring message from different namespace')
      }
    }
    return listener
  }

  if(this.addListener){
    window.addEventListener("message", this.buildRxEventListener(), false)
  }
}

function factory(){
  return PostMassage
}

if (typeof define === 'function' && define.amd) {
  define([],factory)
} else if (typeof module === 'object' && typeof module.exports === 'object') { //Node for browserfy
  module.exports = factory()
} else {
  window.PostMassage = window.PostMassage || factory()
}
