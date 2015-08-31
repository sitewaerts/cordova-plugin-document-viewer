(function ()
{
    "use strict";

    WinJS.Namespace.define("Convert", {

        cssUrl: WinJS.Binding.converter(function (url)
        {

            return "url('" + url + "')";

        })

    });

    var View = WinJS.Class.define(
            function (name)
            {
                this.name = name;


                var that = this;


                this.groupInfo = function ()
                {
                    if (!that.dataSource)
                        return null;
                    return that.dataSource.getGroupInfo();
                };

                this.itemInfo = function (index)
                {
                    if (!that.dataSource)
                        return null;
                    return that.dataSource.getItemInfo(index);
                };


                WinJS.Utilities.markSupportedForProcessing(this.groupInfo);
                WinJS.Utilities.markSupportedForProcessing(this.itemInfo);
            },
            {
                dataSource: null
            });


    // The following code provides mapping of items between zoomedIn and zoomedOut view
    var zoomMapping = WinJS.UI.eventHandler(function (item)
    {
        var clone = Object.create(item);
        clone.groupIndexHint = clone.firstItemIndexHint = item.index;
        return clone;
    });


    WinJS.Namespace.define("PDFViewer", {
        loadedFile: null,
        errorMessage: null,
        title: null,
        options: {},
        zoomedInItem: zoomMapping,
        zoomedOutItem: zoomMapping,
        fullScreenView: WinJS.Binding.as(new View("fullScreen")),
        thumbnailView: WinJS.Binding.as(new View("thumbnail"))
    });

    var viewer = WinJS.Binding.as(PDFViewer);

    // publish these objects to the page for data-win-bind
    var pageModel = WinJS.Binding.as(
            {PDFViewer: viewer}
    );

    WinJS.Application.onerror = function (eventInfo)
    {
        window.console.error('WinJS.Application.onerror :', eventInfo);

        var detail = eventInfo.detail;
        var dialog = new Windows.UI.Popups.MessageDialog(
                detail.stack, detail.message);
        dialog.showAsync().done();

        // By returning true, we signal that the exception was handled,
        // preventing the application from being terminated
        return true;
    };


    function setup()
    {

        function init()
        {
            viewer.options = getPDFViewerOptions();
            viewer.title = viewer.options ? viewer.options.title : null;


            initializeNavBar();

            initializeAppBar();

            initializeApp();

            // Initializing data share source event handler for sharing PDF file
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested",
                    eventHandlerShareItem);

        }

        WinJS.UI.processAll().done(function ()
        {
            _processBinding(init);
        });
    }

    function _processBinding(done)
    {
        WinJS.Binding.processAll(null, pageModel).done(done);
    }


    var options;

    function getPDFViewerOptions()
    {
        return options;
    }

    var close;

    function closePDFViewer()
    {
        return close();
    }

    var uri;

    function getPDFUri()
    {
        return uri;
    }

    window.showPDF = function (pdfUri, pdfOptions, closeHandler)
    {
        uri = pdfUri;
        options = pdfOptions;
        close = closeHandler;
        setup();
    };

    function initializeApp()
    {

        // Loading file from assets
        var fileUri = getPDFUri();

        //var fileUri ="assets\\Sample.pdf";

        if (!fileUri)
        {
            viewer.errorMessage = "no file specified";
            return;
        }

        // remove double slashes
        fileUri = fileUri.replace(/([^\/:])\/\/([^\/])/g, '$1/$2');

        var uri = new Windows.Foundation.Uri(fileUri);
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(
                function (file)
                {
                    // Updating details of file currently loaded
                    viewer.loadedFile = file;
                    // Loading PDF file and trigger load of pages
                    loadPDF(file);
                }
        );

    }

    function loadPDF(file)
    {

        // Loading PDf file from the assets
        pdfLibrary.loadPDF(file).done(function (pdfDocument)
        {
            if (pdfDocument !== null)
            {
                initializeViews(pdfDocument);
            }
        }, function error()
        {
            // Password protected file, user should provide a password to open the file
        });

    }

    function initializeViews(pdfDocument)
    {
        //initialize views for semantic zoom

        initializeFullScreenView(pdfDocument);
        initializeThumbnailsView(pdfDocument);
    }

    function initializeFullScreenView(pdfDocument)
    {
        // fullscreen view
        initializeView(
                viewer.fullScreenView,
                "zoomedInListView",
                pdfDocument,
                {
                    rows: 1,
                    inMemory: true,
                    pagesToLoad: 5
                }
        );

    }

    function initializeThumbnailsView(pdfDocument)
    {
        // thumbnail view
        initializeView(
                viewer.thumbnailView,
                "zoomedOutListView",
                pdfDocument,
                {
                    rows: 4,
                    inMemory: false,
                    pagesToLoad: 5
                }
        );
    }

    function initializeView(view, viewNodeId, pdfDocument, options)
    {

        if (view.dataSource !== null)
        {
            // Unloading currently loaded PDF file
            view.dataSource.unload();
            view.dataSource = null;
        }

        if (options.inMemory == true)
        {
            init(null);
        }
        else
        {
            WinJS.Application.temp.folder.createFolderAsync(
                            "pdfViewer",
                            Windows.Storage.CreationCollisionOption.replaceExisting
                    ).done(function (tempFolder)
                    {
                        init(tempFolder);
                    });
        }

        function init(tempFolder)
        {
            var viewNode = document.getElementById(viewNodeId);
            var winControl = viewNode.winControl;
            // Initializing control
            //winControl.itemDataSource = null;
            //viewNode.winControl.layout = new WinJS.UI.GridLayout();

            var _options = {
                inMemoryFlag: tempFolder == null,
                tempFolder: tempFolder,
                pagesToLoad: options.pagesToLoad,
                isIgnoringHighContrast: false,
                rows: options.rows,
                containerMargin: 5 // 5px is windows default
            };

            view.dataSource = new PDF.dataAdapter.dataSource(
                    winControl, pdfDocument, _options);

            //WinJS.UI.processAll();

            //_processBinding();

            // Setting data source for element
            //winControl.itemDataSource = view.dataSource;
        }
    }

    function eventHandlerShareItem(e)
    {
        if (viewer.options.sharingEnabled == true && viewer.loadedFile !== null)
        {
            var request = e.request;
            request.data.properties.title = "Sharing File";
            request.data.properties.description = viewer.loadedFile.name;
            request.data.setStorageItems([viewer.loadedFile]);
        }
    }


// This function initializes nav bar and its options
    function initializeNavBar()
    {

        // Add event listeners to handle click of Open option in command bar
        var mainNavBar = document.getElementById("mainNavBar");
        if (!mainNavBar)
            return;

        // Add event listeners to handle click of Open option in command bar
        var close = document.getElementById("close");
        if (!close)
            return;

        close.addEventListener("click", closeClick, false);
    }

    function closeClick()
    {
        closePDFViewer();
    }

// This function initializes app bar and its options
    function initializeAppBar()
    {

        // Add event listeners to handle click of Open option in command bar
        var open = document.getElementById("open");
        if (!open)
            return;

        open.addEventListener("click", openClick, false);
    }

    function openClick()
    {

        // Launching file picker to pick PDF file for load
        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll([".pdf"]);
        picker.pickSingleFileAsync().done(function (file)
        {
            if (file !== null)
            {
                // Checking if file is already loaded
                if (viewer.loadedFile.path !== file.path)
                {

                    // Updating details of loaded file
                    viewer.loadedFile = file;

                    // Loading file selected through file picker
                    loadPDF(file);
                }
            }
        });
    }

    function applyProperty(dest, destProp, value)
    {
        if (Array.isArray(destProp))
        {
            for (var i = 0; i < destProp.length - 1; i++)
            {
                if (dest == null)
                    break;
                dest = dest[destProp[i]];
            }

            if (dest)
                dest[destProp[destProp.length - 1]] = value;

        }
        else
            dest[destProp] = value;
    }

    window.blobUriFromStream = WinJS.Binding.initializer(function (source, sourceProp, dest, destProp)
    {
        if (source[sourceProp] !== null)
        {
            var url = URL.createObjectURL(source[sourceProp],
                    { oneTimeOnly: true });
            applyProperty(dest, destProp, url);
        }
    });

    window.cssUrlBlobUriFromStream = WinJS.Binding.initializer(function (source, sourceProp, dest, destProp)
    {
        if (source[sourceProp] !== null)
        {
            var url = URL.createObjectURL(source[sourceProp],
                    { oneTimeOnly: true });
            applyProperty(dest, destProp, "url('" + url + "')");
        }
    });

})();

