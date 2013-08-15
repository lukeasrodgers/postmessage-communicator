(function() {
  'use strict';
  var slice = Array.prototype.slice;
  if(![].indexOf){(Array.prototype.indexOf=function(a,b,c){for(c=this.length,b=(c+~~b)%c;b<c&&(!(b in this)||this[b]!==a);b++){}return b^c?b:-1;});}
  var PMC = function(config) {
    var that = this;
    config = config || {};
    this.sender = config.sender;
    this.configure(config);
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

  var need_stringifying = function(data) {
    var to_str = Object.prototype.toString;
    var type = to_str.call(data);
    return type === '[object Object]' || type === '[object Array]';
  };

  var has_func = function(fn_name) {
    return this.sender[fn_name] && typeof this.sender[fn_name] === 'function';
  };

  PMC.prototype.initialize = function() {};

  PMC.prototype.configure = function(config) {
    var that = this;
    this.target_origin = config.target_origin;
    this.recipient = config.recipient; // window, iframe
    this.origin_whitelist = config.origin_whitelist;
    if (this.sender) {
      this.create_senders(this.sender.sendables || []);
      this.sender.remote_execute = function() {
        that.remote_execute.apply(that, arguments);
      };
    }
  };

  PMC.prototype.post_message = function(data) {
    if (need_stringifying(data)) {
      data = JSON.stringify(data);
    }
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

  // tell another communicator that this window should
  // be its recipient
  PMC.prototype.set_remote_recipient = function() {
    this.post_message({
      recipient: true
    });
  };

  PMC.prototype.remote_execute = function(fn) {
    this.post_message({
      remote_execute: true,
      fn: '('+fn.toString()+')',
      args: slice.call(arguments, 1)
    });
  };

  PMC.prototype.create_senders = function(sendables) {
    var that = this;
    var make_fn = function(fn_name) {
      return function() {
        that.post_message({
          fn_name: fn_name,
          fn_args: slice.call(arguments, 0)
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
        return function(callback) {
          window.attachEvent('onmessage', callback);
        };
      }
    }());
    add_listener(function(e) {
      var data = e.data;
      if (!that.whitelisted(e.origin)) {
        return;
      }
      try {
        data = JSON.parse(data);
      }
      catch (err) {}
      var fn_name = data.fn_name;
      var fn_args = data.fn_args;
      if (data.instantiate) {
        that.instantiate_handler(e, data);
      }
      else if (data.recipient) {
        that.recipient = e.source;
        if (that.origin_whitelist) {
          // only set target_origin if a whitelist exists
          that.target_origin = e.origin;
        }
      }
      else if (data.remote_execute) {
        that.remote_execute_handler(data);
      }
      else if (has_func.call(that, fn_name) && that.recipient) {
        that.sender[fn_name].apply(that.sender, fn_args);
      }
      else {
        console.warn('no match for', fn_name, fn_args, that.sender);
      }
    });
  };

  PMC.prototype.whitelisted = function(origin) {
    if (!this.origin_whitelist) {
      return true;
    }
    else {
      return this.origin_whitelist.indexOf(origin) !== -1;
    }
  };

  PMC.prototype.instantiate_handler = function(e, data) {
    /* jshint evil: true */
    // instantiate an object to interact with the remote communicator
    this.recipient = e.source;
    var Constructor = eval(data.constructor_name);
    this.sender = construct(Constructor, data.args);
    this.configure({
      target_origin: data.target_origin,
      recipient: e.source,
      origin_whitelist: [e.origin]
    });
  };

  PMC.prototype.remote_execute_handler = function(data) {
    /* jshint evil: true */
    var fn_body = data.fn;
    var fn_name;
    var ctx_methods = fn_body.match(/this\.([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)/g);
    var dynamic_sendables = [];
    for (var i = 0, len = ctx_methods.length; i < len; i++) {
      fn_name = ctx_methods[i].match(/this\.([_a-zA-Z\$][_a-zA-Z0-9]*)/)[1];
      if (!has_func.call(this, fn_name)) {
        dynamic_sendables.push(fn_name);
      }
    }
    if (dynamic_sendables.length) {
      this.create_senders(dynamic_sendables);
    }
    var fn = eval(fn_body);
    var args = data.args;
    fn.apply(this.sender, args);
  };

  window.PostMessageCommunicator = PMC;
}());
