(function(window) {
    var folioToDownload;

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

        $('#clear-log').on('click', clearLog);
        $('form').on('submit', login);
        $('form [type=submit]').on('click', login);
        $('#download').on('click', download);
        $('#magazine-info').on('click', prepareDownload);
        $('#print-log').on('click', dumpLog);
    }

    function clearLog(event) {
        event.preventDefault();
        $('#log').text('');
    }

    function download(event) {
        event.preventDefault();

        if (folioToDownload && folioToDownload.isDownloadable) {
            try {
                log('starting download');
                var transaction = folioToDownload.download();
                log('> Download Transaction id: ' + transaction.id);
                log('> step: ' + transaction.step);
                log('> state: ' + transaction.state);
                log('> progress: ' + transaction.progress);
                log('> error: ' + transaction.error);
                log('> isCancelable: ' + transaction.isCancelable);
                log('> isPausable: ' + transaction.isPausable);
                log('> isDeterminate: ' + transaction.isDeterminate);
                log('> isFailureTerminal: ' + transaction.isFailureTerminal);

                transaction.completedSignal.addOnce(function() {
                    log('download completed');
                });
                transaction.progressSignal.addOnce(function() {
                    log('download progress');
                });
                transaction.stateChangedSignal.addOnce(function() {
                    log('state changed of folio being downloaded');
                });
            } catch (error) {
                log(error);
            }
        }
    }

    function dumpLog(event) {
        event.preventDefault();

        var logLevel = _.reduce($('[name="logLevels[]"]').val(), function(memo, value) {
            return memo | adobeDPS.log.logLevels[value];
        }, 0);
        var logDump = adobeDPS.log.print(logLevel, true);
        var logEntries = logDump.split("\n");

        _.each(logEntries, function(value) {
            if (value !== '') {
                log(value);
            }
        });
    }

    function folios() {
        return adobeDPS.libraryService.folioMap.sort(function (a, b) {
            if(a.publicationDate < b.publicationDate) {
                return 1;
            } else if(a.publicationDate > b.publicationDate) {
                return -1;
            } else {
                return 0;
            }
        });
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
                log('COMPLETE SIGNAL: state = ' + transaction.state);
                if (transaction.state == adobeDPS.TransactionState.FAILED) {
                    log('FAILED');
                } else if (transaction.state == adobeDPS.TransactionState.FINISHED) {
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

    function prepareDownload(event) {
        event.preventDefault();
        if (!folioToDownload) {
            folioToDownload = folios()[0];

            folioToDownload.updatedSignal.add(function(properties) {
                log('updating ' + properties.length + ' properties');
                for (var i = 0; i < properties.length; i++) {
                    log('  > ' + properties[i] + ' to ' + this[properties[i]]);
                }
            }, folioToDownload);
        }

        log(folioToDownload.id);
        log('current transactions: ' + folioToDownload.currentTransactions.length);
        log('download size: ' + folioToDownload.downloadSize);
        log('state: ' + folioToDownload.state);
        log('preview image url: ' + folioToDownload.previewImageURL);
        log('title: ' + folioToDownload.title);
        log('isCompatible: ' + folioToDownload.isCompatible);
        log('isDownloadable: ' + folioToDownload.isDownloadable);
        log('isViewable: ' + folioToDownload.isViewable);
        log('isArchivable: ' + folioToDownload.isArchivable);
        log('isUpdatable: ' + folioToDownload.isUpdatable);
    }

    $(document).ready(function() {
        initialize();
    });
})(window);
