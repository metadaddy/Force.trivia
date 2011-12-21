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
    init: function(client, id, questions) {
        var self = this;
        
        self._client = client;
        self._questions = questions;
        self._number = 0;
        self._question = true;
        self._quizId = id;
    
        self._post    = $('#postMessage');
        self._players = $('#players');
    	self._playing = $('#playing');
		self._nextp   = $('#nextp');
		self._page    = $('#one');
		self._prompt  = $('#prompt');
        self.launch();
    },
    
    setButtonText: function(elem, text) {
        // Handle jQuery Mobile 'fake' buttons
        if ( elem.hasClass('ui-btn-hidden')) {
            elem.prev('.ui-btn-inner').children('.ui-btn-text').html(text);                            
        } else {
            elem.attr('value', text);
        }
    },
  
    getQ: function(number) {
				var self = this;
				if (number == 0) {
					self._prompt.addClass("rollin");					
				} else {
					self._prompt.removeClass('rollin');
					self._prompt.addClass('hinge');
					setTimeout(function() {
						self._prompt.removeClass('hinge');
						self._prompt.html('<p>' + self._questions[number].Question__r.Question__c +
			            '</p><p></p>');
						self._prompt.addClass('rollin');
                        self.setButtonText($('#next'), 'Show Answer');
					}, 1200);
				}
       return '<p>' + self._questions[number].Question__r.Question__c +
            '</p><p></p>';
    },
  
    getQnA: function(number) {
        var self = this;
        return '<p>' + self._questions[number].Question__r.Question__c +
            '</p><p>A: ' + self._questions[number].Question__r.Answer__c + "</p>";
						
    },
    
    nextQuestion: function() {
        var self = this;
    
        // Reset clients, increment Q number, show next question etc
        self._number++;
        self._players.empty();
        if (self._number < self._questions.length) {
            self._client.publish('/quiz', {type: 'next'});
            self.getQ(self._number);
            self._question = true;                    
        } else {
            self._prompt.html('Results');
            $('#next').remove();
            // Send user record to db
            $.ajax({
                type: 'GET',
                url: '/highscores',
                dataType: 'json',
                data: { 
                    Quiz__c: self._quizId
                },
                success: function(data) {
                    console.log(data);
                    $.each(data.records, function(index, value) { 
                        self._players.append('<p>'+
                            html.escapeAttrib(value.Name)+' '+
                            value.Score__c+'</p>');                                    
                    });
                },
                error: function(jqXHR, textStatus) {
                    alert('Error getting high scores');
                }
            });                                            
        }        
    },
    
    /**
     * Starts the application after a username has been entered. A
     * subscription is made to receive all messages on the channel.
     */
    launch: function() {
        var self = this;
    
        // Subscribe to the chat channels
        var subscription = self._client.subscribe('/quiz', self.accept, self);

        // Reset state on all the clients
        self._client.publish('/quiz', {type: 'next'});

        // Show first question
        self._prompt.html(self.getQ(self._number));
  
        subscription.callback(function() {
            self._post.submit(function() {
                if (self._number < self._questions.length) {
                    if (self._question) {
                        self._prompt.html(self.getQnA(self._number));
                        self.setButtonText($('#next'), 'Next Question');
						self._page.attr("id", "two");
						self._page.attr("data-url", "two");
                        self._question = false;
						self._nextp.attr("href", "#two");
                    } else {
                        // Increment the score for the appropriate player
                        var player = $("input[@name='player']:checked").val();
                        if (player) {
                            // Increment player score
                            $.ajax({
                                type: 'POST',
                                url: '/incscore',
                                data: { 
                                    Name: player,
                                    Quiz__c: self._quizId
                                },
                                success: function(data) {
                                    self.nextQuestion();                                    
                                },
                                error: function(jqXHR, textStatus) {
                                    alert('Error incrementing score for '+player);
                                }
                            });                
                        } else {
                            self.nextQuestion();
                        }
                    }                    
                }
                return false;
            });
        });
    
        subscription.errback(function(error) {
            alert("Error subscribing: " + error.message);
        });
    },
    
    returnUserStatus: function(handle, status, error) {
        var self = this;
        
        self._client.publish('/quiz', {
            handle: handle, 
            type: 'userok',
            ok: status,
            error: error
        });
    },
  
    /**
     * Handler for received messages.
     */
    accept: function(message) {
        var self = this;
        
        if (message.type === 'buzz') {
			var now = new Date();
            self._players.append('<li class="ui-li ui-li-static ui-body-c"><input type="radio" name="player" value="'+
            html.escapeAttrib(message.user)+'"/>' + html.escapeAttrib(message.user) + ' (' + formatTime(now) + ')</li>');
        } else if (message.type === 'user') {
            // Send user record to db
            $.ajax({
                type: 'POST',
                url: '/player',
                data: { 
                    Name: message.handle,
                    Name__c: message.name,
                    Quiz__c: self._quizId
                },
                success: function(data) {
                    self.returnUserStatus(message.handle, true);
				    self._playing.append('<li class="ui-li ui-li-static ui-body-c">' + message.handle + "</li>");
                },
                error: function(jqXHR, textStatus) {
                    // jQuery doesn't parse the body in the event of an error
                    var result = JSON.parse(jqXHR.responseText);
                    if (result[0].errorCode == 'FIELD_CUSTOM_VALIDATION_EXCEPTION') {
                        // Don't care about duplicate users
                        self.returnUserStatus(message.handle, true);
                    } else {
                        // Something weird has happened!
                        self.returnUserStatus(message.handle, false, 
                            result[0].message);
                        alert('Error creating user: '+result[0].errorCode+
                            ' '+result[0].message);
                    }
                }
            });                
        }
    }
};
