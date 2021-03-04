var PDF = "application/pdf";

// this dir must be located in www
var viewerLocation = "sitewaertsdocumentviewer";

var viewerIFrameSrc = "/www/" + viewerLocation + "/viewer.html";

// avoid loading of apps index.html when source is set to ""
var emptyIFrameSrc = "/www/" + viewerLocation + "/empty.html";

// avoid app crash
var viewerCloseDelay = 15000;

var Args = {
    URL: "url",
    CONTENT_TYPE: "contentType",
    OPTIONS: "options"
};


var viewerIdBase = "sitewaertsdocumentviewer_windows";

/**
 * @typedef {Object} Container
 * @property {number} index
 * @property {HTMLIFrameElement} iframe
 * @property {HTMLElement} viewer,
 * @property {function(url:string, options:any, close:function())} showPDF,
 * @property {function(callback:function()):void} prepare,
 * @property {function():void} close,
 * @property {function():void} cleanup,
 * @property {function():void} appSuspend,
 * @property {function():void} appResume,
 * @property {function(closeHandler:function()):void} setCloseHandler,
 * @property {function(closeOnPause:boolean):void} setCloseOnPause
 */

/**
 *
 * @type {Array<Container | null>}
 */
var containers = [];


/**
 * @return {Container | null}
 * @private
 */
function _getCurrentContainer()
{
    if (containers.length === 0)
        return null;
    return containers[containers.length - 1];
}

/**
 * @param {number} index
 * @return {Container | null}
 * @private
 */
function _getContainer(index)
{
    return containers[index];
}

/**
 *
 * @return {Container}
 * @private
 */
function _createContainer()
{
    var viewerIndex = containers.length;
    var viewerId = viewerIdBase + "_" + viewerIndex;
    var iframeId = viewerId + "_iframe";
    var closeId = viewerId + "_close";

    /**
     * @type {HTMLElement}
     */
    var viewer = document.getElementById(viewerId) || document.createElement("div");

    // noinspection JSValidateTypes
    /**
     *
     * @type {HTMLIFrameElement}
     */
    var iframe = document.getElementById(iframeId) || document.createElement("iframe");

    /**
     * @type {HTMLElement}
     */
    var close = document.getElementById(closeId) || document.createElement("div");

    viewer.id = viewerId;
    viewer.className = "sitewaertsdocumentviewer windows";
    close.id = closeId;
    close.className = "close";
    iframe.id = iframeId;
    iframe.src = emptyIFrameSrc;

    viewer.appendChild(iframe);
    viewer.appendChild(close);
    document.body.appendChild(viewer);

    close.onclick = _doClose;

    var _closeHandler;

    /**
     *
     * @param {function():void} closeHandler
     * @private
     */
    function _setCloseHandler(closeHandler)
    {
        _closeHandler = closeHandler;
    }

    var _closeOnPause;

    /**
     * @param {boolean} closeOnPause
     * @private
     */
    function _setCloseOnPause(closeOnPause)
    {
        _closeOnPause = closeOnPause === true;
    }

    /**
     * @void
     * @private
     */
    function _cleanup()
    {
        _closeHandler = null;
        _closeOnPause = null;

        const v = viewer;
        viewer = null;

        if (v)
        {
            v.style.display = 'none';
            setTimeout(function ()
            {
                _destroy(v);
            }, viewerCloseDelay);
        }
        containers[viewerIndex] = null;
    }

    /**
     * @param {HTMLElement} viewer
     * @void
     * @private
     */
    function _destroy(viewer)
    {
        // iframe.src = emptyIFrameSrc;
        // viewer.style.display = 'none';
        if (viewer)
        {
            viewer.remove();
            viewer = null;
        }
    }

    /**
     * @void
     * @private
     */
    function _doClose()
    {
        var ch = _closeHandler;
        _cleanup();
        if (ch)
            ch(); // closed
    }

    /**
     * @param {function():void} callback
     * @void
     * @private
     */
    function _prepare(callback)
    {
        iframe.src = viewerIFrameSrc;
        iframe.onload = function ()
        {
            // avoid reloading on close
            iframe.onload = null;
            callback();
        }
    }

    /**
     * @param {string} url
     * @param {any} options
     * @param {function()} close
     * @void
     * @private
     */
    function _showPDF(url, options, close)
    {
        /**
         *
         * @type {Window}
         */
        var w = iframe['window'] || iframe.contentWindow;
        w.showPDF(url, options, close);
        viewer.style.display = 'block';
    }

    /**
     * @void
     * @private
     */
    function _appSuspend()
    {
        var w = iframe.window || iframe.contentWindow;
        if (w && w.appSuspend)
            w.appSuspend();
        if (_closeOnPause)
            _doClose();
    }

    /**
     * @void
     * @private
     */
    function _appResume()
    {
        var w = iframe.window || iframe.contentWindow;
        if (w && w.appResume)
            w.appResume();
    }


    /**
     *
     * @type {Container}
     */
    var container = {
        iframe: iframe,
        viewer: viewer,
        showPDF: _showPDF,
        prepare: _prepare,
        close: _doClose,
        cleanup: _cleanup,
        appSuspend: _appSuspend,
        appResume: _appResume,
        setCloseHandler: _setCloseHandler,
        setCloseOnPause: _setCloseOnPause
    };
    containers.push(container);
    return container;
}


