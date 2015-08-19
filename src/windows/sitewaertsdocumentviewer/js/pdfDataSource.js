//// Copyright (c) Microsoft Corporation. All rights reserved

(function ()
{

    WinJS.Namespace.define("PDF", {
        dataAdapter: WinJS.Class.define(function (element, pdfDocument, options)
                {
                    if ((pdfDocument === null) || (element === null))
                    {
                        throw "Invalid data";
                    }

                    this._pdfPageRenderingOptions = [];

                    this._element = element;
                    this._pdfDocument = pdfDocument;
                    this._options = options; // TODO: extend default with given options

                    // Initialize this data source
                    this._initialize();
                },
// Private members
                {
                    _dataArray: null,               // This object stores the URL's for the pages rendered using PDF API's
                    _pdfDocument: null,             // Object returned by loadPDF
                    _pageCount: 0,                  // Number of pages in a given PDF file
                    _options: {
                        inMemoryFlag: false,
                        tempFolder: null,
                        pagesToLoad: 5,
                        isIgnoringHighContrast: false,                          // High contrast will be honored by PDF API
                        maxWidthFactor: 1,
                        maxHeightFactor: 1
                    },
                    _viewInfo: null,

                    // Private member functions
                    _initialize: function ()
                    {
                        var that = this;

                        this._refresher = null;

                        this._dataArray = [];

                        // Array to maintain asynchronous requests created
                        this._promiseArray = [];

                        // Setting page count
                        this._pageCount = this._pdfDocument.pageCount;


                        this._refresh = function ()
                        {
                            if (that._refresher)
                                return that._refresher();
                            return null;
                        };

                        var onSizeChange = function ()
                        {
                            that._refresh();
                        };

                        window.addEventListener("resize", onSizeChange, false);

                        // Initialize data source with placeholder objects
                        this._initializeDataArray();

                        this._calcAllPDFOptions();

                    },

                    _calcPDFOptions: function (viewInfo, pdfPage)
                    {
                        var viewWidth = viewInfo.viewWidth;
                        var viewHeight = viewInfo.viewHeight;

                        var index = pdfPage.index;

                        var devicePixelRatio = window.devicePixelRatio;

                        if (!this._pdfPageRenderingOptions[index])
                        {
                            this._pdfPageRenderingOptions[index]
                                    = new Windows.Data.Pdf.PdfPageRenderOptions();
                        }

                        var pdfOptions = this._pdfPageRenderingOptions[index];

                        pdfOptions.isIgnoringHighContrast = this._options.isIgnoringHighContrast;

                        var containerWidth = Math.floor(viewWidth
                                * this._options.maxWidthFactor);
                        var containerHeight = Math.floor(viewHeight
                                * this._options.maxHeightFactor);

                        var pageDimRelation = pdfPage.size.width
                                / pdfPage.size.height;

                        var pageHeight = containerHeight;
                        var pageWidth = Math.floor((pageHeight
                                * pageDimRelation));
                        if (pageWidth > containerWidth)
                        {
                            pageWidth = containerWidth;
                            pageHeight = Math.floor((pageWidth
                                    / pageDimRelation));
                        }

                        var data = this._dataArray[index];
                        data.width = pageWidth;
                        data.height = pageHeight;
                        data.widthPx = pageWidth + "px";
                        data.heightPx = pageHeight + "px";
                        data.maxWidthPx = containerWidth + "px";
                        data.maxHeightPx = containerHeight + "px";

                        var destinationWidth = Math.floor(pageWidth
                                * devicePixelRatio);
                        if (pdfOptions.destinationWidth != destinationWidth)
                        {
                            pdfOptions.destinationWidth = destinationWidth;
                            data.imageSrc = ""; // reset
                        }

                        var destinationHeight = Math.floor(pageHeight
                                * devicePixelRatio);
                        if (pdfOptions.destinationHeight != destinationHeight)
                        {
                            pdfOptions.destinationHeight = destinationHeight;
                            data.imageSrc = ""; // reset
                        }
                    },

                    _getViewInfo: function ()
                    {
                        return {
                            viewWidth: window.outerWidth,
                            viewHeight: window.outerHeight
                        };
                    },

                    _updateViewInfo: function ()
                    {
                        var newViewInfo = this._getViewInfo();

                        if (!this._viewInfo)
                        {
                            this._viewInfo = newViewInfo;
                        }
                        else
                        {
                            this._viewInfo.viewWidth = newViewInfo.viewWidth;
                            this._viewInfo.viewHeight = newViewInfo.viewHeight;
                        }
                        return this._viewInfo;
                    },

                    _clearViewInfo: function ()
                    {
                        this._viewInfo = null;
                    },

                    _isViewInfoChanged: function ()
                    {
                        if (!this._viewInfo)
                            return true;

                        var newViewInfo = this._getViewInfo();

                        return (newViewInfo.viewWidth
                                != this._viewInfo.viewHeight
                                || newViewInfo.viewHeight
                                != this._viewInfo.viewHeight);
                    },

                    _clearAllPDFOptions: function ()
                    {
                        this._pdfPageRenderingOptions = [];
                    },

                    _calcAllPDFOptions: function ()
                    {
                        var that = this;

                        var viewInfo = this._updateViewInfo();
                        for (var count = 0, pageCount = that._pageCount;
                             count < pageCount; count++)
                        {
                            that._calcPDFOptions(viewInfo,
                                    that._pdfDocument.getPage(count));
                        }
                    },

                    _refreshAllPDFOptions: function ()
                    {
                        if (!this._isViewInfoChanged())
                            return;
                        this._calcAllPDFOptions();
                    },

                    // This method initializes the _dataArray
                    _initializeDataArray: function ()
                    {
                        var that = this;
                        that._dataArray = [];
                        for (var count = 0, len = that._pageCount; count < len;
                             count++)
                        {
                            that._dataArray.push({ pageIndex: count, imageSrc: "", width: 0, height: 0, widthPx: '0px', heightPx: '0px', maxWidthPx: '0px', maxHeightPx: '0px' });
                        }
                    },

                    // This method invokes PDF API's to get the required pages from the PDF file
                    //   startIndex:    start page index
                    //   endIndex:      end page index
                    //   It returns a promise which is completed when loadPages is completed
                    _loadPages: function (startIndex, endIndex)
                    {
                        var that = this;

                        that._refreshAllPDFOptions();

                        startIndex = Math.max(0, startIndex);
                        endIndex = Math.min(that._pageCount, endIndex);

                        var promise = that.loadPages(startIndex, endIndex,
                                        this._pdfDocument,
                                        this._pdfPageRenderingOptions,
                                        this._options.inMemoryFlag,
                                        this._options.tempFolder).then(function (pageDataArray)
                                {
                                    for (var i = 0, len = pageDataArray.length;
                                         i < len;
                                         i++)
                                    {
                                        var index = pageDataArray[i].pageIndex;
                                        that._dataArray[index].imageSrc = pageDataArray[i].imageSrc;
                                    }

                                });

                        that._promiseArray.push(promise);

                        return promise;
                    },

                    setRefresher: function (func)
                    {
                        this._refresher = func;
                    },

                    // This method is invoked to unload currently loaded PDF file
                    unload: function ()
                    {
                        // Cancelling all promises
                        for (var i = 0, len = this._promiseArray.length;
                             i < len; i++)
                        {

                            this._promiseArray[i].cancel();
                        }

                        this._promiseArray = null;

                        this._dataArray = null;

                        this._clearViewInfo();
                        this._clearAllPDFOptions();
                    },

                    // Called to get a count of the items
                    // The value of the count can be updated later in the response to itemsFromIndex
                    getCount: function ()
                    {
                        var that = this;
                        return WinJS.Promise.wrap(that._pageCount);
                    },

                    // Called by the virtualized data source to fetch items
                    // It will request a specific item and optionally ask for a number of items on either side of the requested item.
                    // The implementation should return the specific item and, in addition, can choose to return a range of items on either
                    // side of the requested index. The number of extra items returned by the implementation can be more or less than the number requested.
                    //
                    // Must return back an object containing fields:
                    //   items: The array of items of the form items=[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
                    //   offset: The offset into the array for the requested item
                    //   totalCount: (optional) update the value of the count

                    itemsFromIndex: function (requestIndex, countBefore, countAfter)
                    {
                        var that = this;
                        if (requestIndex >= that._pageCount)
                        {
                            return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
                        }
                        var results = [];

                        var fetchIndex = Math.max(requestIndex - countBefore,
                                0);
                        var lastFetchIndex = Math.min(requestIndex
                                + that._options.pagesToLoad, that._pageCount);

                        // Return the promise which is completed when all the requested pages are loaded
                        return this._loadPages(fetchIndex,
                                        lastFetchIndex + 1).then(function ()
                                {
                                    // Data adapter results needs an array of items of the shape:
                                    // items =[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
                                    // Form the array of results objects
                                    for (var i = fetchIndex; i < lastFetchIndex;
                                         i++)
                                    {
                                        var dataItem = that._dataArray[i];
                                        results.push({
                                            key: i.toString(),
                                            data: {
                                                imageSrc: dataItem.imageSrc,
                                                width: dataItem.width,
                                                height: dataItem.height,
                                                widthPx: dataItem.widthPx,
                                                heightPx: dataItem.heightPx,
                                                maxWidthPx : dataItem.maxWidthPx,
                                                maxHeightPx : dataItem.maxHeightPx
                                            }
                                        });

                                        // If this is zoomed in view, remove the reference to the stream so that it will get collected
                                        // by GC. This is not applicable for thumb nail view as we are cacheing the entries for thumbnail view
                                        // on disc
                                        if (that._inMemoryFlag)
                                        {
                                            that._dataArray[i].imageSrc = "";
                                        }
                                    }

                                    return WinJS.Promise.wrap({
                                        items: results, // The array of items.
                                        offset: requestIndex - fetchIndex, // The index of the requested item in the items array.
                                        totalCount: that._pageCount // The total number of records. This is equal to total number of pages in a PDF file
                                    });
                                });
                    }

                    // setNotificationHandler: not implemented
                    // itemsFromStart: not implemented
                    // itemsFromEnd: not implemented
                    // itemsFromKey: not implemented
                    // itemsFromDescription: not implemented
                })

    });
    WinJS.Namespace.define("PDF.dataAdapter", {
        dataSource: WinJS.Class.derive(WinJS.UI.VirtualizedDataSource,
                function (element, pdfDocument, options)
                {
                    var that = this;
                    this._dataAdapter = new PDF.dataAdapter(element,
                            pdfDocument, options);
                    this._baseDataSourceConstructor(this._dataAdapter,
                            { cacheSize: 10 });
                    this._dataAdapter.setRefresher(function ()
                    {
                        return that.invalidateAll().done(function ()
                        {
                            element.winControl.recalculateItemPosition();
                        });
                    });
                }, {
                    unload: function ()
                    {
                        this._dataAdapter.unload();
                    }
                })
    });

    // Event mixin to access PDF library functions in Virtualized Data Source Class
    WinJS.Class.mix(PDF.dataAdapter, pdfLibrary);
}());