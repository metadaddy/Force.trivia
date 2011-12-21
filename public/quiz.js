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
    
        this._login  = $('#enterUsername');
        this._app    = $('#app');
        this._post   = $('#postMessage');
        this._stream = $('#stream');
        
        // Subscribe to the chat channel
        var subscription = self._client.subscribe('/quiz', self.accept, self);

        subscription.errback(function(error) {
            alert("Error subscribing: " + error.message);
        });
        
        self._handle = $.cookie('handle');
        self._name   = $.cookie('name');
        
        if (self._handle && self._name) {
            $('#handle').val(self._handle);
            $('#name').val(self._name);
            
            self.launch();
        } else {
            this._app.hide();

            $('#handle').focus();

            // When the user enters handle/name, store them and start the app
            this._login.submit(function() {
                self._handle = $('#handle').val();
                self._name = $('#name').val();
                $.cookie('handle', self._handle, { expires: 1 });
                $.cookie('name', self._name, { expires: 1 });
                self.launch();
                return false;
            });
        }            
    },
  
    /**
     * Starts the application after a username has been entered. A
     * subscription is made to receive all messages on the channel,
     * and a form is set up to send messages.
     */
    launch: function() {
        var self = this;
    
        $('#error').empty();
        if ( self._timeout ) {
            window.clearTimeout(self._timeout);
        }
        self._timeout = setTimeout(function(){
            self._timeout = null;
            alert('No reply from the quizmaster - check that the quiz has started and try again!');
        }, 10*1000);
        
        self._client.publish('/quiz', {
            handle: self._handle, 
            name: self._name, 
            type: 'user'
        });
    },
  
    /**
     * Handler for received messages.
     */
    accept: function(message) {
        var self = this;
    
        if (message.type === 'next') {
            $('#buzz').removeAttr('disabled');
            $('#buzz').attr('src', 'button-red.png');
        } else if (message.type === 'userok' && message.handle === self._handle) {
            if (message.ok) {
                if ( self._timeout ) {
                    window.clearTimeout(self._timeout);
                }
                
                // Append user name to Post message label
                $('#messageLabel').html(html.escapeAttrib(self._handle));

                // Hide login form
                self._login.fadeOut('slow', function() {
                    // Preload the button disabled image
                    $('<img>').attr({ src: 'button-gray.png' }).load(function() {
                        // Show main application UI
                        self._app.fadeIn('slow', function() {
                            $('#message').focus();
                        });
                    });
                });
    
                self._post.submit(function() {
                    self._client.publish('/quiz', {user: self._handle, type: 'buzz'});
                    $('#buzz').attr('disabled', 'disabled');
                    $('#buzz').attr('src', 'button-gray.png');
                    return false;
                });
                
                $('#logout').click(function() {
                    $.cookie('handle', null);
                    $.cookie('name', null);
                    window.location.reload();
                });
            } else {
                alert(html.escapeAttrib(message.error));
            }
        }
    }
};

