//
//  SitewaertsDocumentViewer.m
//
//  The MIT License
//
//  Copyright (c) 2013 Paul Cervenka
//  based on https://github.com/vfr/Reader
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy of this
//  software and associated documentation files (the "Software"), to deal in the Software
//  without restriction, including without limitation the rights to use, copy, modify, merge,
//  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to
//  whom the Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all copies or
//  substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
//  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
//  IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
//

#import "SitewaertsDocumentViewer.h"
#import "SDVReaderViewController.h"

@interface SitewaertsDocumentViewer () <ReaderViewControllerDelegate>

@end

@implementation SitewaertsDocumentViewer
{
    NSString *tmpCommandCallbackID;
}

#pragma mark - SitewaertsDocumentViewer methods

- (void)getSupportInfo:(CDVInvokedUrlCommand*)command
{
    NSMutableArray *array = [NSMutableArray arrayWithObjects:@"application/pdf", nil];
    NSMutableDictionary *jsonObj = [ [NSMutableDictionary alloc]
                                    initWithObjectsAndKeys :
                                    array, @"supported",
                                    nil
                                    ];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)canViewDocument:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    // result object
    NSMutableDictionary *jsonObj = [ [NSMutableDictionary alloc]
                             initWithObjectsAndKeys :
                             nil, @"status",
                             nil, @"message",
                             nil, @"missingAppId",
                             nil
                             ];
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];

    // URL
    NSString* url = [options objectForKey:@"url"];
    // CONTENT TYPE
    NSString* contentType = [options objectForKey:@"contentType"];
    NSString* contentTypePDF = @"application/pdf";
    if (url != nil && url.length > 0 && contentType != nil && contentType.length > 0 ) {
#ifdef __CORDOVA_4_0_0
	NSURL* baseUrl = [self.webViewEngine URL];
#else
	NSURL* baseUrl = [self.webView.request URL];
#endif
       if([contentType isEqualToString:contentTypePDF]){
        NSURL* absoluteURL = [[NSURL URLWithString:url relativeToURL:baseUrl] absoluteURL];
        if ([[NSFileManager defaultManager] fileExistsAtPath:absoluteURL.path]) {
            NSLog(@"[pdfviewer] path: %@", absoluteURL.path);
            ReaderDocument *document = [ReaderDocument withDocumentFilePath:absoluteURL.path password:nil];
            if (document != nil) {
                [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_OK]  forKey:@"status"];
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
            }
        } else {
            [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_NO_RESULT]  forKey:@"status"];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
        }
       }
       else{
          [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_NO_RESULT]  forKey:@"status"];
           pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
       }

    } else {
        [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_NO_RESULT]  forKey:@"status"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)viewDocument:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];

    // URL
    NSString* url = [options objectForKey:@"url"];
    if (url != nil && url.length > 0) {
#ifdef __CORDOVA_4_0_0
	NSURL* baseUrl = [self.webViewEngine URL];
#else
	NSURL* baseUrl = [self.webView.request URL];
#endif
        NSURL* absoluteURL = [[NSURL URLWithString:url relativeToURL:baseUrl] absoluteURL];

        if ([[NSFileManager defaultManager] fileExistsAtPath:absoluteURL.path]) {
            NSLog(@"[pdfviewer] path: %@", absoluteURL.path);

            ReaderDocument *document = [ReaderDocument withDocumentFilePath:absoluteURL.path password:nil];

            if (document != nil) {
                // get options from cordova
                NSMutableDictionary *viewerOptions = [options objectForKey:@"options"];
                NSLog(@"[pdfviewer] options: %@", viewerOptions);
                SDVReaderViewController *readerViewController = [[SDVReaderViewController alloc] initWithReaderDocument:document options:viewerOptions];
                readerViewController.delegate = self;
                readerViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
                readerViewController.modalPresentationStyle = UIModalPresentationFullScreen;
                NSInteger pageNumber = [[viewerOptions objectForKey:@"page"] integerValue];
                if (pageNumber != nil && pageNumber >= 1) {
                    NSLog(@"[pdfviewer] page: %i", pageNumber);
                    document.pageNumber = [NSNumber numberWithInteger:pageNumber];
                }

                [self.viewController presentViewController:readerViewController animated:YES completion:nil];
                
                // result object
                NSMutableDictionary *jsonObj = [ [NSMutableDictionary alloc]
                                                initWithObjectsAndKeys :
                                                nil, @"status",
                                                nil, @"message",
                                                nil, @"missingAppId",
                                                nil
                                                ];
                [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_OK]  forKey:@"status"];
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
                //  keep callback so another result can be sent for document close
                [pluginResult setKeepCallbackAsBool:YES];
                //  remember command for close event
                tmpCommandCallbackID = command.callbackId;
            }
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:2];
        }
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:1];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

#pragma mark - ReaderViewControllerDelegate methods

- (void)dismissReaderViewController:(ReaderViewController *)viewController {
    [self.viewController dismissViewControllerAnimated:YES completion:nil];
    //send "no result" result to trigger onClose
    // result object
    NSMutableDictionary *jsonObj = [ [NSMutableDictionary alloc]
                                    initWithObjectsAndKeys :
                                    nil, @"status",
                                    nil, @"message",
                                    nil, @"missingAppId",
                                    nil
                                    ];
    [jsonObj setObject:[NSNumber numberWithInt:CDVCommandStatus_NO_RESULT]  forKey:@"status"];
    //result status has to be OK, otherwise the cordova success callback will not be called
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonObj];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:tmpCommandCallbackID];
}

@end
