//// inspired by Microsoft Corporation
pdfLibrary = {

    loadPDF: function (file)
    {
        "use strict";
        return file.openReadAsync().then(function (stream)
        {
            return Windows.Data.Pdf.PdfDocument.loadFromStreamAsync(stream);
        });
    },
    __optimizeOptions: function (pdfPageRenderingOptions)
    {
        pdfPageRenderingOptions.bitmapEncoderId = Windows.Graphics.Imaging.BitmapEncoder.pngEncoderId;
        return pdfPageRenderingOptions;
    },

    loadPage: function (pageIndex, pdfDocument, pdfPageRenderingOptions, inMemoryFlag, tempFolder)
    {
        if (inMemoryFlag)
            return this.loadPageInMemory(pageIndex, pdfDocument,
                    pdfPageRenderingOptions);
        return this.loadPageInFile(pageIndex, pdfDocument,
                pdfPageRenderingOptions, tempFolder);
    },
    loadPageInFile: function (pageIndex, pdfDocument, pdfPageRenderingOptions, tempFolder)
    {
        pdfPageRenderingOptions = this.__optimizeOptions(
                pdfPageRenderingOptions);

        function _deleteFile(file)
        {
            if (!file)
                return WinJS.Promise.wrap(null);
            var fp = file;
            file = null;
            return fp.deleteAsync(
                    Windows.Storage.StorageDeleteOption.permanentDelete);

        }

        /**
         * @returns {WinJS.Promise}
         * @private
         */
        function _getOutputInfo()
        {

            var _canceled = false;
            var _filePointer = null;

            function _cleanup()
            {
                return WinJS.Promise.wrap(null);
            }

            return new WinJS.Promise(function (completeDispatch, errorDispatch)
            {
                // Creating file on disk to store the rendered image for a page on disk
                // This image will be stored in the temporary folder provided during VDS init
                var filename = pageIndex
                        + "-"
                        + pdfLibrary._intForFileName(
                                pdfPageRenderingOptions.destinationWidth)
                        + "x"
                        + pdfLibrary._intForFileName(
                                pdfPageRenderingOptions.destinationHeight)
                        + ".png";

                function createFile()
                {
                    // file not exists: create it
                    tempFolder.createFileAsync(filename,
                            Windows.Storage.CreationCollisionOption.replaceExisting)
                            .then(function (filePtr)
                            {
                                // created new file
                                // return the stream
                                _filePointer = filePtr;
                                return filePtr.openAsync(
                                        Windows.Storage.FileAccessMode.readWrite);
                            })
                            .then(function (os)
                            {
                                return {
                                    write: true,
                                    filePointer: _filePointer,
                                    os: os
                                };
                            })
                            .done(function (result)
                            {
                                completeDispatch(result);
                            }, function (error)
                            {
                                _cleanup().done(function ()
                                {
                                    errorDispatch(error);
                                })
                            });
                }

                try
                {

                    tempFolder.getFileAsync(filename).then(function (filePtr)
                    {
                        // file already exists: reuse it
                        // return no stream (not needed)
                        _filePointer = filePtr;
                        completeDispatch({write: false, filePointer: filePtr});
                    }, function (error)
                    {
                        if (_canceled)
                            return errorDispatch(error);
                        createFile();
                    });
                }
                catch (e)
                {
                    // may happen  on file not found (only in VS debugger ??)
                    // see https://social.msdn.microsoft.com/Forums/en-US/d650d547-c054-497d-82b0-3ed6fbe9af28/storagefoldergetfileasync-throws-exception-when-file-doesnt-exist-in-win8-rp?forum=winappswithhtml5
                    if (_canceled)
                        return errorDispatch(error);
                    createFile();
                }


            }, function ()
            {
                _canceled = true;
                return _cleanup();
            });
        }

        function _renderOutput(outputInfo)
        {
            //TODO: thread pooling

            var _canceled = false;

            function _cleanup()
            {
                //if (!_canceled)
                return WinJS.Promise.wrap(null);
                //return _deleteFile(outputInfo.filePointer);
            }

            return new WinJS.Promise(function (completeDispatch, errorDispatch)
            {
                var imageStream = outputInfo.os;
                // render to file
                var pdfPage = pdfDocument.getPage(pageIndex);

                function _close()
                {
                    // Cleaning the objects
                    if (imageStream)
                    {
                        imageStream.close();
                        imageStream = null;
                    }
                    if (pdfPage)
                    {
                        pdfPage.close();
                        pdfPage = null;
                    }
                }

                function _cancel()
                {
                    _close();
                    _cleanup().done(function ()
                    {
                        errorDispatch(
                                new WinJS.ErrorFromName("Canceled", "Canceled"))
                    });
                    return null;
                }

                if (_canceled)
                    return _cancel();

                pdfPage.renderToStreamAsync(imageStream,
                        pdfPageRenderingOptions)
                        .then(imageStream.flushAsync.bind(imageStream))
                        .then(function ()
                        {
                            return {
                                pageIndex: pageIndex,
                                imageSrc: outputInfo.filePointer
                            };
                        })
                        .done(function (result)
                        {
                            if (_canceled)
                                return _cancel();
                            _close();
                            completeDispatch(result);

                        }, function (error)
                        {
                            if (_canceled)
                                return _cancel();
                            _close();
                            errorDispatch(error);
                        });

            }, function ()
            {
                _canceled = true;
            });

        }

        function main()
        {

            var _canceled = false;

            /**
             * @type {WinJS.Promise}
             */
            var out = null;

            /**
             * @type {WinJS.Promise}
             */
            var render = null;

            return new WinJS.Promise(function (completeDispatch, errorDispatch)
            {
                out = _getOutputInfo();
                out.done(function (outputInfo)
                {
                    out = null;

                    if (!outputInfo.write && outputInfo.filePointer)
                    {
                        // reuse existing file
                        completeDispatch({
                            pageIndex: pageIndex,
                            imageSrc: outputInfo.filePointer
                        });
                        return;
                    }

                    render = _renderOutput(outputInfo).done(
                            function (result)
                            {
                                render = null;
                                completeDispatch(result);
                            },
                            function (error)
                            {
                                render = null;
                                errorDispatch(error);
                            }
                    );

                }, function (error)
                {
                    out = null;
                    errorDispatch(error);
                });

            }, function ()
            {
                _canceled = true;
                if (out)
                {
                    out.cancel();
                    out = null;
                }
                if (render)
                {
                    render.cancel();
                    render = null;
                }
            });


        }

        return main();


    },
    loadPageInMemory: function (pageIndex, pdfDocument, pdfPageRenderingOptions)
    {
        return new WinJS.Promise(function (completeDispatch, errorDispatch)
        {

            pdfPageRenderingOptions = this.__optimizeOptions(
                    pdfPageRenderingOptions);

            var imageStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();

            // render to memory
            var pdfPage = pdfDocument.getPage(pageIndex);

            function _close()
            {
                // Cleaning the objects
                imageStream.close();
                pdfPage.close();
            }

            pdfPage.renderToStreamAsync(imageStream,
                    pdfPageRenderingOptions)
                    .then(imageStream.flushAsync.bind(imageStream))
                    .then(function ()
                    {
                        var renderStream = Windows.Storage.Streams.RandomAccessStreamReference.createFromStream(
                                imageStream);
                        renderStream.openReadAsync().then(
                                function (stream)
                                {
                                    return {
                                        pageIndex: pageIndex,
                                        imageSrc: stream
                                    };

                                });
                    })
                    .done(function (result)
                    {
                        _close();
                        completeDispatch(result);
                    }, function (error)
                    {
                        _close();
                        errorDispatch(error);
                    });


        });
    },
    // private utility function to create random string used as a file name
    _intForFileName: function (integer)
    {
        if (integer)
            return "" + integer;
        return "a";
    }
};