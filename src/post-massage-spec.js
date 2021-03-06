var chai = require('chai'),
    should = require('chai').should(),
    expect = require('chai').expect(),
    PostMassage = require('../src/post-massage')

describe('PostMassage', function() {

  var lastLogMsg;
  var myNameSpace = 'myCoolNamespace'

  beforeEach(function(){
    window = {
      lastMessage: undefined,
      postMessage: function(msg, origin){
        window.lastMessage = msg
        window.lastOrgin = origin
      },
      addEventListener: function(event, handler){
        window.eventListener = {
          event: event,
          handler: handler
        }
      }
    }
    pmb = new PostMassage({
      window: window,
      namespace: myNameSpace,
      logging: true,
      addListener:false
    })

    pmb.log = function(msg){
      lastLogMsg = msg
    }
  })

  describe('#call', function() {
    beforeEach(function(){
      pmb.call('myMethod','myData', 'myCallbackMethod')
    })

    it('nests message in namespace', function() {
      chai.expect(window.lastMessage).to.include.keys(myNameSpace)
    })

    it('sets the method', function() {
      chai.expect(window.lastMessage[myNameSpace].method).equal('myMethod')
    })

    it('sets the data', function() {
      chai.expect(window.lastMessage[myNameSpace].data).equal('myData')
    })

    it('sets the callback', function() {
      chai.expect(window.lastMessage[myNameSpace].callback).equal('myCallbackMethod')
    })
  })

  describe('#buildRxEventListener', function() {
    beforeEach(function(){
      event = {
        data: {}
      }
      event.data[pmb.namespace] = {
        method: 'myMethod',
        data: 'myData',
        callback: 'myCallbackMethod'
      }
      pmb.bind('myMethod', function(){
        myMethodCalled = true
        return 'valueFromMyMethod'
      })
      myCallbackMethodCalled = false
      pmb.bind('myCallbackMethod', function(data){
        myCallbackMethodCalled = data
      })
      listener = pmb.buildRxEventListener()
    })

    describe('method dispatch', function(){
      it('calls the events method', function() {
        listener(event)
        myMethodCalled.should.equal(true)
      })

      it('doesnt call the events undefined method', function() {
        event.data[pmb.namespace]['method'] = 'notABoundMethod'
        listener(event)
        chai.expect(lastLogMsg).to.match(/no method named/)
      })

      it('doesnt call the events method if origin mismatch', function() {
        pmb.rx_origin = /bogus/
        listener(event)
        chai.expect(lastLogMsg).to.match(/but its origin/)
      })
    })

    describe('method dispatch', function(){
      it('doesnt call the events method if not in my namespace', function() {
        namespaceData = event.data[pmb.namespace]
        delete event.data[pmb.namespace]
        event.data['differentNamespace'] = namespaceData
        listener(event)
        chai.expect(lastLogMsg).to.match(/ignoring message/)
      })
    })

    describe('callback method', function(){
      beforeEach(function(){
        myMethodCalled = false
        
        window.postMessage = function(msg, origin){
          listener({
            data: msg,
            origin: origin
          })
        }
      })

      it('calls the callback method and with proper value', function() {
        listener(event)
        myCallbackMethodCalled.should.equal('valueFromMyMethod')
      })

      it('doesnt the callback method', function() {
        event.data[pmb.namespace].callback = undefined
        listener(event)
        myCallbackMethodCalled.should.equal(false)
      })

    })

    describe('addEventListener', function(){
      it('binds the listener to the window', function() {
         pmb = new PostMassage({
          window: window,
          addListener:true
        })
        chai.expect(pmb.window).to.have.ownProperty('eventListener');
      })

      it('Dont bind the listener to the window if addListener:false', function() {
        chai.expect(pmb.window).not.to.have.ownProperty('eventListener');
      })
    })
  })
})

