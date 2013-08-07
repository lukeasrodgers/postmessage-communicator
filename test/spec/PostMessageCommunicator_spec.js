describe('PostMessageCommunicator', function() {
  describe('instantiating a remote object', function() {
    beforeEach(function() {
      $('body').append('<iframe src="spec/fixtures/iframe.html"></iframe>');  
      this.Constructor = function(sendables) {
        this.sendables = sendables;
      };
      this.Constructor.prototype.set_communicator = function(c) {
        this.communicator = c;
      };
      this.Constructor.prototype.submit = function() {};
    });
    afterEach(function() {
      $('iframe').remove();
    });
    it('should create be able to instantiate an object in another iframe, and exchange messages with it', function() {
      var sender = new this.Constructor(['remote_submit', 'instantiate']);
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
        sender.instantiate('Obj', 'http://localhost', [1,2]);
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
      var sender = new this.Constructor(['remote_submit', 'instantiate']);
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
        sender.instantiate('Obj', 'http://localhost', [1,2]);
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
