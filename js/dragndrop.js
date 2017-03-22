var hookWindow = false;

(function (interact) {
    'use strict';

    // Prevent closing window
    window.onbeforeunload = function() {
        if (hookWindow) {
            return 'Do you want to leave this page? Your progress will not be saved.';
        }
    }

    // URL parameters (id & gender)
    var userId, gender;
    var parameters = window.location.search.substring(1);
    if (parameters.length > 0) {
        var stuff = parameters.split(/[&=]/);
        userId = stuff[1];
        gender = stuff[3];
    }
    var experimentId = Date.now();

    // images
    var imgNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    // shuffle image names
    for (var i = imgNames.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = imgNames[i];
        imgNames[i] = imgNames[j];
        imgNames[j] = temp;
    }
    // append images to DOM
    var marginTop = 20;
    var marginLeft = Math.round(1.02 * document.documentElement.clientHeight);  // px value of 102vh
    for (var i = 0; i < 3; ++i) {
        for (var j = 0; j < 3; ++j) {
            $('#images').append($('<img>', {
                src: 'img/' + gender + imgNames[i*3+j] + '.jpg',
                class: 'draggable js-drag shadow',
                style: 'margin-left:' + marginLeft.toString() + 'px; margin-top:' + marginTop.toString() + 'px;',
                height: '100px',
                width: '100px',
            }));
            marginLeft += 105;
        }
        marginTop += 105;
        marginLeft = Math.round(1.02 * document.documentElement.clientHeight);
    }

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCv41O7LrglT7ErDtB9itFt5KG5EtyKLfE",
        authDomain: "hierarchy-351e6.firebaseapp.com",
        databaseURL: "https://hierarchy-351e6.firebaseio.com",
        storageBucket: "hierarchy-351e6.appspot.com",
        messagingSenderId: "202596010925"
    };
    firebase.initializeApp(config);
    // Sign in
    // firebase.auth().signInAnonymously().then(function(user) {
    //     var firebaseUid = user.uid;
    //     console.log('Signed in as ' + firebaseUid);

    //     firebase.database().ref('/' + userId + '/' + experimentId).set({
    //         firebase_uid: firebaseUid,
    //         start_time: (new Date()).toUTCString(),
    //         gender: gender,
    //         image_order: imgNames
    //     });
    // });

    // submit button
    $('#submit').click(function() {
        var path = '/' + userId + '/' + experimentId;
        var update = {};
        update[path + '/duration'] = (Date.now() - experimentId) / 1000;  // in sec
        update[path + '/end_time'] = (new Date()).toUTCString();
        // update[path + '/data'] = ;

        firebase.database().ref().update(update).then(function() {
            hookWindow = false;
            firebase.auth().currentUser.delete();
        });
    });

    // interactive.js setup
    var transformProp;
    interact.maxInteractions(Infinity);

    // setup draggable elements
    interact('.js-drag')
        .draggable({ max: Infinity })
        .on('dragstart', function (event) {
            event.interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
            event.interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
        })
        .on('dragmove', function (event) {
            event.interaction.x += event.dx;
            event.interaction.y += event.dy;

            if (transformProp) {
                event.target.style[transformProp] =
                    'translate(' + event.interaction.x + 'px, ' + event.interaction.y + 'px)';
            }
            else {
                event.target.style.left = event.interaction.x + 'px';
                event.target.style.top  = event.interaction.y + 'px';
            }
        })
        .on('dragend', function (event) {
            event.target.setAttribute('data-x', event.interaction.x);
            event.target.setAttribute('data-y', event.interaction.y);
        });

    // setup drop areas.
    // dropzone accepts every draggable
    setupDropzone('#drop', '.js-drag');

    /**
     * Setup a given element as a dropzone.
     *
     * @param {HTMLElement|String} el
     * @param {String} accept
     */
    function setupDropzone(el, accept) {
        interact(el)
            .dropzone({
                accept: accept,
                ondropactivate: function (event) {
                    addClass(event.relatedTarget, '-drop-possible');
                },
                ondropdeactivate: function (event) {
                    removeClass(event.relatedTarget, '-drop-possible');
                }
            })
            .on('dropactivate', function (event) {
                var active = event.target.getAttribute('active')|0;

                // change style if it was previously not active
                if (active === 0) {
                    addClass(event.target, '-drop-possible');
                    // event.target.textContent = 'Drop image here';
                }

                event.target.setAttribute('active', active + 1);
            })
            .on('dropdeactivate', function (event) {
                var active = event.target.getAttribute('active')|0;

                // change style if it was previously active
                // but will no longer be active
                if (active === 1) {
                    removeClass(event.target, '-drop-possible');
                    // event.target.textContent = 'Arrange images here';
                }

                event.target.setAttribute('active', active - 1);
            })
            .on('dragenter', function (event) {
                addClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'I\'m in';
            })
            .on('dragleave', function (event) {
                removeClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'Drag me…';
            })
            .on('drop', function (event) {
                removeClass(event.target, '-drop-over');
                event.relatedTarget.textContent = 'Dropped';
            });
    }

    function addClass (element, className) {
        if (element.classList) {
            return element.classList.add(className);
        }
        else {
            element.className += ' ' + className;
        }
    }

    function removeClass (element, className) {
        if (element.classList) {
            return element.classList.remove(className);
        }
        else {
            element.className = element.className.replace(new RegExp(className + ' *', 'g'), '');
        }
    }

    interact(document).on('ready', function () {
        transformProp = 'transform' in document.body.style
            ? 'transform': 'webkitTransform' in document.body.style
            ? 'webkitTransform': 'mozTransform' in document.body.style
            ? 'mozTransform': 'oTransform' in document.body.style
            ? 'oTransform': 'msTransform' in document.body.style
            ? 'msTransform': null;
    });

    hookWindow = true;

}(window.interact));
