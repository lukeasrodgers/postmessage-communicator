describe('PostMessageCommunicator', function() {
  describe('working with an existing remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe_instantiated.html?cachebust='+ new Date().getTime() +'"></iframe>');  
      this.Constructor = function(sendables) {
        this.sendables = sendables;
      };
      this.Constructor.prototype.submit = function() {};
    });
    afterEach(function() {
      $('iframe').remove();
    });
    it('should be able to communicate with an instantiated communicator/sender pair', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.set_remote_recipient();
        waits(50);
        runs(function() {
          sender.remote_submit();
        });
        waits(50);
        runs(function() {
          expect(spy).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith({biz: 'quux'});
        });
      });
    });
  });
  describe('working with an incorrectly set up existing remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe_instantiated_no_whitelist.html?cachebust='+ new Date().getTime() +'"></iframe>');  
      this.Constructor = function(sendables) {
        this.sendables = sendables;
      };
      this.Constructor.prototype.submit = function() {};
    });
    afterEach(function() {
      $('iframe').remove();
    });
    it('should not be able to communicate with the remote object, because it is not whitelisted', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.set_remote_recipient();
        waits(50);
        runs(function() {
          sender.remote_submit();
        });
        waits(50);
        runs(function() {
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });
  });
  describe('instantiating a remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe.html?cachebust='+ new Date().getTime() +'"></iframe>');  
      this.Constructor = function(sendables) {
        this.sendables = sendables;
      };
      this.Constructor.prototype.submit = function() {};
    });
    afterEach(function() {
      $('iframe').remove();
    });
    it('should be able to instantiate an object in another iframe, and exchange messages with it', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        waits(50);
        runs(function() {
          sender.remote_submit();
        });
        waits(50);
        runs(function() {
          expect(spy).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith({foo: 'bar'});
        });
      });
    });
    it('should be able to instantiate an object in another iframe, and execute arbitrary code', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        waits(50);
        runs(function() {
          sender.remote_execute(function() { this.remote_submit(); });
        });
        waits(50);
        runs(function() {
          expect(spy).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith({foo: 'bar'});
        });
      });
    });
    it('execute arbitrary code, and create senders on the fly', function() {
      var sender = new this.Constructor(['remote_submit']);
      sender.arbitrary = function() {};
      var spy = spyOn(sender, 'arbitrary');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        waits(50);
        runs(function() {
          sender.remote_execute(function(a, b) { this.arbitrary(a, b); }, 5, 6);
        });
        waits(50);
        runs(function() {
          expect(spy).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith(5,6);
        });
      });
    });
    it('should be able to remotely do ajax calls', function() {
      var sender = new this.Constructor(['']);
      sender.success = function() {};
      var spy = spyOn(sender, 'success');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        var ajax_url = 'junk.html';
        waits(50);
        runs(function() {
          sender.remote_execute(function(url) { jQuery.ajax({url: url, type: 'get', success: this.success}); }, ajax_url);
        });
        waits(50);
        runs(function() {
          expect(spy).toHaveBeenCalled();
          expect(spy.mostRecentCall.args[0]).toContain('some junk');
        });
      });
    });
    it('should fail to exchange messages if target_origin does not match', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: 'http://google.com'
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        waits(50);
        runs(function() {
          sender.remote_submit();
        });
        waits(50);
        runs(function() {
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });
    it('should fail to exchange messages if origin is not whitelisted', function() {
      var sender = new this.Constructor(['remote_submit']);
      var spy = spyOn(sender, 'submit');
      var loaded = false;
      waitsFor(function() {
        $('iframe').load(function() {
          loaded = true;
        });
        return loaded;
      }, 'Failed to load iFrame', 500);
      runs(function() {
        var communicator = new PostMessageCommunicator({
          recipient: $('iframe').get(0).contentWindow,
          sender: sender,
          target_origin: window.location.protocol + '//' + window.location.host,
          origin_whitelist: ['http://foobar']
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: window.location.protocol + '//' + window.location.host,
          args: [1,2]
        });
        waits(50);
        runs(function() {
          sender.remote_submit();
        });
        waits(50);
        runs(function() {
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });
  });
});
