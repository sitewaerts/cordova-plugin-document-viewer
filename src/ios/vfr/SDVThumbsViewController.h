//
//  SDVThumbsViewController.h
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ThumbsViewController.h"

@interface SDVThumbsViewController : ThumbsViewController
{
    UITableView *theOutlineView;
}
@property NSMutableDictionary *viewerOptions;
@property NSArray *documentOutline;

- (instancetype)initWithReaderDocument:(ReaderDocument *)object options:(NSMutableDictionary *)options;

@end
