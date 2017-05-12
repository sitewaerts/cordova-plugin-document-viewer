//  cordova-plugin-document-viewer
//
//  Created by Felix Schauerte 25.09.2014
//
//  Copyright 2015 sitewaerts GmbH. All rights reserved.
//  MIT Licensed

/*  configuration   */

var JS_HANDLE = "SitewaertsDocumentViewer";
var CDV_HANDLE = "SitewaertsDocumentViewer";

var CDV_HANDLE_ACTIONS = {

    GET_SUPPORT_INFO: "getSupportInfo",

    CAN_VIEW: "canViewDocument",

    VIEW_DOCUMENT: "viewDocument",

    CLOSE_DOCUMENT: "closeDocument",

    APP_PAUSED: "appPaused",

    APP_RESUMED: "appResumed",

    INSTALL_VIEWER_APP: "install"
};

var exec = require('cordova/exec');

/*  private functions (not accessible via plugin API) */

function getOptions(provided)
{
    var options = provided || {};

    if (!options.documentView)
        options.documentView = {};
    if (!options.documentView.closeLabel)
        options.documentView.closeLabel = "Done";


    if (!options.navigationView)
        options.navigationView = {};
    if (!options.navigationView.closeLabel)
        options.navigationView.closeLabel = "Back";


    if (!options.email)
        options.email = {};
    if (!options.email.enabled)
        options.email.enabled = false;


    if (!options.print)
        options.print = {};
    if (!options.print.enabled)
        options.print.enabled = false;


    if (!options.openWith)
        options.openWith = {};
    if (!options.openWith.enabled)
        options.openWith.enabled = false;


    if (!options.bookmarks)
        options.bookmarks = {};
    if (!options.bookmarks.enabled)
        options.bookmarks.enabled = false;


    if (!options.search)
        options.search = {};
    if (!options.search.enabled)
        options.search.enabled = false;

    if (!options.autoClose)
        options.autoClose = {onPause : false};

    if (!options.android)
        options.android = {};
    if (!options.android.viewerAppPackage)
        options.android.viewerAppPackage = 'de.sitewaerts.cleverdox.viewer';
    if (!options.android.viewerAppActivity)
        options.android.viewerAppActivity = 'DocumentViewerActivity';

    return options;
}

function installApp(options, onSuccess, onError)
{
    var errorPrefix = "Error in " + JS_HANDLE + ".installApp(): ";
    try
    {
        options = getOptions(options);
        exec(
                onSuccess,
                function (err)
                {
                    window.console.log(errorPrefix + JSON.stringify(err));
                    if (onError)
                        onError(err);
                },
                CDV_HANDLE,
                CDV_HANDLE_ACTIONS.INSTALL_VIEWER_APP,
                [
                    {options: options}
                ]
        );
    }
    catch (e)
    {
        window.console.log(errorPrefix + JSON.stringify(e));
        if (onError)
            onError(e);
    }
}

/*  public API of the plugin    */

