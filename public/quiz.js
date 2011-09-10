/*
 * Faye Chat client adapted from Soapbox by James Coglan
 * (https://github.com/jcoglan/faye/tree/master/examples)
 */
Quiz = {
    /**
     * Initializes the application, passing in the globally shared Bayeux
     * client. Apps on the same page should share a Bayeux client so
     * that they may share an open HTTP connection with the server.
     */
    init: function(client) {
        var self = this;
        this._client = client;
    
        this._login   = $('#enterUsername');
        this._app     = $('#app');
        this._post    = $('#postMessage');
        this._stream  = $('#stream');
    
        this._app.hide();
    
        $('#username').focus();
        
        // When the user enters a username, store it and start the app
        this._login.submit(function() {
            self._username = $('#username').val();
            self.launch();
            return false;
        });
    },
  
    /**
     * Starts the application after a username has been entered. A
     * subscription is made to receive all messages on the channel,
     * and a form is set up to send messages.
     */
    launch: function() {
        var self = this;
    
        // Subscribe to the chat channel
        var subscription = self._client.subscribe('/quiz', self.accept, self);
  
        subscription.callback(function() {
            // Append user name to Post message label
            $('#messageLabel').append(html.escapeAttrib(self._username));

            // Hide login form
            self._login.fadeOut('slow', function() {
                // Preload the button disabled image
                $('<img>').attr({ src: 'bug_gray_3D_rgb.png' }).load(function() {
                    // Show main application UI
                    self._app.fadeIn('slow', function() {
                        $('#message').focus();
                    });
                });
            });
    
            self._post.submit(function() {
                self._client.publish('/quiz', {user: self._username, type: 'buzz'});
                $('#buzz').attr('disabled', 'disabled');
                $('#buzz').attr('src', 'bug_gray_3D_rgb.png');
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
        if (message.type === 'next') {
            $('#buzz').removeAttr('disabled');
            $('#buzz').attr('src', 'bug_blue_3D_rgb.png');
        }
    }
};

