
var PDF = "application/pdf";

var Args = {
    URL : "url",
    CONTENT_TYPE : "contentType",
    OPTIONS : "options"
};


cordova.commandProxy.add("SitewaertsDocumentViewer", {
    getSupportInfo: function (successCallback, errorCallback)
    {
        successCallback({supported: [PDF]});
    },
    canViewDocument: function (successCallback, errorCallback, params)
    {
        var no = {status:0};

        if (!params || params.length != 1)
        {
            successCallback(no);
            return;
        }
        params = params[0];

        var url = params[Args.URL];
        if(!url)
        {
            successCallback(no);
            return;
        }

        var contentType = params[Args.CONTENT_TYPE];
        if(contentType != PDF)
        {
            successCallback(no);
            return;
        }

        // TODO: check availability of url

        successCallback({status:1}); // YES
    },
    viewDocument: function (successCallback, errorCallback, params)
    {
        if (!params|| params.length != 1)
        {
            errorCallback({status:0, message: "missing arguments"});
            return;
        }

        params = params[0];

        var url = params[Args.URL];
        if(!url)
        {
            errorCallback({status:0, message: "missing argument url"});
            return;
        }

        var contentType = params[Args.CONTENT_TYPE];
        if(contentType != PDF)
        {
            errorCallback({status:0, message: "illegal content type " + contentType});
            return;
        }



        var viewer = document.createElement("div");
        viewer.className="sitewaertsdocumentviewer windows";
        var close = document.createElement("div");
        close.className="close";
        var iframe = document.createElement("iframe");

        // current page must be located in www
        // pdfjs must be located in www
        iframe.src = "/www/pdfjs/web/viewer.html?file="+encodeURIComponent(url);
        var body = document.getElementsByTagName("body")[0];
        viewer.appendChild(iframe);
        viewer.appendChild(close);
        body.appendChild(viewer);

        /**
         * @void
         */
        function doClose()
        {
            iframe.src = "";
            close.removeEventListener("click", doClose);
            body.removeChild(viewer);
            successCallback({status:0}); // closed
        }
        close.addEventListener("click", doClose);

//        var viewer = document.createElement("div");
//        viewer.className="sitewaertsdocumentviewer";
//        var close = document.createElement("div");
//        close.className="close";
//        close.addEventListener("onclick", doClose);
//        var iframe = document.createElement("iframe");
//        iframe.src = url;
//        var body = document.getElementsByTagName("body")[0];
//        viewer.appendChild(iframe);
//        viewer.appendChild(close);
//        body.appendChild(viewer);
//
        successCallback({status:1}); // shown

    },
    install : function (successCallback, errorCallback)
    {
        errorCallback("operation not supported");
    }
});
