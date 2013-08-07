(function() {
  'use strict';
  var PMC = function(config) {
    config = config || {};
    this.sender = config.sender;
    this.target_origin = config.target_origin;
    this.recipient = config.recipient; // window, iframe
    if (this.sender) {
      this.create_senders(this.sender.sendables || []);
    }
    this.create_listener();
    this.initialize();
  };

  // helper function that allows us to effectively call
  // new Foobar.apply(this, arguments);
  var construct = function(Constructor, args) {
    var C = function() {
      return Constructor.apply(this, args);
    };
    C.prototype = Constructor.prototype;
    return new C();
  };

  PMC.prototype.initialize = function() {};

  PMC.prototype.post_message = function(data) {
    this.recipient.postMessage(data, this.target_origin);
  };

  PMC.prototype.instantiate = function(config) {
    this.post_message({
      instantiate: true,
      constructor_name: config.constructor_name,
      args: config.args,
      target_origin: config.target_origin
    });
  };

  PMC.prototype.create_senders = function(sendables) {
    var that = this;
    var make_fn = function(fn_name) {
      return function() {
        that.post_message({
          fn_name: fn_name,
          fn_args: Array.prototype.slice.call(arguments, 0)
        });
      };
    };
    for (var i = 0, len = sendables.length; i < len; i++) {
      var fn_name = sendables[i];
      this.sender[fn_name] = make_fn(fn_name);
    }
  };
  
  PMC.prototype.create_listener = function() {
    var that = this;
    var add_listener = (function() {
      if (window.addEventListener) {
        return function(callback) {
          window.addEventListener('message', callback, false);
        };
      }
      else {
        window.attachEvent('onmessage', callback);
      }
    }());
    var has_func = function(fn_name) {
      return this.sender[fn_name] && typeof this.sender[fn_name] === 'function';
    };
    add_listener(function(e) {
      var data = e.data;
      var fn_name = data.fn_name;
      var fn_args = data.fn_args;
      if (data.instantiate) {
        // instantiate an object to interact with the remove receiver
        if (!that.recipient) {
          that.recipient = e.source;
        }
        var Constructor = eval(data.constructor_name);
        that.sender = construct(Constructor, data.args);
        that.target_origin = data.target_origin;
        that.communicator = that;
        if (that.sender.sendables) {
          that.create_senders(that.sender.sendables);
        }
      }
      else if (has_func.call(that, fn_name) && that.recipient) {
        that.sender[fn_name].apply(that.sender, fn_args);
      }
      else {
        console.warn('no match for', fn_name, fn_args, that.sender);
      }
    });
  };

  window.PostMessageCommunicator = PMC;
}());
