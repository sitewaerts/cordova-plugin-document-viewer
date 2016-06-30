(function ()
{

    WinJS.Namespace.define("PDF", {
        dataAdapter: WinJS.Class.define(function (pdfDocument, options)
                {
                    if ((pdfDocument === null))
                    {
                        throw "Invalid data";
                    }

                    this._pdfDocument = pdfDocument;
                    this._options = options; // TODO: extend default with given options

                    // Initialize this data source
                    this._initialize();
                },
                {
                    _dataArray: null,               // This object stores the URL's for the pages rendered using PDF API's
                    _pdfDocument: null,             // Object returned by loadPDF
                    _pageCount: 0,                  // Number of pages in a given PDF file
                    _options: {
                        inMemoryFlag: true,
                        tempFolder: null,
                        pagesToLoad: 5,
                        isIgnoringHighContrast: false                          // High contrast will be honored by PDF API
                    },
                    _viewInfo: null,
                    _groupInfo: null,

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
                            if (!that._isViewInfoChanged())
                                return null;
                            that._calcDataItems();

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

                        this._dataArray = [];
                        for (var count = 0, len = this._pageCount; count < len;
                             count++)
                        {
                            this._dataArray.push({ pageIndex: count, imageSrc: "", width: 0, height: 0, itemInfo: { width: 0, height: 0}, pdfOptions: null});
                        }

                        this._calcDataItems();

                    },

                    _calcPDFOptions: function (viewInfo, pdfPage)
                    {
                        var index = pdfPage.index;

                        //var devicePixelRatio = window.devicePixelRatio;

                        var data = this._dataArray[index];
                        var pdfOptions = data.pdfOptions;
                        if (!pdfOptions)
                            data.pdfOptions = pdfOptions = new Windows.Data.Pdf.PdfPageRenderOptions();

                        pdfOptions.isIgnoringHighContrast =
                                this._options.isIgnoringHighContrast;

                        var containerWidth = viewInfo.containerWidth;
                        var containerHeight = viewInfo.containerHeight;

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


                        data.width = pageWidth;
                        data.height = pageHeight;

                        //data.container = viewInfo.container; // shared instance over all pages

                        // destination width is in dp aka dip
                        // https://msdn.microsoft.com/de-de/library/windows/apps/windows.data.pdf.pdfpagerenderoptions.destinationheight.aspx
                        //http://stackoverflow.com/questions/2025282/difference-between-px-dp-dip-and-sp-in-android

                        // the use of dip should automatically apply the devicePixelRatio factor (but it actually doesn't
                        var destinationWidth = Math.floor(pageWidth * (1.3 * window.devicePixelRatio));
                        //var destinationWidth = Math.floor(pageWidth);
                        if (pdfOptions.destinationWidth != destinationWidth)
                        {
                            pdfOptions.destinationWidth = destinationWidth;
                            data.imageSrc = ""; // reset
                        }

                        // var destinationHeight = Math.floor(pageHeight);
                        // if (pdfOptions.destinationHeight != destinationHeight)
                        // {
                        //     pdfOptions.destinationHeight = destinationHeight;
                        //     data.imageSrc = ""; // reset
                        // }

                        pdfOptions.destinationHeight = null; // keep page ratio
                    },

                    _buildViewInfo: function ()
                    {
                        var viewWidth = window.outerWidth;
                        var viewHeight = window.outerHeight;
                        var margin = this._options.containerMargin;
                        var rows = this._options.rows;

                        var rawViewHeight = viewHeight;
                        if (rows > 1)
                            rawViewHeight = viewHeight
                                    - (2 * margin) // top and bottom
                                    - ((rows - 1) * (2 * margin)); // margins between rows

                        var containerHeight = Math.floor(rawViewHeight / rows);

                        return {
                            viewWidth: viewWidth,
                            viewHeight: viewHeight,
                            containerWidth: viewWidth,
                            containerHeight: containerHeight
                        };
                    },

                    _updateViewInfo: function ()
                    {
                        var newViewInfo = this._buildViewInfo();

                        if (!this._viewInfo)
                        {
                            this._viewInfo = newViewInfo;
                        }
                        else
                        {
                            this._viewInfo.viewWidth = newViewInfo.viewWidth;
                            this._viewInfo.viewHeight = newViewInfo.viewHeight;
                            this._viewInfo.containerWidth = newViewInfo.containerWidth;
                            this._viewInfo.containerHeight = newViewInfo.containerHeight;
                        }

                        this._groupInfo = {
                            enableCellSpanning: true,
                            cellWidth: this._viewInfo.containerWidth,
                            cellHeight: this._viewInfo.containerHeight
                        };

                        return this._viewInfo;
                    },


                    _isViewInfoChanged: function ()
                    {
                        if (!this._viewInfo)
                            return true;

                        var nvi = this._buildViewInfo();
                        var ovi = this._viewInfo;

                        return (
                                nvi.containerWidth
                                        != ovi.containerWidth
                                        || nvi.containerHeight
                                        != ovi.containerHeight
                                );
                    },

                    _calcDataItems: function ()
                    {
                        var that = this;

                        var pageCount = that._pageCount;

                        var rows = this._options.rows;

                        var viewInfo = this._updateViewInfo();

                        var cellWidth;
                        if(rows == 1)
                        {
                            cellWidth = this._options.containerMargin;
                        }
                        else
                        {
                            cellWidth = 0;
                        }

                        var cellHeight = this._groupInfo.cellHeight;

                        var index;
                        for (index = 0; index < pageCount; index++)
                        {
                            that._calcPDFOptions(viewInfo,
                                    that._pdfDocument.getPage(index));
                            if(rows == 1)
                            {
                            }
                            else
                            {
                                cellWidth = Math.max(
                                        cellWidth, this._dataArray[index].width);
                            }
                        }

                        this._groupInfo.cellWidth = cellWidth;

                        for (index = 0; index < pageCount; index++)
                        {
                            var data = this._dataArray[index];
                            if(rows == 1)
                            {
                                data.itemInfo.width = (Math.floor(data.width
                                        / cellWidth)) * cellWidth;
                                if (data.width % cellWidth != 0)
                                    data.itemInfo.width = data.itemInfo.width
                                            + cellWidth;
                            }
                            else
                            {
                                data.itemInfo.width = cellWidth;
                            }

                            data.itemInfo.height = cellHeight;
                        }
                    },

                    // This method invokes PDF API's to get the required pages from the PDF file
                    //   startIndex:    start page index
                    //   endIndex:      end page index
                    //   It returns a promise which is completed when loadPages is completed
                    _loadPages: function (startIndex, endIndex)
                    {
                        var that = this;

                        startIndex = Math.max(0, startIndex);
                        endIndex = Math.min(that._pageCount, endIndex);

                        var promise = that.loadPages(startIndex, endIndex,
                                        this._pdfDocument,
                                        this._dataArray,
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

                        this._viewInfo = null;
                        this._groupInfo = null;
                    },

                    getGroupInfo: function ()
                    {
                        return this._groupInfo;
                    },

                    getItemInfo: function (index)
                    {
                        if (!this._dataArray)
                            return null;
                        var data = this._dataArray[index];
                        if (!data)
                            return null;
                        return data.itemInfo;
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

                                                widthPx: dataItem.width + "px",
                                                heightPx: dataItem.height
                                                        + "px",

                                                cellWidth: dataItem.itemInfo.width,
                                                cellHeight: dataItem.itemInfo.height,

                                                cellWidthPx: dataItem.itemInfo.width
                                                        + "px",
                                                cellHeightPx: dataItem.itemInfo.height
                                                        + "px"
                                            }
                                        });

                                        // If this is fullScreen view, remove the reference to the stream so that it will get collected
                                        // by GC. This is not applicable for thumb nail view as we are caching the entries for thumbnail view
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
        dataSource: WinJS.Class.derive(
                WinJS.UI.VirtualizedDataSource,
                function (winControl, pdfDocument, options)
                {
                    var that = this;
                    that._dataAdapter = new PDF.dataAdapter(pdfDocument,
                            options);
                    this._baseDataSourceConstructor(that._dataAdapter,
                            { cacheSize: 10 });
                    that._dataAdapter.setRefresher(function ()
                    {
                        return that.invalidateAll().done(function ()
                        {
                            // see https://msdn.microsoft.com/en-us/library/windows/apps/jj657974.aspx
                            winControl.recalculateItemPosition();
                        });
                    });
                },
                {

//                    itemFromDescription: function (description) {
//                        return WinJS.Promise.wrap({ index: 0 });
//                    },
                    unload: function ()
                    {
                        this._dataAdapter.unload();
                    },
                    getGroupInfo: function ()
                    {
                        return this._dataAdapter.getGroupInfo()
                    },
                    getItemInfo: function (index)
                    {
                        return this._dataAdapter.getItemInfo(index)
                    }
                }
        )
    });

    // Event mixin to access PDF library functions in Virtualized Data Source Class
    WinJS.Class.mix(PDF.dataAdapter, pdfLibrary);
}());