//launching file in external app:
// see https://msdn.microsoft.com/en-us/library/windows/apps/hh452687.aspx

cordova.commandProxy.add("SitewaertsDocumentViewer", {
    getSupportInfo: function (successCallback, errorCallback)
    {
        successCallback({supported: [PDF]});
    },
    canViewDocument: function (successCallback, errorCallback, params)
    {
        function _no(message)
        {
            return {
                status: 0,
                message: message,
                params: params
            };
        }

        if (!params || params.length !== 1)
        {
            successCallback(_no("missing or invalid params"));
            return;
        }
        params = params[0];

        var url = params[Args.URL];
        if (!url || typeof url !== "string")
        {
            successCallback(_no("missing or invalid param " + Args.URL));
            return;
        }
        // TODO: check availability of url

        var contentType = params[Args.CONTENT_TYPE];
        if (contentType !== PDF)
        {
            successCallback(_no("missing or invalid param " + Args.CONTENT_TYPE));
            return;
        }

        successCallback({status: 1}); // YES
    },
    viewDocument: function (successCallback, errorCallback, params)
    {
        try
        {

            if (!params || params.length !== 1)
            {
                errorCallback({status: 0, message: "missing arguments"});
                return;
            }

            params = params[0];

            var url = params[Args.URL];
            if (!url || typeof url !== "string")
            {
                errorCallback({status: 0, message: "missing argument url"});
                return;
            }

            var contentType = params[Args.CONTENT_TYPE];
            if (contentType !== PDF)
            {
                errorCallback({
                    status: 0, message: "illegal content type "
                        + contentType
                });
                return;
            }


            var options = params[Args.OPTIONS];

            var c = _createContainer();
            c.setCloseHandler(function ()
            {
                successCallback({status: 0}); // 0 = closed
            });

            c.setCloseOnPause(options && options.autoClose && options.autoClose.onPause);


            function doCloseAsync()
            {
                if (c)
                    setTimeout(function ()
                    {
                        if (c)
                            c.close();
                        c = null;
                    }, 100);
            }


            c.prepare(function ()
            {
                try
                {
                    c.showPDF(url, options, doCloseAsync);
                    successCallback({status: 1}); // 1 = shown
                } catch (e)
                {
                    if (c)
                        c.cleanup();
                    c = null;
                    errorCallback({status: 0, message: "cannot init frame", error: e});
                }
            })

        } catch (e)
        {
            if (c)
                c.cleanup();
            c = null;
            errorCallback({status: 0, message: "cannot init frame", error: e});
        }
    },
    appPaused: function (successCallback, errorCallback)
    {
        // ignore
        // no need to handle external events as we have internal listeners for pause and resume
        successCallback();
    },
    appResumed: function (successCallback, errorCallback)
    {
        // ignore
        // no need to handle external events as we have internal listeners for pause and resume
        successCallback();
    },
    close: function (successCallback, errorCallback)
    {
        var c = _getCurrentContainer();
        try
        {
            if (c)
                c.close();
            successCallback({status: 0}); // 1 = closed
        } catch (e)
        {
            c.cleanup();
            errorCallback({status: 0, message: "cannot close frame", error: e});
        }
    },
    install: function (successCallback, errorCallback)
    {
        errorCallback("operation not supported");
    }
});

// listeners MUST be registered after deviceready event
// attention: windows app may be never suspended in debug mode!
// TODO: why are these events no fired in windows app even in release mode?
document.addEventListener("deviceready", function ()
{
    document.addEventListener("pause", function ()
    {
        var c = _getCurrentContainer();
        try
        {
            if (c)
                c.appSuspend();
        } catch (e)
        {
            window.console.error(e);
        }
    }, false);

    document.addEventListener("resume", function ()
    {
        var c = _getCurrentContainer();
        try
        {
            if (c)
                c.appResume();
        } catch (e)
        {
            window.console.error(e);
        }
    }, false);

}, false);

