var PDF = "application/pdf";

// this dir must be located in www
var viewerLocation = "sitewaertsdocumentviewer";

var Args = {
    URL: "url",
    CONTENT_TYPE: "contentType",
    OPTIONS: "options"
};



var viewerId = "sitewaertsdocumentviewer_windows";
var iframeId = viewerId + "_iframe";
var closeId = viewerId + "_close";


function _getContainer(create){

    var iframe = document.getElementById(iframeId);
    var viewer = document.getElementById(viewerId);
    var close =  document.getElementById(closeId);

    if(!iframe)
    {
        if(!create)
            return null;

        viewer = document.createElement("div");
        viewer.id = viewerId;
        viewer.className = "sitewaertsdocumentviewer windows";
        close = document.createElement("div");
        close.id = closeId;
        close.className = "close";
        iframe = document.createElement("iframe");
        iframe.id = iframeId;

        var body = document.getElementsByTagName("body")[0];
        viewer.appendChild(iframe);
        viewer.appendChild(close);
        body.appendChild(viewer);

        close.addEventListener("click", _doClose);
    }

    var _closeHandler;
    function _setCloseHandler(closeHandler){
       _closeHandler = closeHandler;
    }

    var _closeOnPause;
    function _setCloseOnPause(closeOnPause){
       _closeOnPause = closeOnPause === true;
    }

    /**
     * @void
     */
    function _cleanup()
    {
        iframe.src = "";
        viewer.style.display = 'none';
        _closeOnPause = null;
    }

    function _doClose(){
        _cleanup();
        if(_closeHandler)
            _closeHandler(); // closed
        _closeHandler = null;
    }

    function _showPDF(url, options, close){
        var w = iframe.window || iframe.contentWindow;
        w.showPDF(url, options, close);
        viewer.style.display = 'block';
    }

    function _appSuspend(){
        var w = iframe.window || iframe.contentWindow;
        if(w && w.appSuspend)
            w.appSuspend();
        if(_closeOnPause)
             _doClose();
    }

    function _appResume(){
        var w = iframe.window || iframe.contentWindow;
        if(w && w.appResume)
            w.appResume();
    }


    return {
        iframe : iframe,
        viewer : viewer,
        showPDF : _showPDF,
        close: _doClose,
        cleanup : _cleanup,
        appSuspend : _appSuspend,
        appResume: _appResume,
        setCloseHandler : _setCloseHandler,
        setCloseOnPause : _setCloseOnPause
    };
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
        function _no(message){
            return {
                status: 0,
                message : message,
                params : params
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
            errorCallback({status: 0, message: "illegal content type "
                    + contentType});
            return;
        }


        var options = params[Args.OPTIONS];

        var currentWindow = window;

        var c = _getContainer(true);
        c.setCloseHandler(function(){
            successCallback({status: 0}); // 0 = closed
        });

        c.setCloseOnPause(options && options.autoClose && options.autoClose.onPause);


        function doCloseAsync()
        {
            currentWindow.setTimeout(function ()
            {
                c.close();
            }, 100);
        }

        // sitewaertsdocumentviewer must be located in www
        c.iframe.src = "/www/" + viewerLocation + "/viewer.html";

        c.iframe.onload = function ()
        {
            // avoid reloading on close
            c.iframe.onload = null;
            try
            {
                c.showPDF(url, options, doCloseAsync);
                successCallback({status: 1}); // 1 = shown
            }
            catch(e)
            {
                c.cleanup();
                errorCallback({status: 0, message: "cannot init frame", error : e});
            }
        };

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
        var c = _getContainer(false);
        try
        {
            if(c)
                c.close();
            successCallback({status: 0}); // 1 = closed
        }
        catch(e)
        {
            c.cleanup();
            errorCallback({status: 0, message: "cannot close frame", error : e});
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
document.addEventListener("deviceready", function(){
    document.addEventListener("pause", function ()
    {
        var c = _getContainer(false);
        try
        {
            if(c)
                c.appSuspend();
        }
        catch(e)
        {
            window.console.error(e);
        }
    }, false);

    document.addEventListener("resume", function ()
    {
        var c = _getContainer(false);
        try
        {
            if(c)
                c.appResume();
        }
        catch(e)
        {
            window.console.error(e);
        }
    }, false);

}, false);