var SitewaertsDocumentViewer = {

    getSupportInfo: function (onSuccess, onError)
    {
        var errorPrefix = "Error in " + JS_HANDLE + ".getSupportInfo(): ";
        try
        {
            exec(
                    function (result)
                    {
                        if (onSuccess)
                        {
                            window.console.log("support info is "
                                    + JSON.stringify(result));
                            onSuccess(result);
                        }
                    },
                    function (err)
                    {
                        window.console.log(errorPrefix, err);
                        if (onError)
                        {
                            onError(err);
                        }
                    },
                    CDV_HANDLE,
                    CDV_HANDLE_ACTIONS.GET_SUPPORT_INFO,
                    []
            );
        }
        catch (e)
        {
            window.console.log(errorPrefix + JSON.stringify(e));
            if (onError)
            {
                onError(e);
            }
        }

    },


    canViewDocument: function (url, contentType, options, onPossible, onMissingApp, onImpossible, onError)
    {
        var errorPrefix = "Error in " + JS_HANDLE + ".canViewDocument(): ";
        try
        {
            options = getOptions(options);

            exec(
                    function (result)
                    {
                        var status = result ? result.status : null;

                        if (status == 1)
                        {
                            if (onPossible)
                                onPossible();
                        }
                        else if (result.missingAppId != null)
                        {
                            if (onMissingApp)
                            {
                                var appId = result.missingAppId;
                                onMissingApp(appId,
                                        function (onSuccess, onError)
                                        {
                                            installApp(
                                                    options, onSuccess, onError
                                            );
                                        });
                            }
                        }
                        else
                        {
                            if (onImpossible)
                                onImpossible();
                        }
                    },
                    function (err)
                    {
                        window.console.log(errorPrefix, err);
                        if (onError)
                            onError(err);
                    },
                    CDV_HANDLE,
                    CDV_HANDLE_ACTIONS.CAN_VIEW,
                    [
                        {url: url, contentType: contentType, options: options}
                    ]
            );
        }
        catch (e)
        {
            window.console.log(errorPrefix, e);
            if (onError)
                onError(e);
        }
    },

    closeDocument: function () {
        exec(
            function () {
                window.console.log(JS_HANDLE + ": clsoing document frame with success");
            },
            function () {
                window.console.log(JS_HANDLE + ": clsoing document frame failed");
            },
             CDV_HANDLE,
             CDV_HANDLE_ACTIONS.CLOSE_DOCUMENT,
            []); 
    },

    viewDocument: function (url, contentType, options, onShow, onClose, onMissingApp, onError)
    {
        var errorPrefix = "Error in " + JS_HANDLE + ".viewDocument(): ";

        var _hideStatusBarOnClose = false;

        // only needed on iOS as I don't know how to listen for this event in native C code
        function _firePause(){
            exec(
                    function ()
                    {
                        window.console.log(JS_HANDLE + ": fired pause event to native plugin");
                    },
                    _logError,
                    CDV_HANDLE,
                    CDV_HANDLE_ACTIONS.APP_PAUSED,
                    []
            );
        }

        // only needed on iOS as I don't know how to listen for this event in native C code
        function _fireResume(){
            exec(
                    function ()
                    {
                        window.console.log(JS_HANDLE + ": fired resume event to native plugin");
                    },
                    _logError,
                    CDV_HANDLE,
                    CDV_HANDLE_ACTIONS.APP_RESUMED,
                    []
            );
        }

        function _beforeShow(next)
        {
            if (window.StatusBar && window.device
                    && window.device.platform.toLowerCase() == 'ios')
            {
                if (!window.StatusBar.isVisible)
                {
                    // show statusbar to avoid black bar on top of native document viewer screen
                    // should better be fixed in native ios code
                    window.StatusBar.show();
                    _hideStatusBarOnClose = true;
                }
            }
            if(next)
                next();
        }

        function _onShow(){

            document.addEventListener("pause", _firePause, false);
            document.addEventListener("resume", _fireResume, false);

            if (onShow)
                onShow();
        }

        function _beforeClose(next)
        {
            if (_hideStatusBarOnClose)
            {
                _hideStatusBarOnClose = false;
                window.StatusBar.hide();
            }

            document.removeEventListener("pause", _firePause);
            document.removeEventListener("resume", _fireResume);

            if(next)
                next();
        }

        function _onClose(){
            _beforeClose(onClose);
        }

        function _logError(e){
            window.console.error(errorPrefix, e);
        }

        function _onError(e)
        {
            _logError(e);
            _beforeClose(function ()
            {
                if (onError)
                    onError(e);
            });
        }


        try
        {
            options = getOptions(options);

            if (!options.title)
                options.title = url.split('/').pop(); // strip file name from url

            this.canViewDocument(
                    url,
                    contentType,
                    options,
                    function ()
                    {
                        _beforeShow(function ()
                        {
                            exec(
                                    function (result)
                                    {
                                        var status = result ? result.status : null;

                                        if (status == 1)
                                        {
                                            _onShow();
                                        }
                                        else if (status == 0)
                                        {
                                            _onClose();
                                        }
                                        else
                                        {
                                            var errorMsg =
                                                    "unknown state '" + status
                                                    + "'";
                                            window.console.error(
                                                    errorPrefix + errorMsg);
                                        }
                                    },
                                    _onError,
                                    CDV_HANDLE,
                                    CDV_HANDLE_ACTIONS.VIEW_DOCUMENT,
                                    [
                                        {
                                            url: url,
                                            contentType: contentType,
                                            options: options
                                        }
                                    ]
                            );
                        });
                    },
                    function (appId, installer)
                    {
                        _beforeClose(function ()
                        {
                            if (onMissingApp)
                                onMissingApp(appId, installer);
                            else
                                installer(function ()
                                {
                                    window.console.log(
                                            "App successfully installed");
                                }, _onError);
                        });
                    },
                    function ()
                    {
                        _onError("invalid file url '" + url
                                + "' or no viewer for mime type '" + contentType
                                + "'");
                    },
                    _onError
            );
        }
        catch (e)
        {
            _onError(e);
        }
    }
};

module.exports = SitewaertsDocumentViewer;

