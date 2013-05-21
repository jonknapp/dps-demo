(function(window) {
    function error(message) {
        log('<em>ERROR:</em> ' + message);
    }

    function log(message) {
        var now = new XDate();
        $('#log').prepend('<p><time datetime="' + now.toISOString() + '">' + now.toString('HH:mm:ss') + '</time>: ' + message + '</p>');
    }

    function initialize() {
        window.onerror = error;

        if ('adobeDPS' in window) {
            log('adobeDPS object found');
            adobeDPS.initializationComplete.addOnce(function() {
                log('adobe API initialized!');
            });
        } else {
            error('adobeDPS object not found');
        }

        $('form').on('submit', login);
        $('form [type=submit]').on('click', login);
    }

    function login(event) {
        event.preventDefault();

        logUserInfo();
        var email = $('#email').val();
        var password = $('#password').val();
        log('Attempting login with "' + email + '", "' + password + '"');

        try {
            var request = adobeDPS.authenticationService.login(email, password);

            request.stateChangedSignal.add(function(transaction) {
                log('STATE CHANGED');
            }, this);

            request.completedSignal.add(function(transaction) {
                log('COMPLETE SIGNAL');
                if (transaction.state == adobeDPS.TransactionState.FAILED) {
                    log('FAILED');
                } else if (transaction.state == adobeDPS.TransactionState.FINISHED){
                    log('COMPLETE!');
                    logUserInfo();
                }
            }, this);

            request.progressSignal.add(function(transaction) {
                log('PROGRESS SIGNAL');
            }, this);
        } catch (e) {
            error(e);
        }
    }

    function logUserInfo() {
        log('isUserAuthenticated: ' + ((adobeDPS.authenticationService.isUserAuthenticated) ? 'true' : 'false'));
        log('userName: ' + adobeDPS.authenticationService.userName);
        log('token: ' + adobeDPS.authenticationService.token);
    }

    $(document).ready(function() {
        initialize();
    });
})(window);
