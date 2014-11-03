//
//  SDVReaderViewController.h
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderConstants.h"
#import "ReaderViewController.h"

#import <UIKit/UIKit.h>

@interface SDVReaderViewController : ReaderViewController
@property NSMutableDictionary *viewerOptions;

- (instancetype)initWithReaderDocument:(ReaderDocument *)object options:(NSMutableDictionary *)options;

@end
