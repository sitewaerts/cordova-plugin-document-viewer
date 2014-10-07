//
//  CDVPDFViewer.m
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

#import "CDVPDFViewer.h"

@implementation CDVPDFViewer

- (void)showPDF:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = nil;
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];

    // URL
    NSString* url = [options objectForKey:@"url"];    
    if (url != nil && url.length > 0) {

        NSURL* absoluteURL = [[NSURL URLWithString:url relativeToURL:[self.webView.request URL]] absoluteURL];
        
        if ([[NSFileManager defaultManager] fileExistsAtPath:absoluteURL.path]) {
            NSLog(@"[pdfviewer] path: %@", absoluteURL.path);
            
            ReaderDocument *document = [ReaderDocument withDocumentFilePath:absoluteURL.path password:nil];
            
            if (document != nil) {
                ReaderViewController *readerViewController = [[ReaderViewController alloc] initWithReaderDocument:document];
                readerViewController.delegate = self;
                readerViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
                readerViewController.modalPresentationStyle = UIModalPresentationFullScreen;
                                
                [self.viewController presentViewController:readerViewController animated:YES completion:nil];
                
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            }
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:2];
        }
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:1];
    }
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)dismissReaderViewController:(ReaderViewController *)viewController {
    [self.viewController dismissViewControllerAnimated:YES completion:nil];
}

@end