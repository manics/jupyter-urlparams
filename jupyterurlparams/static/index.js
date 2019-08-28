require([
    'jquery',
    'base/js/utils',
    'components/xterm.js/index',
    'components/xterm.js-fit/index'
], function(
    $,
    utils,
    Terminal,
    fit
) {

    Terminal.applyAddon(fit);

    function GitSync(baseUrl, paramsfile, params, path) {
        // Class that talks to the API backend & emits events as appropriate
        this.baseUrl = baseUrl;
        this.paramsfile = paramsfile;
        this.params = params;
        this.redirectUrl = baseUrl + path;

        this.callbacks = {};
    }

    GitSync.prototype.addHandler = function(event, cb) {
        if (this.callbacks[event] == undefined) {
            this.callbacks[event] = [cb];
        } else {
            this.callbacks[event].push(cb);
        }
    };

    GitSync.prototype._emit = function(event, data) {
        if (this.callbacks[event] == undefined) { return; }
        $.each(this.callbacks[event], function(i, ev) {
            ev(data);
        });
    };


    GitSync.prototype.start = function() {
        // Start git pulling handled by SyncHandler, declared in handlers.py
        var syncUrlParams = {
            paramsfile: this.paramsfile,
            params: this.params
        }
        var syncUrl = this.baseUrl + 'urlparams/api?' + $.param(syncUrlParams);

        this.eventSource = new EventSource(syncUrl);
        var that = this;
        this.eventSource.addEventListener('message', function(ev) {
            var data = JSON.parse(ev.data);
            if (data.phase == 'finished' || data.phase == 'error') {
                that.eventSource.close();
            }
            that._emit(data.phase, data);
        });
        this.eventSource.addEventListener('error', function(error) {
            console.log(arguments);
            that._emit('error', error);
        });
    };

    function GitSyncView(termSelector, progressSelector, termToggleSelector) {
        // Class that encapsulates view rendering as much as possible
        this.term = new Terminal({
            convertEol: true
        });
        this.visible = false;
        this.term.open($(termSelector)[0]);
        this.$progress = $(progressSelector);

        this.$termToggle = $(termToggleSelector);
        this.termSelector = termSelector;

        var that = this;
        this.$termToggle.click(function() {
            that.setTerminalVisibility(!that.visible);
        });
    }

    GitSyncView.prototype.setTerminalVisibility = function(visible) {
        if (visible) {
            $(this.termSelector).parent().removeClass('hidden');
        } else {
            $(this.termSelector).parent().addClass('hidden');
        }
        this.visible = visible;
        this._fitTerm();
    }

    GitSyncView.prototype.setProgressValue = function(val) {
        this.$progress.attr('aria-valuenow', val);
        this.$progress.css('width', val + '%');
    };

    GitSyncView.prototype.getProgressValue = function() {
        return parseFloat(this.$progress.attr('aria-valuenow'));
    };

    GitSyncView.prototype.setProgressText = function(text) {
        this.$progress.children('span').text(text);
    };

    GitSyncView.prototype.getProgressText = function() {
        return this.$progress.children('span').text();
    };

    GitSyncView.prototype.setProgressError = function(isError) {
        if (isError) {
            this.$progress.addClass('progress-bar-danger');
        } else {
            this.$progress.removeClass('progress-bar-danger');
        }
    };

    GitSyncView.prototype._fitTerm = function() {
        // Vendored in from the xterm.js fit addon
        // Because I can't for the life of me get the addon to be
        // actually included here as an require.js thing.
        // And life is too short.
        var term = this.term;
        if (!term.element.parentElement) {
            return null;
        }
        var parentElementStyle = window.getComputedStyle(term.element.parentElement),
            parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height')),
            parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')) - 17),
            elementStyle = window.getComputedStyle(term.element),
            elementPaddingVer = parseInt(elementStyle.getPropertyValue('padding-top')) + parseInt(elementStyle.getPropertyValue('padding-bottom')),
            elementPaddingHor = parseInt(elementStyle.getPropertyValue('padding-right')) + parseInt(elementStyle.getPropertyValue('padding-left')),
            availableHeight = parentElementHeight - elementPaddingVer,
            availableWidth = parentElementWidth - elementPaddingHor,
            container = term.rowContainer,
            subjectRow = term.rowContainer.firstElementChild,
            contentBuffer = subjectRow.innerHTML,
            characterHeight,
            rows,
            characterWidth,
            cols,
            geometry;

        subjectRow.style.display = 'inline';
        subjectRow.innerHTML = 'W'; // Common character for measuring width, although on monospace
        characterWidth = subjectRow.getBoundingClientRect().width;
        subjectRow.style.display = ''; // Revert style before calculating height, since they differ.
        characterHeight = subjectRow.getBoundingClientRect().height;
        subjectRow.innerHTML = contentBuffer;

        rows = parseInt(availableHeight / characterHeight);
        cols = parseInt(availableWidth / characterWidth);

        term.resize(cols, rows);
    };

    var gs = new GitSync(
        utils.get_body_data('baseUrl'),
        utils.get_body_data('paramsfile'),
        utils.get_body_data('params'),
        utils.get_body_data('path')
    );

    var gsv = new GitSyncView(
        '#status-details',
        '#status-panel-title',
        '#status-panel-toggle'
    );

    gs.addHandler('finished', function(data) {
        // progressTimers.forEach(function(timer)  { clearInterval(timer); });
        gsv.setProgressValue(100);
        gsv.setProgressText('Sync finished, redirecting...');
        window.location.href = gs.redirectUrl;
    });
    gs.addHandler('error', function(data) {
        // progressTimers.forEach(function(timer)  { clearInterval(timer); });
        gsv.setProgressValue(100);
        gsv.setProgressText('Error: ' + data.message);
        gsv.setProgressError(true);
        gsv.setTerminalVisibility(true);
        if (data.output) {
            gsv.term.write(data.output);
        }
    });
    gs.start();

    $('#header, #site').show();
});
