describe('PostMessageCommunicator', function() {
  describe('working with an existing remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe_instantiated.html"></iframe>');  
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
          target_origin: 'http://localhost'
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
  describe('instantiating a remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe.html"></iframe>');  
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
          target_origin: 'http://localhost'
        });
        communicator.instantiate({
          constructor_name: 'Obj',
          target_origin: 'http://localhost',
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
          target_origin: 'http://localhost',
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
