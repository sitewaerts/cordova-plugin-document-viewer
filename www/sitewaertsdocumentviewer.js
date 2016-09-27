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
                        window.console.log(errorPrefix,  err);
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

    viewDocument: function (url, contentType, options, onShow, onClose, onMissingApp, onError)
    {
        var me = this;
        var errorPrefix = "Error in " + JS_HANDLE + ".viewDocument(): ";
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
                        exec(
                                function (result)
                                {
                                    var status = result ? result.status : null;

                                    if (status == 1)
                                    {
                                        if (onShow)
                                            onShow();
                                    }
                                    else if (status == 0)
                                    {
                                        if (onClose)
                                            onClose();
                                    }
                                    else
                                    {
                                        var errorMsg =
                                                "unknown state '" + status
                                                        + "'";
                                        window.console.log(
                                                errorPrefix + errorMsg);
                                    }
                                },
                                function (err)
                                {
                                    window.console.log(errorPrefix, err);
                                    if (onError)
                                        onError(err);
                                },
                                CDV_HANDLE,
                                CDV_HANDLE_ACTIONS.VIEW_DOCUMENT,
                                [
                                    {url: url, contentType: contentType, options: options}
                                ]
                        );
                    },
                    function (appId, installer)
                    {
                        if (onMissingApp)
                            onMissingApp(appId, installer);
                        else
                            installer(function ()
                            {
                                window.console.log("App successfully installed");
                            }, onError);
                    },
                    function ()
                    {
                        var errorMsg = "invalid file url '" + url + "' or no viewer for mime type '" + contentType + "'";
                        window.console.log(errorPrefix + errorMsg);
                        if (onError)
                            onError(errorMsg);
                    },
                    onError
            );


        }
        catch (e)
        {
            window.console.log(errorPrefix, e);
            if (onError)
                onError(e);
        }
    }
};

module.exports = SitewaertsDocumentViewer;

