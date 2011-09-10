/*
 * Faye Chat client adapted from Soapbox by James Coglan
 * (https://github.com/jcoglan/faye/tree/master/examples)
 */
Master = {
    /**
     * Initializes the application, passing in the globally shared Bayeux
     * client. Apps on the same page should share a Bayeux client so
     * that they may share an open HTTP connection with the server.
     */
    init: function(client) {
        var self = this;
        this._client = client;
    
        this._post    = $('#postMessage');
        this._stream  = $('#stream');
    
        self.launch();
    },
  
    /**
     * Starts the application after a username has been entered. A
     * subscription is made to receive all messages on the channel,
     * and a form is set up to send messages.
     */
    launch: function() {
        var self = this;
    
        // Subscribe to the chat channels
        var subscription = self._client.subscribe('/quiz', self.accept, self);
  
        subscription.callback(function() {
            self._post.submit(function() {
                self._client.publish('/quiz', {type: 'next'});
                self._stream.empty();
                return false;
            });
        });
    
        subscription.errback(function(error) {
            alert("Error subscribing: " + error.message);
        });
    },
  
    /**
     * Handler for received messages.
     */
    accept: function(message) {
        if (message.type === 'buzz') {
            this._stream.append('<li>'+html.escapeAttrib(message.user)+'</li>');
        }
    }
};

