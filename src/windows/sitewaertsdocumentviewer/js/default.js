//// Copyright (c) Microsoft Corporation. All rights reserved

(function ()
{
    "use strict";

    WinJS.Namespace.define("Convert", {

        cssUrl: WinJS.Binding.converter(function (url)
        {

            return "url('" + url + "')";

        })

    });

    WinJS.Namespace.define("PdfShowcase", {
        loadedFile: null,
        zoomedInViewSource: null,
        zoomedOutViewSource: null,
        errorMessage: null,
        options: {}
    });


    var viewer;


    function setup()
    {

        // The following code provides mapping of items between zoomedIn and zoomedOut view
        window.zoomedInItem = window.zoomedOutItem = WinJS.UI.eventHandler(function (item)
        {
            var clone = Object.create(item);
            clone.groupIndexHint = clone.firstItemIndexHint = item.index;
            return clone;
        });

        WinJS.UI.processAll().done(function ()
        {
            PdfShowcase.options = getPDFViewerOptions();

            viewer = WinJS.Binding.as(PdfShowcase);

            initializeNavBar();

            initializeAppBar();

            initializeApp();

            // Initializing data share source event handler for sharing PDF file
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested",
                    eventHandlerShareItem);

        });
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
                // Initialize ZoomedInView control of Semantic Zoom
                initializeZoomedInView(pdfDocument);

                // Initialize ZoomedOutView control of Semantic Zoom
                initializeZoomedOutView(pdfDocument);
            }
        }, function error()
        {
            // Password protected file, user should provide a password to open the file
        });

    }

    function initializeZoomedInView(pdfDocument)
    {

        // Virtualized Data Source takes following arguments
        //  zoomedInListView:           element for zoomed out view
        //  pdfDocument:                PDF document returned by loadPDF
        //  pdfPageRenderingOptions:    null, will be initialized by Virtualized Data Source Constructor
        //  pageToLoad:                 number of pages to load on each request to Virtualized Data source itemFromIndex method
        //  inMemoryFlag:               false, all images are kept in memory
        //  temporary folder:           null, not required as inMemoryFlag is set to false

        if (viewer.zoomedInViewSource !== null)
        {

            // Unloading currently loaded PDF file
            viewer.zoomedInViewSource.unload();
        }

        var zoomedInListView = document.getElementById("zoomedInListView");

        // Initializing control
        zoomedInListView.winControl.itemDataSource = null;
        zoomedInListView.winControl.layout = new WinJS.UI.GridLayout();

        var options = {
            inMemoryFlag: true,
            tempFolder: null,
            pagesToLoad: 5,
            isIgnoringHighContrast: false,
            maxWidthFactor: 1,
            maxHeightFactor: 1,
            pdfViewTemplate: 'pdfSZViewTemplate'
        };


        var zoomedInViewSource = new PDF.dataAdapter.dataSource(
                zoomedInListView, pdfDocument, options);

        //  Setting data source for element
        zoomedInListView.winControl.itemDataSource = zoomedInViewSource;

        viewer.zoomedInViewSource = zoomedInViewSource;

    }

    function initializeZoomedOutView(pdfDocument)
    {

        if (viewer.zoomedOutViewSource !== null)
        {

            // Unloading currently loaded PDF file
            viewer.zoomedOutViewSource.unload();
        }

        WinJS.Application.local.folder.createFolderAsync("temp",
                        Windows.Storage.CreationCollisionOption.replaceExisting).done(function (tempFolder)
                {
                    // Virtualized Data Source takes following arguments
                    //  zoomedOutListView:          element for zoomed out view
                    //  pdfDocument:                PDF document returned by loadPDF
                    //  pdfPageRenderingOptions:    page rendering option with height set to 300px for Zoomed Out view
                    //  pageToLoad:                 number of pages to load on each request to Virtualized Data source itemFromIndex method
                    //  inMemoryFlag:               true,all the thumbnails generated will be placed on disk
                    //  temporary folder:           path on disk where these images will be kept

                    var zoomedOutListView = document.getElementById("zoomedOutListView");

                    // Initializing control
                    zoomedOutListView.winControl.itemDataSource = null;
                    zoomedOutListView.winControl.layout = new WinJS.UI.GridLayout();

                    var options = {
                        inMemoryFlag: false,
                        tempFolder: tempFolder,
                        pagesToLoad: 5,
                        isIgnoringHighContrast: false,
                        maxWidthFactor: 0.25,
                        maxHeightFactor: 0.2,
                        pdfViewTemplate: 'pdfViewTemplate'
                    };

                    var zoomedOutViewSource = new PDF.dataAdapter.dataSource(
                            zoomedOutListView, pdfDocument, options);

                    // Setting data source for element
                    zoomedOutListView.winControl.itemDataSource = zoomedOutViewSource;

                    viewer.zoomedOutViewSource = zoomedOutViewSource;
                });
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

        WinJS.Binding.processAll(mainNavBar, PdfShowcase);
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

    window.bgUrlBlobUriFromStream = WinJS.Binding.initializer(function (source, sourceProp, dest, destProp)
    {
        if (source[sourceProp] !== null)
        {
            var url = URL.createObjectURL(source[sourceProp],
                    { oneTimeOnly: true });
            applyProperty(dest, destProp, "url('" + url + "')");
        }
    });

})();

