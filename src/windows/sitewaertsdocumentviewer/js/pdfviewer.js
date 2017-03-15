(function (window)
{
    "use strict";

    var debug = {
        enabled: true
    };

    var _suspended = false;

    function _onSuspending()
    {
        _suspended = true;
    }

    function _onResuming()
    {
        _suspended = false;
    }


    function createCommonErrorHandler(context)
    {
        return function (eventInfo)
        {
            window.console.error(context, eventInfo);

            if (!_suspended)
            {
                var dialog;
                if (eventInfo.detail)
                {
                    var detail = eventInfo.detail;
                    dialog = new Windows.UI.Popups.MessageDialog(
                            detail.stack, detail.message);
                }
                else
                {
                    dialog = new Windows.UI.Popups.MessageDialog(
                            context, eventInfo);

                }
                dialog.showAsync().done();
            }

            // By returning true, we signal that the exception was handled,
            // preventing the application from being terminated
            return true;
        }
    }

    WinJS.Application.onerror = createCommonErrorHandler(
            'WinJS.Application.onerror');
    WinJS.Promise.onerror = createCommonErrorHandler('WinJS.Promise.onerror');


    window.onerror = function (msg, url, line, col, error)
    {
        window.console.error(msg,
                {url: url, line: line, col: col, error: error});

        // TODO: suspend event not fired in windows apps. why?
        // if (!_suspended)
        // {
        //     try
        //     {
        //         var extra = !col ? '' : '\ncolumn: ' + col;
        //         extra += !error ? '' : '\nerror: ' + error;
        //
        //         var dialog = new Windows.UI.Popups.MessageDialog(
        //                 msg, "\nurl: " + url + "\nline: " + line + extra);
        //         dialog.showAsync().done();
        //     }
        //     catch (e)
        //     {
        //         // ignore
        //         window.console.error("cannot show dialog", e);
        //     }
        // }
        //
        return true;
    };

    // var webUIApp = (Windows
    // && Windows.UI) ? Windows.UI.WebUI.WebUIApplication : null;
    // if (webUIApp)
    // {
    //     webUIApp.addEventListener("suspending", _onSuspending);
    //     webUIApp.addEventListener("resuming", _onResuming);
    // }
    //




    var module = angular.module('viewer', ['winjs'], null);

    module.run(function($rootScope){
        $rootScope.$on("app.suspending", _onSuspending);
        $rootScope.$on("app.resuming", _onResuming);
    });



    module.factory('log', function ($window)
    {
        var console = $window.console;

        return console;
    });

    module.config([
        '$compileProvider',
        function ($compileProvider)
        {
            // ms-appx|ms-appx-web ??
            //$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
            $compileProvider.imgSrcSanitizationWhitelist(
                    /^\s*(blob|file|local):/);
        }
    ]);


    module.directive('backgroundImage', function ()
    {
        return function (scope, element, attrs)
        {
            scope.$watch(attrs.backgroundImage, function (newValue)
            {
                if (newValue && newValue.length > 0)
                    element.css('background-image', 'url("' + newValue + '")');
                else
                    element.css('background-image', '');
            });
        };
    });

    module.factory('views', function ()
    {
        var _views = {
            loading: {
                id: 'loading',
                template: 'loading.html',
                appBar: {always: true}
            },
            pageflow: {
                id: 'pageflow',
                template: 'pageflow.html',
                appBar: {always: false}
            },
            outline: {
                id: 'outline',
                template: 'outline.html',
                appBar: {always: true}
            },
            tiles: {
                id: 'tiles',
                template: 'tiles.html',
                appBar: {always: true}
            }
        };

        function _getView(id)
        {
            var v = _views[id];
            if (!v)
                throw new Error("unknown view '" + id + "'");
            return v;
        }

        return {
            getView: _getView
        };
    });


    module.controller('PdfViewerCtrl', function ($scope, pdfViewer, views)
    {
        var ctrl = this;

        function _setView(id)
        {
            if (!ctrl.view || ctrl.view.id != id)
            {
                ctrl.view = views.getView(id);
                if (ctrl.view && ctrl.appBar.winControl)
                {
                    if (ctrl.view.appBar.always)
                    {
                        ctrl.appBar.winControl.close();
                        ctrl.appBar.winControl.closedDisplayMode = 'full';
                    }
                    else
                    {
                        ctrl.appBar.winControl.open();
                        ctrl.appBar.winControl.closedDisplayMode = 'none';
                    }
                }
            }
        }

        ctrl.setView = _setView;

        ctrl.gotoPage = function (pageIndex, viewId)
        {
            if (pageIndex == null)
                return;

            ctrl.setFocusedPageIndex(pageIndex);

            if (viewId)
                ctrl.setView(viewId);
        };

        ctrl.close = pdfViewer.close.bind(pdfViewer);

        ctrl.setFocusedPageIndex = pdfViewer.setFocusedPageIndex.bind(
                pdfViewer);

        ctrl.appBar = {
            winControl: null,
            show: function ()
            {
                if (ctrl.view && ctrl.appBar.winControl)
                {
                    if (ctrl.view.appBar.always)
                    {
                        // nothing to do
                    }
                    else
                    {
                        if (!ctrl.appBar.winControl.opened)
                            ctrl.appBar.winControl.open();
                    }
                }
            }
        };

        ctrl.error = {
            message: null,
            dialog: {
                winControl: null,
                show: function ()
                {
                    if (ctrl.error.dialog.winControl)
                    {
                        // var _hideOnce = function(){
                        //     ctrl.error.dialog.winControl.removeEventListener("afterhide", _hideOnce);
                        //
                        // };
                        // ctrl.error.dialog.winControl.addEventListener("afterhide", _hideOnce);
                        ctrl.error.dialog.winControl.show();
                    }
                },
                hide: function ()
                {
                    if (ctrl.error.dialog.winControl)
                    {
                        ctrl.error.dialog.winControl.hide();
                    }
                }
            }
        };

        function _setViewerError()
        {
            var error = pdfViewer.doc.error;
            if (error)
                _setError(error);
        }

        function _setError(error)
        {
            ctrl.error.message = error.message || error;
            ctrl.error.details = error;
            ctrl.error.dialog.show();
        }

        _setView('loading');

        function _update()
        {
            ctrl.doc = pdfViewer.doc;
        }

        function _showPDF()
        {
            // TODO
            ctrl.doc = pdfViewer.doc;

            _setView('pageflow');
        }

        $scope.$on("$destroy", pdfViewer.onPDFLoading(_update));
        $scope.$on("$destroy", pdfViewer.onPDFLoaded(_showPDF));
        $scope.$on("$destroy", pdfViewer.onPDFError(_setViewerError));
    });

    module.factory('ViewCtrlBase', function ($q, $window)
    {

        function ViewCtrlBase($scope)
        {
            var ctrl = this;

            function _recalculateItemPosition()
            {
                if (ctrl.viewWinControl)
                    ctrl.viewWinControl.recalculateItemPosition();
            }

            ctrl.recalculateItemPosition = _recalculateItemPosition;

            ctrl.viewWinControl = null;

            function _getWinCtrl()
            {
                if (ctrl.viewWinControl
                        && ctrl.viewWinControl._element)
                    return $q.when(ctrl.viewWinControl);
                else return $q(function (resolve, reject)
                {
                    var remove = $scope.$watch(function ()
                    {
                        return ctrl.viewWinControl;
                    }, function (viewWinControl)
                    {
                        if (viewWinControl
                                && viewWinControl._element)
                        {
                            remove();
                            resolve(viewWinControl);
                        }
                    });
                });
            }

            ctrl.getWinCtrl = _getWinCtrl;

            function resize()
            {
                if (ctrl.resize)
                    ctrl.resize();
            }


            function close()
            {
                if (ctrl.close)
                    ctrl.close();
            }

            $window.addEventListener("resize", resize, false);
            $scope.$on('$destroy', function ()
            {
                $window.removeEventListener("resize", resize);
            });

            $scope.$on('$destroy', close);
        }

        return ViewCtrlBase;
    });

    module.factory('ViewCtrlPagesBase',
            function ($q, $timeout, $interval, $window, pdfViewer, ViewCtrlBase)
            {

                function ViewCtrlPagesBase($scope, opts)
                {
                    var ctrl = this;
                    ViewCtrlBase.call(ctrl, $scope);

                    ctrl.options = angular.extend(
                            {containerMargin: 5, isIgnoringHighContrast: false, verticalCutOff : 0},
                            opts);


                    var _tmp = null;

                    function getTemp()
                    {
                        if (ctrl.options.inMemory || _tmp)
                            return $q.when(_tmp);
                        return pdfViewer.getTemp().then(function (tmp)
                        {
                            _tmp = tmp;
                            return $q.when(_tmp);
                        })
                    }

                    function _buildViewInfo()
                    {
                        var viewWidth = window.innerWidth;
                        var viewHeight = window.innerHeight;
                        var margin = ctrl.options.containerMargin;
                        var rows = Math.max(1, ctrl.options.rows);

                        var rawViewHeight = viewHeight - ctrl.options.verticalCutOff;

                        if (rows > 1)
                            rawViewHeight = rawViewHeight
                                    - (2 * margin) // top and bottom
                                    - ((rows - 1) * (2 * margin)); // margins between rows

                        var containerHeight = Math.floor(rawViewHeight / rows);

                        var imageHeight = Math.max(
                                        window.screen.width,
                                        window.screen.height) / rows;


                        var zoomFactor = 1;
                        var resolutionFactor = 1;
                        if (rows == 1)
                        {
                            //zoomFactor = 1.3;
                            // the use of dip should automatically apply the devicePixelRatio factor (but it actually doesn't)
                            resolutionFactor = window.devicePixelRatio;
                        }

                        return {
                            viewWidth: viewWidth,
                            viewHeight: rawViewHeight,
                            containerWidth: viewWidth,
                            containerHeight: containerHeight,
                            imageHeight: imageHeight,
                            zoomFactor: zoomFactor * resolutionFactor
                        };
                    }

                    function _getViewInfo()
                    {
                        if (ctrl._viewInfo)
                            return ctrl._viewInfo;
                        return ctrl._viewInfo = _buildViewInfo();
                    }

                    function _updateViewInfo()
                    {
                        var newViewInfo = _buildViewInfo();

                        if (!ctrl._viewInfo || !angular.equals(ctrl._viewInfo,
                                        newViewInfo))
                        {
                            ctrl._viewInfo = newViewInfo;
                        }

                        ctrl.groupInfo = {
                            enableCellSpanning: true,
                            cellWidth: ctrl._viewInfo.containerWidth,
                            cellHeight: ctrl._viewInfo.containerHeight
                        };

                        return ctrl._viewInfo;
                    }

                    ctrl.getGroupInfo = function ()
                    {
                        return ctrl.groupInfo;
                    };

                    ctrl.getItemInfo = function (index)
                    {
                        if (!ctrl.pages || !ctrl.pages.list)
                            return null;
                        var p = ctrl.pages.list[index];
                        if (!p)
                            return null;
                        return p.itemInfo;
                    };


                    function _isViewInfoChanged()
                    {
                        if (!ctrl._viewInfo)
                            return true;

                        var nvi = _buildViewInfo();
                        var ovi = ctrl._viewInfo;

                        return !angular.equals(nvi, ovi);
                    }


                    function _reset()
                    {
                        delete ctrl.doc;
                        if (ctrl.pages)
                            ctrl.pages.close();
                        delete ctrl.pages;
                    }

                    function Page(options, pdf)
                    {
                        var page = this;
                        angular.extend(this, options || {});
                        this.imageSrc = null;
                        this.width = 0;
                        this.height = 0;
                        this.itemInfo = {width: 0, height: 0};

                        var _imageSrc_revoker;

                        this.setImageSrc = function (url, revoker)
                        {
                            if (page.imageSrc != url)
                            {
                                _clearImageSrc();
                                page.imageSrc = url;
                                _imageSrc_revoker = revoker;
                            }
                        };

                        this.close = function ()
                        {
                            _cancelGenerator();
                            _clearImageSrc();
                        };

                        function _clearImageSrc()
                        {
                            if (page.imageSrc && _imageSrc_revoker)
                                _imageSrc_revoker(page.imageSrc);
                            page.imageSrc = null;
                        }

                        var _pdfOptions = null;
                        var _pdfOptionsChecksum = null;

                        var _viewInfo = null;
                        var _dirty = false;
                        var _generator = null;

                        var _pdfPage = pdf.getPage(page.pageIndex);
                        var _dimRelation = _pdfPage.size.width
                                / _pdfPage.size.height;

                        _pdfOptions = new Windows.Data.Pdf.PdfPageRenderOptions();
                        _pdfOptions.isIgnoringHighContrast = page.isIgnoringHighContrast;

                        function _isViewUpToDate(newViewInfo)
                        {
                            return angular.equals(_viewInfo,
                                    newViewInfo || _getViewInfo());
                        }

                        function _calcDimensions()
                        {
                            var viewInfo = _viewInfo;
                            var containerWidth = viewInfo.containerWidth;
                            var pageHeight = viewInfo.containerHeight;
                            var pageWidth = Math.floor(
                                    pageHeight * _dimRelation);
                            if (pageWidth > containerWidth)
                            {
                                pageWidth = containerWidth;
                                pageHeight = Math.floor(
                                        pageWidth / _dimRelation);
                            }

                            // used for item info
                            page.width = pageWidth;
                            page.height = pageHeight;


                            //var imageHeight = pageHeight;
                            var imageHeight = viewInfo.imageHeight;
                            // destination height is in dp aka dip
                            // https://msdn.microsoft.com/de-de/library/windows/apps/windows.data.pdf.pdfpagerenderoptions.destinationheight.aspx
                            //http://stackoverflow.com/questions/2025282/difference-between-px-dp-dip-and-sp-in-android

                            _pdfOptions.destinationHeight =
                                    Math.floor(
                                            imageHeight * viewInfo.zoomFactor);
                            _pdfOptions.destinationWidth = null; // keep page ratio

                            var pdfOptionsChecksum = _getChecksum(_pdfOptions);
                            if (_pdfOptionsChecksum != pdfOptionsChecksum
                                    && page.imageSrc)
                                _dirty = true;
                            _pdfOptionsChecksum = pdfOptionsChecksum;
                        }

                        function _getChecksum(object)
                        {
                            if (object == null)
                                return "";
                            return JSON.stringify(object); // HACK
                        }

                        function _updateView()
                        {
                            _viewInfo = _getViewInfo();
                            _calcDimensions();
                        }

                        function _updateViewIfNecessary()
                        {
                            if (_pdfOptionsChecksum && _isViewUpToDate())
                                return false;
                            _updateView();
                            return true;
                        }

                        function _cancelInvalidGenerator()
                        {
                            if (!_generator)
                                return;

                            if (_generator.pdfOptionsChecksum
                                    == _pdfOptionsChecksum)
                                return;

                            _cancelGenerator();
                        }

                        function _cancelGenerator()
                        {
                            if (!_generator)
                                return;

                            _generator.cancel();
                            _generator = null;
                        }

                        function _load()
                        {
                            _cancelInvalidGenerator();
                            if (_generator)
                                return;

                            var generator = _generator = {
                                pdfOptions: _pdfOptions,
                                pdfOptionsChecksum: _pdfOptionsChecksum,
                                promise: null,
                                canceled: false,
                                cancel: function ()
                                {
                                    if (generator.canceled)
                                        return;

                                    generator.canceled = true;
                                    if (generator.promise)
                                        generator.promise.cancel();
                                },
                                applyResult: function (pi)
                                {
                                    try
                                    {
                                        if (generator.canceled || _generator
                                                != generator)
                                            return;

                                        _dirty = false;
                                        _generator = null;

                                        var srcObject = pi.imageSrc;

                                        $scope.$evalAsync(function ()
                                        {
                                            if (generator.canceled)
                                                return;

                                            page.setImageSrc(
                                                    URL.createObjectURL(
                                                            srcObject,
                                                            {oneTimeOnly: false}),
                                                    URL.revokeObjectURL
                                            );
                                        });
                                    }
                                    catch (e)
                                    {
                                        window.console.error(e);
                                    }
                                },
                                applyError: function (error)
                                {
                                    window.console.error(error);

                                    if (generator.canceled || _generator
                                            != generator)
                                        return;

                                    //_dirty = false;
                                    _generator = null;

                                    // keep old src
                                }
                            };

                            var _unregisterOnSuspending;

                            function _onSuspending()
                            {
                                // webUIApp.removeEventListener("suspending",
                                //         _onSuspending);
                                if(_unregisterOnSuspending)
                                {
                                    _unregisterOnSuspending();
                                    _unregisterOnSuspending = null;
                                }
                                generator.cancel();
                            }

                            // force async exec
                            $scope.$applyAsync(function ()
                            {
                                if (generator.canceled)
                                    return;

                                // if (webUIApp)
                                //     webUIApp.addEventListener("suspending",
                                //             _onSuspending);
                                _unregisterOnSuspending = $scope.$on("app.suspending", _onSuspending);

                                generator.promise = pdfLibrary.loadPage(
                                        page.pageIndex,
                                        pdf,
                                        _generator.pdfOptions,
                                        _tmp == null,
                                        _tmp);

                                generator.promise.done(
                                        generator.applyResult.bind(generator),
                                        generator.applyError.bind(generator));
                            });
                        }

                        this.prepareDimensions = function ()
                        {
                            return _updateViewIfNecessary();
                        };

                        // called when view dimensions may have changed
                        this.triggerRefresh = function ()
                        {
                            if (_isViewUpToDate())
                                return;
                            _updateView();

                            if (!page.imageSrc && !_generator)
                                return; // not yet loaded/loading --> no refresh necessary
                            $scope.$applyAsync(_load);
                        };

                        // called when image src is definitely needed (item s rendered)
                        this.triggerLoad = function (async)
                        {
                            if (!_isViewUpToDate())
                                _updateView();

                            if (page.imageSrc && !_dirty)
                                return;

                            if (async)
                                $scope.$applyAsync(_load);
                            else
                                _load();
                        };
                    }

                    function createPagesDataSource(pages)
                    {
                        // implements IListDataAdapter (get only)
                        var DataAdapter = WinJS.Class.define(function ()
                        {
                        }, {
                            getCount: function ()
                            {
                                return WinJS.Promise.wrap(pages.length);
                            },

                            // Called by the virtualized data source to fetch items
                            // It will request a specific item and optionally ask for a number of items on either side of the requested item.
                            // The implementation should return the specific item and, in addition, can choose to return a range of items on either
                            // side of the requested index. The number of extra items returned by the implementation can be more or less than the number requested.

                            itemsFromIndex: function (requestIndex, countBefore, countAfter)
                            {
                                if (requestIndex >= pages.length)
                                    return WinJS.Promise.wrapError(
                                            new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));

                                // countBefore = Math.min(ctrl.options.pagesToLoad,
                                //         countBefore);
                                // countAfter = Math.min(ctrl.options.pagesToLoad,
                                //         countAfter);

                                var results = [];

                                var fetchIndex = Math.max(
                                        requestIndex - countBefore,
                                        0);
                                var lastFetchIndex = Math.min(
                                        requestIndex + countAfter,
                                        pages.length - 1);

                                pages[requestIndex].triggerLoad(); // trigger image generator on requested page first

                                for (var i = fetchIndex; i <= lastFetchIndex;
                                     i++)
                                {
                                    /**
                                     * @type Page
                                     */
                                    var page = pages[i];
                                    //page.triggerLoad(); // trigger image generator on requested pages
                                    results.push(
                                            {key: i.toString(), data: page});
                                }


                                pdfViewer.setFocusedPageIndex(requestIndex);

                                // implements IFetchResult
                                return WinJS.Promise.wrap({
                                    absoluteIndex: requestIndex,
                                    items: results, // The array of items.
                                    offset: requestIndex - fetchIndex, // The index of the requested item in the items array.
                                    totalCount: pages.length, // The total number of records. This is equal to total number of pages in a PDF file ,
                                    atStart: fetchIndex == 0,
                                    atEnd: fetchIndex == pages.length - 1
                                });
                            }
                        });

                        var DataSource = WinJS.Class.derive(
                                WinJS.UI.VirtualizedDataSource,
                                function ()
                                {
                                    this._baseDataSourceConstructor(
                                            new DataAdapter(),
                                            {
                                                // cacheSize: (ctrl.options.pagesToLoad * 2) + 1
                                                cacheSize: ctrl.options.pagesToLoad
                                            }
                                    );
                                },
                                {}
                        );

                        return new DataSource();
                    }

                    function _showPDF()
                    {
                        _reset();

                        var doc = ctrl.doc = pdfViewer.doc;
                        var pdf = pdfViewer.doc.file.pdf;

                        var pageCount = doc.pageCount = pdf.pageCount;

                        _updateViewInfo();
                        /**
                         *
                         * @type {Array}
                         */
                        var pages = [];
                        for (var count = 0; count < pageCount; count++)
                        {
                            var page = new Page({pageIndex: count}, pdf);
                            pages.push(page);
                            page.prepareDimensions();
                        }
                        _updateDimensions();

                        function _refreshPages()
                        {
                            for (var i = 0; i < pages.length; i++)
                            {
                                var page = pages[i];
                                page.triggerRefresh(); // will recalc dimension at once and trigger async image calc if needed
                            }
                            _updateDimensions();
                        }

                        function _close()
                        {
                            if (pages)
                            {
                                for (var i = 0; i < pages.length; i++)
                                {
                                    var page = pages[i];
                                    page.close();
                                }
                            }
                            pages = null;
                            doc = null;
                            pdf = null;
                        }

                        function _updateDimensions()
                        {
                            var rows = ctrl.options.rows;

                            var cellWidth;
                            if (rows == 1)
                            {
                                cellWidth = ctrl.options.containerMargin;
                            }
                            else
                            {
                                cellWidth = 0;
                            }

                            var cellHeight = ctrl.groupInfo.cellHeight;

                            if (rows != 1)
                            {
                                for (var i = 0; i < pages.length; i++)
                                {
                                    cellWidth = Math.max(
                                            cellWidth,
                                            pages[i].width);
                                }
                            }

                            // this is the raster with (minimal width of a cell)
                            ctrl.groupInfo.cellWidth = cellWidth;

                            for (var j = 0; j < pages.length; j++)
                            {
                                /**
                                 *
                                 * @type {Page}
                                 */
                                var page = pages[j];
                                if (rows == 1)
                                {
                                    // calc needed number of cells spanned
                                    page.itemInfo.width = (Math.floor(page.width
                                                    / cellWidth)) * cellWidth;
                                    if (page.width % cellWidth != 0)
                                        page.itemInfo.width = page.itemInfo.width
                                                + cellWidth;
                                }
                                else
                                {
                                    page.itemInfo.width = cellWidth;
                                }

                                page.itemInfo.height = cellHeight;
                            }

                            ctrl.recalculateItemPosition();
                        }

                        _gotoPageIndex(pdfViewer.getFocusedPageIndex());

                        $scope.$applyAsync(function ()
                        {
                            ctrl.pages = {
                                list: pages,
                                dataSource: createPagesDataSource(pages),
                                refresh: _refreshPages,
                                close: _close
                            };
                            ctrl.recalculateItemPosition();
                        });
                    }

                    function _gotoPageIndex(idx)
                    {

                        function awaitCorrectLoadingState(winControl)
                        {

                            function isStateOK()
                            {
                                return winControl.loadingState
                                        == "viewPortLoaded";
                            }

                            if (isStateOK())
                                return $q.when(winControl);
                            else
                                return $q(function (resolve, reject)
                                {

                                    winControl.addEventListener(
                                            "loadingstatechanged",
                                            checkState);
                                    function checkState()
                                    {
                                        if (isStateOK())
                                        {
                                            winControl.removeEventListener(
                                                    "loadingstatechanged",
                                                    checkState);
                                            resolve(winControl);
                                        }
                                    }
                                });
                        }

                        function ensureVisible(winControl)
                        {
                            winControl.ensureVisible(idx);
                        }

                        ctrl.getWinCtrl()
                                .then(awaitCorrectLoadingState)
                                .then(ensureVisible);

                    }

                    function _refreshView()
                    {
                        if (!_isViewInfoChanged())
                            return null;

                        _updateViewInfo();

                        if (ctrl.pages)
                            ctrl.pages.refresh();
                    }


                    ctrl.close = function ()
                    {
                        if (ctrl.pages)
                            ctrl.pages.close();
                        delete ctrl.pages;
                    };

                    ctrl.resize = function ()
                    {
                        var i = ctrl.viewWinControl.indexOfFirstVisible;
                        $scope.$evalAsync(
                                function ()
                                {
                                    _refreshView();
                                    ctrl.viewWinControl.indexOfFirstVisible = i;
                                    $scope.$applyAsync(function ()
                                    {
                                        ctrl.viewWinControl.indexOfFirstVisible = i;
                                    });
                                }
                        );
                    };

                    function _waitForPDF()
                    {
                        return getTemp().then(
                                pdfViewer.waitForPDF.bind(pdfViewer));
                    }

                    // start
                    _waitForPDF().then(_showPDF);


                }

                return ViewCtrlPagesBase;
            });

    module.controller('PageflowViewCtrl', function (ViewCtrlPagesBase, $scope)
    {
        var ctrl = this;
        ViewCtrlPagesBase.call(ctrl, $scope, {
            rows: 1,
            inMemory: false,
            pagesToLoad: 2,
            verticalCutOff : 0
        });
    });


    module.controller('TilesViewCtrl', function (ViewCtrlPagesBase, $scope)
    {
        var ctrl = this;
        ViewCtrlPagesBase.call(ctrl, $scope, {
            rows: 4,
            inMemory: false,
            pagesToLoad: 2,
            verticalCutOff : 50
        });
    });


    module.controller('OutlineViewCtrl',
            function (ViewCtrlBase, $scope, pdfViewer)
            {
                var ctrl = this;
                ViewCtrlBase.call(ctrl, $scope);

                function _showOutline()
                {
                    ctrl.outline = pdfViewer.doc.outline;
                }

                pdfViewer.waitForPDF().then(_showOutline);
            });


    module.factory('pdfViewer', function ($rootScope, $q, log)
    {
        var EVENTS = {
            LOADING_PDF: 'pdf.loading',
            SHOW_PDF: 'pdf.loaded',
            ERROR: 'pdf.error'
        };

        function _cleanupUri(uri)
        {
            if (!uri || uri.length <= 0)
                return null;

            // remove double slashes
            uri = uri.replace(/([^\/:])\/\/([^\/])/g, '$1/$2');

            // ms-appx-web --> ms-appx
            uri = uri.replace(/^ms-appx-web:\/\//, 'ms-appx://');

            return uri;

        }


        var pdfUri;
        var pdfOptions;
        var closeHandler;
        var service = {};

        function _showPdf(args)
        {
            pdfUri = args.pdfUri;
            pdfOptions = args.pdfOptions;
            closeHandler = args.closeHandler;

            service.doc = {
                title: pdfOptions.title,
                file: {}
            };

            if (!pdfUri)
            {
                $rootScope.$broadcast(EVENTS.ERROR,
                        {message: "no file specified"});
                return;
            }

            pdfUri = _cleanupUri(pdfUri);

            service.doc.file.uri = pdfUri;
            $rootScope.$broadcast(EVENTS.LOADING_PDF);

            function _onError(error)
            {
                window.console.error(pdfUri, error);
                service.doc.error = error;
                $rootScope.$broadcast(EVENTS.ERROR);
            }

            loadFile(pdfUri)
                    .then(function (file)
                    {
                        return $q.all([loadPDF(file), loadPDFOutline(pdfUri)]);
                    })
                    .done(function ()
                    {
                        $rootScope.$broadcast(EVENTS.SHOW_PDF);
                    }, _onError);

            function loadFile(fileUri)
            {
                var uri = new Windows.Foundation.Uri(fileUri);
                return Windows.Storage.StorageFile.getFileFromApplicationUriAsync(
                        uri).then(
                        function (file)
                        {
                            // Updating details of file currently loaded
                            service.doc.file.loaded = file;
                            $rootScope.$broadcast(EVENTS.LOADING_PDF);

                            return file;
                        }
                );

            }

            function loadPDF(file)
            {
                // Loading PDf file from the assets

                // TODO: Password protected file? user should provide a password to open the file

                return pdfLibrary.loadPDF(file).then(
                        function (pdfDocument)
                        {
                            if (pdfDocument == null)
                                throw new Error({message: "pdf file cannot be loaded"});

                            // Updating details of file currently loaded
                            service.doc.file.pdf = pdfDocument;
                            $rootScope.$broadcast(EVENTS.LOADING_PDF);

                            return getCleanTemp().then(function ()
                            {
                                return pdfDocument
                            });
                        });

            }

            function loadPDFOutline(fileUri)
            {
                // TODO: Password protected file? user should provide a password to open the file

                PDFJS.disableWorker = true;
                PDFJS.workerSrc = 'js/pdfjs-dist/pdf.worker.js';

                return $q(function (resolve, reject)
                {


                    function onError(error)
                    {
                        log.error("cannot load outline for pdf", fileUri,
                                error);
                        service.doc.outline = null;
                        resolve();
                    }

                    function onSuccess(pdf, outline)
                    {

                        /* raw outline is structured like this:
                         *[
                         *  {
                         *   title: string,
                         *   bold: boolean,
                         *   italic: boolean,
                         *   color: rgb Uint8Array,
                         *   dest: dest obj,
                         *   url: string,
                         *   items: array of more items like this
                         *  },
                         *  ...
                         * ]
                         * */

                        function convertItems(items)
                        {
                            if (!items || items.length <= 0)
                                return;

                            items.forEach(function (item)
                            {
                                getPageIndex(item).then(
                                        function (pageIndex)
                                        {
                                            if (pageIndex != null)
                                                item.pageIndex = pageIndex;
                                            else
                                                delete item.pageIndex;
                                        },
                                        function (error)
                                        {
                                            log.error(
                                                    "cannot determine page index for outline item",
                                                    item, error);
                                            delete item.pageIndex;
                                        }
                                );
                                convertItems(item.items);
                            });
                        }

                        function getPageIndex(item)
                        {
                            return $q(function (resolve, reject)
                            {
                                var dest = item.dest;
                                var destProm;
                                if (typeof dest === 'string')
                                    destProm = pdf.getDestination(dest);
                                else
                                    destProm = Promise.resolve(dest);

                                destProm.then(function (destination)
                                {
                                    if (!(destination instanceof Array))
                                    {
                                        reject(destination);
                                        return; // invalid destination
                                    }

                                    var destRef = destination[0];

                                    pdf.getPageIndex(destRef).then(
                                            function (pageIndex)
                                            {
                                                resolve(pageIndex);
                                            }, reject);
                                }, reject);
                            });
                        }

                        if (outline && outline.length > 0)
                        {
                            outline = angular.copy(outline);
                            convertItems(outline);
                            service.doc.outline = outline;
                        }
                        else
                        {
                            outline = null;
                            delete service.doc.outline;
                        }

                        //$rootScope.$broadcast(EVENTS.LOADING_PDF);
                        resolve();
                    }

                    PDFJS.getDocument(fileUri).then(function (pdf)
                    {
                        pdf.getOutline().then(function (outline)
                        {
                            onSuccess(pdf, outline);
                        }, onError);
                    }, onError);
                });
            }
        }

        _setHandler({
            showPDF: function (args)
            {
                _showPdf(args);
            },
            appSuspend : function(){
                $rootScope.$broadcast("app.suspend");
            },
            appResume : function(){
                $rootScope.$broadcast("app.resume");
            }
        });


        function getCleanTemp()
        {
            // clear/create temp folder
            return WinJS.Application.temp.folder.createFolderAsync(
                    "pdfViewer",
                    Windows.Storage.CreationCollisionOption.replaceExisting
            );
        }

        service.getCleanTemp = getCleanTemp;

        function getTemp()
        {
            // clear/create temp folder
            return WinJS.Application.temp.folder.createFolderAsync(
                    "pdfViewer",
                    Windows.Storage.CreationCollisionOption.openIfExists
            );
        }

        service.getTemp = getTemp;


        service.close = function ()
        {
            closeHandler();
        };

        service.onPDFLoading = function (handler)
        {
            if (pdfUri)
                handler();
            return $rootScope.$on(EVENTS.LOADING_PDF, handler);
        };

        service.onPDFLoaded = function (handler)
        {
            if (pdfUri)
                handler();
            return $rootScope.$on(EVENTS.SHOW_PDF, handler);
        };

        service.isPDFLoaded = function ()
        {
            return service.doc && service.doc.file && service.doc.file.pdf;
        };

        service.waitForPDF = function ()
        {
            if (service.isPDFLoaded())
                return $q.when();
            return $q(function (resolve, reject)
            {
                var removeLoaded = service.onPDFLoaded(function notify()
                {
                    cleanup();
                    resolve();
                });

                var removeError = service.onPDFError(function notify()
                {
                    cleanup();
                    reject();
                });


                function cleanup()
                {
                    removeLoaded();
                    removeError();
                }

            });
        };


        service.onPDFError = function (handler)
        {
            return $rootScope.$on(EVENTS.ERROR, handler);
        };

        var _focusedPageIndex = 0;

        service.setFocusedPageIndex = function (idx)
        {
            _focusedPageIndex = idx;
        };

        service.getFocusedPageIndex = function ()
        {
            return _focusedPageIndex;
        };

        return service;
    });


    // =========================================================================

    var _args = null;
    var _handler = [];

    function _setHandler(handler)
    {
        _handler.push(handler);
        if (_args)
            handler.showPDF(_args);
    }

    /**
     * public api to start the viewer
     *
     * @param pdfUri
     * @param pdfOptions
     * @param closeHandler
     */

    window.showPDF = function (pdfUri, pdfOptions, closeHandler)
    {
        _args = {
            pdfUri: pdfUri,
            pdfOptions: pdfOptions,
            closeHandler: closeHandler
        };
        _handler.forEach(function (handler)
        {
            handler.showPDF(_args);
        });
    };


    window.appSuspend = function ()
    {
        _handler.forEach(function (handler)
        {
            handler.appSuspend(_args);
        });

    };

    window.appResume = function ()
    {
        _handler.forEach(function (handler)
        {
            handler.appResume(_args);
        });
    };


})(this);