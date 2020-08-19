(function (window) {
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
        return function (eventInfo) {
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


    window.onerror = function (msg, url, line, col, error) {
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


    function _eventLogger(element)
    {
        var events = [
            'MSPointerDown',
            'MSPointerUp',
            'MSPointerCancel',
            'MSPointerMove',
            'MSPointerOver',
            'MSPointerOut',
            'MSPointerEnter',
            'MSPointerLeave',
            'MSGotPointerCapture',
            'MSLostPointerCapture',
            'pointerdown',
            'pointerup',
            'pointercancel',
            'pointermove',
            'pointerover',
            'pointerout',
            'pointerenter',
            'pointerleave',
            'gotpointercapture',
            'lostpointercapture',
            'touchstart',
            'touchmove',
            'touchend',
            'touchenter',
            'touchleave',
            'touchcancel',
            'mouseover',
            'mousemove',
            'mouseout',
            'mouseenter',
            'mouseleave',
            'mousedown',
            'mouseup',
            'focus',
            'blur',
            'click',
            'webkitmouseforcewillbegin',
            'webkitmouseforcedown',
            'webkitmouseforceup',
            'webkitmouseforcechanged'
        ];

        function report(e)
        {
            console.log("event logger [" + e.type + "]", e, element);
        }

        for (var i = 0; i < events.length; i++)
            element.addEventListener(events[i], report, false);
    }

    $.fn.scrollLeftTo = function (target, options, callback) {
        if (typeof options === 'function' && arguments.length === 2)
        {
            callback = options;
            options = target;
        }
        var settings = $.extend({
            scrollTarget: target,
            offsetLeft: 50,
            duration: 500,
            easing: 'swing'
        }, options);
        return this.each(function () {
            var scrollPane = $(this);

            var scrollX = -1;

            if (typeof settings.scrollTarget === "number")
            {
                scrollX = settings.scrollTarget;
            }
            else
            {
                if (settings.scrollTarget)
                {
                    var scrollTarget = $(settings.scrollTarget);
                    if (scrollTarget[0] && scrollTarget.offset())
                        scrollX = scrollTarget.offset().left
                                + scrollPane.scrollLeft() - (scrollPane.width()
                                        / 2)
                                + (scrollTarget.outerWidth() / 2);
                }
            }


            if (scrollX >= 0)
            {
                scrollPane.animate({scrollLeft: scrollX},
                        parseInt(settings.duration), settings.easing,
                        function () {
                            if (typeof callback === 'function')
                            {
                                callback.call(this);
                            }
                        });
            }
            else
            {
                if (typeof callback === 'function')
                {
                    callback.call(this);
                }
            }
        });
    };

    var module = angular.module('viewer', ['winjs'], null);

    module.run(function ($rootScope) {
        $rootScope.$on("app.suspending", _onSuspending);
        $rootScope.$on("app.resuming", _onResuming);
    });


    module.factory('log', function ($window) {
        return $window.console;
    });

    module.config([
        '$compileProvider',
        function ($compileProvider) {
            // ms-appx|ms-appx-web ??
            //$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
            $compileProvider.imgSrcSanitizationWhitelist(
                    /^\s*(blob|file|local|data):/);
        }
    ]);


    module.directive('backgroundImage', function () {
        return function (scope, element, attrs) {
            scope.$watch(attrs.backgroundImage, function (newValue) {
                if (newValue && newValue.length > 0)
                    element.css('background-image', 'url("' + newValue + '")');
                else
                    element.css('background-image', '');
            });
        };
    });

    module.directive('interactionObserver', function ($timeout) {
        return function (scope, element, attrs) {

            var pointer = {};
            var mouse = {};
            var touch = {};
            var pen = {};

            var timeout = 3000;

            scope.interaction = {
                pointer: pointer,
                mouse: mouse,
                touch: touch,
                pen: pen
            };

            function Observer(model, onActive)
            {

                var _endIt;

                function _detected()
                {
                    if (_endIt)
                    {
                        $timeout.cancel(_endIt);
                        _endIt = null;
                    }
                    _endIt = $timeout(function () {
                        _endIt = null;
                        _deactivate();
                    }, timeout);

                    if (!model.detected || !model.active)
                    {
                        model.detected = true;
                        model.active = true;
                        scope.$evalAsync(function () {
                            if (onActive)
                                onActive();
                        });
                    }
                }

                function _deactivate()
                {
                    if (_endIt)
                    {
                        $timeout.cancel(_endIt);
                        _endIt = null;
                    }
                    if (model.active)
                    {
                        model.active = false;
                        scope.$evalAsync(function () {
                        });
                    }
                }

                this.onActivity = function () {
                    _detected();
                };

                this.deactivate = function () {
                    _deactivate();
                };
            }

            var _pointer = new Observer(pointer, function () {
            });

            var _mouse = new Observer(mouse, function () {
                _touch.deactivate();
                _pen.deactivate();
            });
            var _touch = new Observer(touch, function () {
                _mouse.deactivate();
                _pen.deactivate();
            });
            var _pen = new Observer(pen, function () {
                _touch.deactivate();
                _mouse.deactivate();
            });

            var _handlers = {
                'mouse': {
                    onActivity: _mouse.onActivity.bind(_mouse)
                },
                'touch': {
                    onActivity: _touch.onActivity.bind(_touch)
                },
                'pen': {
                    onActivity: _pen.onActivity.bind(_pen)
                }
            };

            function _onPointerActivity(e)
            {
                _pointer.onActivity(e);
                var device = e.pointerType;
                var h = _handlers[device];
                if (h)
                    h.onActivity(e);
            }

            element.on(
                    "pointerenter pointerleave pointermove pointerout pointerover pointerup pointerdown",
                    _onPointerActivity)
        };
    });

    module.factory('views', function () {
        var _views = {
            loading: {
                id: 'loading',
                template: 'loading.html'
            },
            pageflow: {
                id: 'pageflow',
                template: 'pageflow.html'
            },
            outline: {
                id: 'outline',
                template: 'outline.html'
            },
            tiles: {
                id: 'tiles',
                template: 'tiles.html'
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


    module.controller('PdfViewerCtrl', function ($scope, pdfViewer, views) {
        var ctrl = this;

        function _setView(id)
        {
            if (!ctrl.view || ctrl.view.id !== id)
                ctrl.view = views.getView(id);
        }

        ctrl.setView = _setView;

        ctrl.gotoPage = function (pageIndex, viewId) {
            if (pageIndex == null)
                return;

            ctrl.setFocusedPageIndex(pageIndex);

            if (viewId)
                ctrl.setView(viewId);
        };

        ctrl.close = pdfViewer.close.bind(pdfViewer);

        ctrl.setFocusedPageIndex = pdfViewer.setFocusedPageIndex.bind(
                pdfViewer);

        ctrl.error = {
            message: null,
            dialog: {
                winControl: null,
                show: function () {
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
                hide: function () {
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

    module.factory('ViewCtrlBase', function ($q, $window, pdfViewer) {

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
                else return $q(function (resolve, reject) {
                    var remove = $scope.$watch(function () {
                        return ctrl.viewWinControl;
                    }, function (viewWinControl) {
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
            $scope.$on('$destroy', function () {
                $window.removeEventListener("resize", resize);
            });

            $scope.$on('$destroy', close);
        }

        return ViewCtrlBase;
    });

    module.factory('ViewCtrlPagesBase',
            function ($q, $timeout, $interval, $window, pdfViewer, ViewCtrlBase) {

                function ViewCtrlPagesBase($scope, opts)
                {
                    var ctrl = this;
                    ViewCtrlBase.call(ctrl, $scope);

                    var localScope = $scope.$new();
                    localScope.ctrl = ctrl;

                    ctrl.options = angular.extend(
                            {
                                containerMargin: 5,
                                isIgnoringHighContrast: false,
                                highRes : false,
                                verticalCutOff: 50,
                                horizontalCutOff: 0
                            },
                            opts);


                    var _tmp = null;

                    function getTemp()
                    {
                        if (ctrl.options.inMemory || _tmp)
                            return $q.when(_tmp);
                        return pdfViewer.getTemp().then(function (tmp) {
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

                        var rawViewWidth = viewWidth - ctrl.options.horizontalCutOff;
                        rawViewWidth = rawViewWidth - (2 * margin); // left and right

                        var containerWidth = Math.floor(rawViewWidth);

                        var imageHeight = Math.max(window.screen.width, window.screen.height) / rows;

                        var zoomFactor = 1;
                        var resolutionFactor = 1;
                        if (ctrl.options.highRes)
                        {
                            // zoomFactor = 1.3;
                            // the use of dip should automatically apply the devicePixelRatio factor (but it actually doesn't)
                            resolutionFactor = window.devicePixelRatio;
                        }

                        // init listeners etc.
                        _getScrollContainer();

                        return {
                            viewWidth: rawViewWidth,
                            viewHeight: rawViewHeight,
                            containerWidth: containerWidth,
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

                        if (!ctrl._viewInfo || !angular.equals(ctrl._viewInfo, newViewInfo))
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

                    ctrl.getGroupInfo = function () {
                        return ctrl.groupInfo;
                    };

                    ctrl.getItemInfo = function (index) {
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

                        this.setImageSrc = function (url, revoker) {
                            if (page.imageSrc !== url)
                            {
                                _clearImageSrc();
                                page.imageSrc = url;
                                _imageSrc_revoker = revoker;
                            }
                        };

                        this.close = function () {
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
                        var _dimRelation = _pdfPage.size.width / _pdfPage.size.height;

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
                            if (_pdfOptionsChecksum !== pdfOptionsChecksum
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
                                    === _pdfOptionsChecksum)
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
                                cancel: function () {
                                    if (generator.canceled)
                                        return;

                                    generator.canceled = true;
                                    if (generator.promise)
                                        generator.promise.cancel();
                                },
                                applyResult: function (pi) {
                                    try
                                    {
                                        if (generator.canceled || _generator
                                                !== generator)
                                            return;

                                        _dirty = false;
                                        _generator = null;

                                        var srcObject = pi.imageSrc;

                                        $scope.$evalAsync(function () {
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
                                applyError: function (error) {

                                    if (generator.canceled || _generator
                                            !== generator)
                                        return;

                                    window.console.error(error);

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
                                if (_unregisterOnSuspending)
                                {
                                    _unregisterOnSuspending();
                                    _unregisterOnSuspending = null;
                                }
                                generator.cancel();
                            }

                            // force async exec
                            $scope.$applyAsync(function () {
                                if (generator.canceled)
                                    return;

                                // if (webUIApp)
                                //     webUIApp.addEventListener("suspending",
                                //             _onSuspending);
                                _unregisterOnSuspending = $scope.$on(
                                        "app.suspending", _onSuspending);

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

                        this.prepareDimensions = function () {
                            return _updateViewIfNecessary();
                        };

                        // called when view dimensions may have changed
                        this.triggerRefresh = function () {
                            if (_isViewUpToDate())
                                return;
                            _updateView();

                            if (!page.imageSrc && !_generator)
                                return; // not yet loaded/loading --> no refresh necessary
                            $scope.$applyAsync(_load);
                        };

                        // called when image src is definitely needed (item is rendered)
                        this.triggerLoad = function (async) {
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
                        var DataAdapter = WinJS.Class.define(function () {
                        }, {
                            getCount: function () {
                                return WinJS.Promise.wrap(pages.length);
                            },

                            // Called by the virtualized data source to fetch items
                            // It will request a specific item and optionally ask for a number of items on either side of the requested item.
                            // The implementation should return the specific item and, in addition, can choose to return a range of items on either
                            // side of the requested index. The number of extra items returned by the implementation can be more or less than the number requested.

                            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                                if (requestIndex >= pages.length)
                                    return WinJS.Promise.wrapError(
                                            new WinJS.ErrorFromName(
                                                    WinJS.UI.FetchError.doesNotExist));

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
                                    atStart: fetchIndex === 0,
                                    atEnd: fetchIndex === pages.length - 1
                                });
                            }
                        });

                        var DataSource = WinJS.Class.derive(
                                WinJS.UI.VirtualizedDataSource,
                                function () {
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
                            if (rows === 1)
                            {
                                cellWidth = ctrl.options.containerMargin;
                            }
                            else
                            {
                                cellWidth = 0;
                            }

                            var cellHeight = ctrl.groupInfo.cellHeight;

                            if (rows !== 1)
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
                                if (rows === 1)
                                {
                                    // calc needed number of cells spanned
                                    page.itemInfo.width = (Math.floor(page.width
                                            / cellWidth)) * cellWidth;
                                    // if (page.width % cellWidth !== 0)
                                    //     page.itemInfo.width = page.itemInfo.width
                                    //             + cellWidth;
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

                        $scope.$applyAsync(function () {
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
                                        === "viewPortLoaded";
                            }

                            if (isStateOK())
                                return $q.when(winControl);
                            else
                                return $q(function (resolve, reject) {

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

                        _updateNav();
                    }


                    ctrl.close = function () {
                        if (ctrl.pages)
                            ctrl.pages.close();
                        delete ctrl.pages;
                    };

                    ctrl.resize = function () {
                        var i = ctrl.viewWinControl.indexOfFirstVisible;
                        $scope.$evalAsync(
                                function () {
                                    _refreshView();
                                    ctrl.viewWinControl.indexOfFirstVisible = i;
                                    $scope.$applyAsync(function () {
                                        ctrl.viewWinControl.indexOfFirstVisible = i;
                                    });
                                }
                        );
                    };


                    var _nav = ctrl.nav = {
                        scrollLeft: null,
                        scrollRight: null
                    };

                    function _scrollLeft()
                    {
                        if (_nav.nextLeftIndex != null)
                            ctrl.focusPage(_nav.nextLeftIndex);
                        else if (_nav.nextLeftPixel != null)
                            ctrl.scrollToPixel(_nav.nextLeftPixel);
                    }

                    function _scrollRight()
                    {
                        if (_nav.nextRightIndex != null)
                            ctrl.focusPage(_nav.nextRightIndex);
                        else if (_nav.nextRightPixel != null)
                            ctrl.scrollToPixel(_nav.nextRightPixel);
                    }

                    function _noNav()
                    {
                        _noLeftNav();
                        _noRightNav();
                    }

                    function _noLeftNav()
                    {
                        delete _nav.nextLeftIndex;
                        delete _nav.nextLeftPixel;
                        delete _nav.scrollLeft;
                    }

                    function _noRightNav()
                    {
                        delete _nav.nextRightIndex;
                        delete _nav.nextRightPixel;
                        delete _nav.scrollRight;
                    }

                    var _scrollAnimationRunning = false;

                    function _updateNav()
                    {
                        if (_scrollAnimationRunning)
                            return;

                        if (!ctrl.viewWinControl || !ctrl.pages
                                || !ctrl.pages.list)
                            return _noNav();

                        var _vwc = ctrl.viewWinControl;
                        var sc = _getScrollContainer();
                        //var sp = _vwc.scrollPosition;
                        var sp = sc.scrollLeft;
                        var width = _vwc.element.clientWidth;


                        if (!ctrl.zoom.zoomed)
                        {
                            var fvIdx = _vwc.indexOfFirstVisible;
                            var lvIdx = _vwc.indexOfLastVisible;
                            var length = ctrl.pages.list.length;

                            var fvE = _vwc.elementFromIndex(fvIdx);
                            if (!fvE || !fvE.offsetParent)
                                return _noNav();

                            var fvEOffset = fvE.offsetParent.offsetLeft;
                            var nextLeftIndex = fvEOffset < sp ?
                                    fvIdx // scroll the first item to be fully visible
                                    : fvIdx - 1; // scroll to the next left item

                            var lvE = _vwc.elementFromIndex(lvIdx);
                            if (!lvE || !lvE.offsetParent)
                                return _noNav();

                            var lvEOffset = lvE.offsetParent.offsetLeft;
                            var nextRightIndex = (lvEOffset + lvE.offsetWidth) > (sp + width) ?
                                    lvIdx // scroll the last item to be fully visible
                                    : lvIdx + 1; // scroll to the next right item


                            if (nextLeftIndex >= 0)
                            {
                                _nav.nextLeftIndex = nextLeftIndex;
                                delete _nav.nextLeftPixel;
                                _nav.scrollLeft = _scrollLeft;
                            }
                            else
                            {
                                _noLeftNav();
                            }

                            if (nextRightIndex < length)
                            {
                                _nav.nextRightIndex = nextRightIndex;
                                delete _nav.nextRightPixel;
                                _nav.scrollRight = _scrollRight;
                            }
                            else
                            {
                                _noRightNav();
                            }

                        }
                        else
                        {

                            var totalWidth = sc.scrollWidth;
                            var maxScrollLeft = _fixedScrollPos(totalWidth, totalWidth, width * -1, ctrl.zoom.factor);

                            if (sp > 0)
                            {
                                delete _nav.nextLeftIndex;
                                _nav.nextLeftPixel = Math.max(0,
                                        _fixedScrollPos(totalWidth, sp, width * -1, ctrl.zoom.factor));
                                _nav.scrollLeft = _scrollLeft;
                            }
                            else
                            {
                                _noLeftNav();
                            }

                            if (sp < maxScrollLeft)
                            {
                                delete _nav.nextRightIndex;
                                // browser will auto fix values which exceed the limit
                                _nav.nextRightPixel = _fixedScrollPos(totalWidth, sp, width, ctrl.zoom.factor);
                                _nav.scrollRight = _scrollRight;
                            }
                            else
                            {
                                _noRightNav();
                            }

                        }


                    }

                    localScope.$watch('ctrl.viewWinControl.indexOfFirstVisible', _updateNav);
                    localScope.$watch('ctrl.viewWinControl.indexOfLastVisible', _updateNav);
                    localScope.$watch('ctrl.viewWinControl.scrollPosition', _updateNav);
                    localScope.$watch('ctrl.pages.list.length', _updateNav);

                    var _fixedScrollPos = function (scrollWidth, start, delta, zoomFactor) {
                        if (zoomFactor != null && zoomFactor * 100 !== 100)
                        {
                            // hack: edge calculates wrong scrollLeft, width etc. when zoomed
                            return Math.floor(((start * zoomFactor) + delta) / zoomFactor);
                        }
                        return start + delta;
                    };

                    function _addMouseDragScroll(scrollable)
                    {
                        if (!scrollable || scrollable._mouseDragScroll)
                            return;

                        scrollable._mouseDragScroll = true;

                        //_eventLogger(scrollable);

                        scrollable.ondragstart = function () {
                            return false;
                        };

                        function _isMouseEvent(event)
                        {
                            return event && event.pointerType === 'mouse';
                        }

                        function _onScrollStart(event)
                        {
                            if (!_isMouseEvent(event))
                                return;

                            // event.preventDefault();
                            // event.stopPropagation();
                            // event.stopImmediatePropagation();

                            var target = event.target;

                            var zoom = _zoomForElement(scrollable);
                            var sw = scrollable.scrollWidth;
                            var sh = scrollable.scrollHeight;

                            var _mouseStartX = event.pageX;
                            var _scrollStartX = scrollable.scrollLeft;
                            var _mouseStartY = event.pageY;
                            var _scrollStartY = scrollable.scrollTop;
                            var _moved = false;
                            var _capturedPointerId = null;

                            function _onScroll(event)
                            {
                                if (!_isMouseEvent(event))
                                    return;

                                // event.preventDefault();
                                // event.stopPropagation();
                                // event.stopImmediatePropagation();


                                if (!_moved)
                                {
                                    // this is a scroll situation:
                                    // capture the event to tell others that
                                    // they must cancel their pending tasks (e.g. click)
                                    _moved = true;
                                    _capturedPointerId = event.pointerId;
                                    target.setPointerCapture(event.pointerId);
                                }

                                var sl = _fixedScrollPos(
                                        sw, _scrollStartX, _mouseStartX
                                        - event.pageX, zoom);
                                var st = _fixedScrollPos(
                                        sh, _scrollStartY, _mouseStartY
                                        - event.pageY, zoom);

                                scrollable.scrollLeft = sl;
                                scrollable.scrollTop = st;
                            }

                            function _onScrollEnd(event)
                            {
                                // event.preventDefault();
                                // event.stopPropagation();
                                // event.stopImmediatePropagation();

                                target.removeEventListener('pointermove', _onScroll);
                                target.removeEventListener('pointerup', _onScrollEnd);
                                //scrollable.removeEventListener('pointerout', _onScrollEnd);
                                target.removeEventListener('lostpointercapture', _onScrollEnd);
                                target.removeEventListener('pointercancel', _onScrollEnd);

                                if (_moved && _capturedPointerId === event.pointerId)
                                {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    event.stopImmediatePropagation();

                                    target.releasePointerCapture(event.pointerId);
                                    _onScroll(event);
                                }

                                scrollable.addEventListener('pointerdown', _onScrollStart);
                            }

                            scrollable.removeEventListener('pointerdown', _onScrollStart);

                            target.addEventListener('pointermove', _onScroll);
                            target.addEventListener('pointerup', _onScrollEnd);
                            //scrollable.addEventListener('pointerout', _onScrollEnd, false);
                            target.addEventListener('lostpointercapture', _onScrollEnd);
                            target.addEventListener('pointercancel', _onScrollEnd);
                        }

                        scrollable.addEventListener('pointerdown', _onScrollStart);
                    }

                    function _getScrollContainer()
                    {
                        if (!ctrl.viewWinControl)
                            return null;
                        var e = ctrl.viewWinControl.element.querySelector('.win-viewport.win-horizontal');

                        if (e && !e._zoomListener)
                        {
                            e._zoomListener = true;
                            e.addEventListener("MSContentZoom", _$updateZoom);
                        }

                        _addMouseDragScroll(e);
                        return e;
                    }

                    function _get$ScrollContainer()
                    {
                        var e = _getScrollContainer();
                        if (!e)
                            return null;
                        return $(e);
                    }

                    function _getPageElement(idx)
                    {
                        if (!ctrl.viewWinControl || !ctrl.pages || !ctrl.pages.list)
                            return null;
                        if (idx == null)
                            return null;
                        if (idx < 0)
                            return null;

                        var length = ctrl.pages.list.length;
                        if (idx > length - 1)
                            return null;

                        var _vwc = ctrl.viewWinControl;

                        return _vwc.elementFromIndex(idx);
                    }

                    function _getPageScrollPos(idx)
                    {
                        var e = _getPageElement(idx);
                        if (!e)
                            return null;
                        return e.offsetParent.offsetLeft;
                    }

                    function _isFullyVisible(idx)
                    {
                        var e = _getPageElement(idx);
                        if (!e)
                            return false;

                        var _vwc = ctrl.viewWinControl;
                        var sc = _getScrollContainer();
                        //var sp = _vwc.scrollPosition;
                        var sp = sc.scrollLeft;
                        var width = _vwc.element.clientWidth;

                        var offset = e.offsetParent.offsetLeft;
                        if (offset < sp)
                            return false;
                        return (offset + e.offsetWidth) <= (sp + width);
                    }


                    ctrl.ensurePageFocused = function (pageIndex) {
                        if (_isFullyVisible(pageIndex))
                            return false;
                        ctrl.focusPage(pageIndex);
                        return true;
                    };

                    ctrl.focusPage = function (pageIndex) {
                        if (pageIndex == null)
                            return;
                        if (!ctrl.viewWinControl)
                            return;

                        var pixel = _getPageScrollPos(pageIndex);
                        if (pixel == null)
                            return;

                        var sc = _getScrollContainer();
                        var sp = sc.scrollLeft;
                        if (sp < pixel)
                        {
                            var _vwc = ctrl.viewWinControl;
                            var width = _vwc.element.clientWidth;
                            // scroll right --> adjust on right side
                            pixel = pixel - width + _getPageElement(pageIndex).offsetWidth
                        }

                        pdfViewer.setFocusedPageIndex(pageIndex);
                        ctrl.scrollToPixel(pixel);

                        // ctrl.viewWinControl.ensureVisible(pageIndex);
                        //ctrl.viewWinControl.recalculateItemPosition();
                    };

                    ctrl.scrollToPixel = function (pixel) {
                        if (pixel == null)
                            return;
                        if (!ctrl.viewWinControl)
                            return;
                        //ctrl.viewWinControl.scrollPosition = pixel;
                        _scrollAnimationRunning = true;
                        _get$ScrollContainer().scrollLeftTo(pixel, function () {
                            // done
                            _scrollAnimationRunning = false;
                            $scope.$evalAsync(function () {
                                _updateNav();
                            });

                        });
                    };

                    var _zoomLevels = [1, 1.5, 2, 3];

                    function _findNextZoomLevelUp(current)
                    {
                        for (var i = 0; i < _zoomLevels.length; i++)
                        {
                            var zl = _zoomLevels[i];
                            if (zl > current)
                                return zl;
                        }
                        return null;
                    }

                    function _findNextZoomLevelDown(current)
                    {
                        for (var i = _zoomLevels.length - 1; i >= 0; i--)
                        {
                            var zl = _zoomLevels[i];
                            if (zl < current)
                                return zl;
                        }
                        return null;
                    }

                    function _zoom(factor)
                    {
                        return _zoomForElement(_getScrollContainer(), factor);
                    }

                    function _zoomForElement(element, factor)
                    {
                        var result = null;
                        if (element)
                        {
                            result = element.msContentZoomFactor.toFixed(2);
                            if (factor != null)
                                element.msContentZoomFactor = factor;
                        }
                        if (isNaN(result) || result == null || result === "")
                            return 1;
                        return result;
                    }

                    ctrl.zoom = {
                        factor: 1,
                        zoomed: false,
                        forward: function () {
                            var current = _zoom();
                            var next = _findNextZoomLevelUp(current);
                            if (next == null)
                                next = _zoomLevels[0];
                            _zoom(next);
                        },
                        zoomIn: function () {
                            var current = _zoom();
                            var next = _findNextZoomLevelUp(current);
                            if (next != null)
                                _zoom(next);
                        },
                        zoomOut: function () {
                            var current = _zoom();
                            var next = _findNextZoomLevelDown(current);
                            if (next != null)
                                _zoom(next);
                        }
                    };

                    function _$updateZoom()
                    {
                        var newZoom = _zoom();
                        if (ctrl.zoom.factor !== newZoom)
                        {
                            ctrl.zoom.factor = newZoom;
                            ctrl.zoom.zoomed = ctrl.zoom.factor * 100 !== 100;
                            $scope.$evalAsync(function () {
                                _updateNav();
                            });
                        }
                    }

                    // function _updateZoom()
                    // {
                    //     ctrl.zoom.factor = _zoom();
                    //     ctrl.zoom.zoomed = ctrl.zoom.factor * 100 !== 100;
                    //     _updateNav();
                    // }
                    //
                    // localScope.$watch('ctrl.viewWinControl.element.style.zoom',
                    //         _updateZoom);
                    //
                    //
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

    module.controller('PageflowViewCtrl', function (ViewCtrlPagesBase, $scope) {
        var ctrl = this;
        ViewCtrlPagesBase.call(ctrl, $scope, {
            rows: 1,
            inMemory: false,
            pagesToLoad: 2,
            highRes : true,
            verticalCutOff: 50,
            horizontalCutOff: 0
        });
    });


    module.controller('TilesViewCtrl', function (ViewCtrlPagesBase, $scope) {
        var ctrl = this;
        ViewCtrlPagesBase.call(ctrl, $scope, {
            rows: 4,
            inMemory: false,
            pagesToLoad: 2,
            highRes : false,
            verticalCutOff: 50,
            horizontalCutOff: 0
        });
    });


    module.controller('OutlineViewCtrl',
            function (ViewCtrlBase, $scope, pdfViewer) {
                var ctrl = this;
                ViewCtrlBase.call(ctrl, $scope);

                function _showOutline()
                {
                    ctrl.outline = pdfViewer.doc.outline;
                }

                pdfViewer.waitForPDF().then(_showOutline);
            });


    module.factory('pdfViewer', function ($rootScope, $q, log) {
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
                    .then(function (file) {
                        return $q.all([loadPDF(file), loadPDFOutline(pdfUri)]);
                    })
                    .done(function () {
                        $rootScope.$broadcast(EVENTS.SHOW_PDF);
                    }, _onError);

            function loadFile(fileUri)
            {
                var uri = new Windows.Foundation.Uri(fileUri);
                return Windows.Storage.StorageFile.getFileFromApplicationUriAsync(
                        uri).then(
                        function (file) {
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
                        function (pdfDocument) {
                            if (!pdfDocument)
                                throw new Error(
                                        {message: "pdf file cannot be loaded"});

                            // Updating details of file currently loaded
                            service.doc.file.pdf = pdfDocument;
                            $rootScope.$broadcast(EVENTS.LOADING_PDF);

                            return getCleanTemp().then(function () {
                                return pdfDocument
                            });
                        });

            }

            function loadPDFOutline(fileUri)
            {
                // TODO: Password protected file? user should provide a password to open the file

                PDFJS.disableWorker = true;
                PDFJS.workerSrc = 'js/pdfjs-dist/pdf.worker.js';

                return $q(function (resolve, reject) {


                    function onError(error)
                    {
                        log.info("cannot load outline for pdf", fileUri,
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

                            items.forEach(function (item) {
                                getPageIndex(item).then(
                                        function (pageIndex) {
                                            if (pageIndex != null)
                                                item.pageIndex = pageIndex;
                                            else
                                                delete item.pageIndex;
                                        },
                                        function (error) {
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
                            return $q(function (resolve, reject) {
                                var dest = item.dest;
                                var destProm;
                                if (typeof dest === 'string')
                                    destProm = pdf.getDestination(dest);
                                else
                                    destProm = Promise.resolve(dest);

                                destProm.then(function (destination) {
                                    if (!(destination instanceof Array))
                                    {
                                        reject(destination);
                                        return; // invalid destination
                                    }

                                    var destRef = destination[0];

                                    pdf.getPageIndex(destRef).then(
                                            function (pageIndex) {
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

                    PDFJS.getDocument(fileUri).then(function (pdf) {
                        pdf.getOutline().then(function (outline) {
                            onSuccess(pdf, outline);
                        }, onError);
                    }, onError);
                });
            }
        }

        _setHandler({
            showPDF: function (args) {
                _showPdf(args);
            },
            appSuspend: function () {
                $rootScope.$broadcast("app.suspend");
            },
            appResume: function () {
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


        service.close = function () {
            closeHandler();
        };

        service.onPDFLoading = function (handler) {
            function _handler()
            {
                $rootScope.$applyAsync(handler);
            }

            if (pdfUri)
                _handler();
            return $rootScope.$on(EVENTS.LOADING_PDF, _handler);
        };

        service.onPDFLoaded = function (handler) {
            function _handler()
            {
                $rootScope.$applyAsync(handler);
            }

            if (service.isPDFLoaded())
                _handler();
            return $rootScope.$on(EVENTS.SHOW_PDF, _handler);
        };

        service.isPDFLoaded = function () {
            return service.doc && service.doc.file && service.doc.file.pdf;
        };

        service.waitForPDF = function () {
            if (service.isPDFLoaded())
                return $q.when();
            return $q(function (resolve, reject) {
                var removeLoaded = service.onPDFLoaded(function notify() {
                    cleanup();
                    resolve();
                });

                var removeError = service.onPDFError(function notify() {
                    cleanup();
                    reject();
                });


                function cleanup()
                {
                    // if(removeLoaded)
                    removeLoaded();
                    // if(removeError)
                    removeError();
                }

            });
        };


        service.onPDFError = function (handler) {
            function _handler()
            {
                $rootScope.$applyAsync(handler);
            }

            return $rootScope.$on(EVENTS.ERROR, _handler);
        };

        var _focusedPageIndex = 0;

        service.setFocusedPageIndex = function (idx) {
            _focusedPageIndex = idx;
        };

        service.getFocusedPageIndex = function () {
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

    window.showPDF = function (pdfUri, pdfOptions, closeHandler) {
        _args = {
            pdfUri: pdfUri,
            pdfOptions: pdfOptions,
            closeHandler: closeHandler
        };
        _handler.forEach(function (handler) {
            handler.showPDF(_args);
        });
    };


    window.appSuspend = function () {
        _handler.forEach(function (handler) {
            handler.appSuspend(_args);
        });

    };

    window.appResume = function () {
        _handler.forEach(function (handler) {
            handler.appResume(_args);
        });
    };


})(this);
