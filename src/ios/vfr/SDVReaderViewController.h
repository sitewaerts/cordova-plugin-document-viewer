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

typedef enum
{
    SDVReaderContentViewModeSinglePage = 0,
    SDVReaderContentViewModeDoublePage,
    SDVReaderContentViewModeCoverDoublePage
} SDVReaderContentViewMode;

@interface SDVReaderViewController : ReaderViewController
@property NSMutableDictionary *viewerOptions;
@property int pagesPerScreen;
@property SDVReaderContentViewMode viewMode;

- (instancetype)initWithReaderDocument:(ReaderDocument *)object options:(NSMutableDictionary *)options linkHandler:(void (^)(NSString*, void (^)(void)))linkHandler;

- (void)layoutContentViews:(UIScrollView *)scrollView;

- (void)updateContentSize:(UIScrollView *)scrollView;

- (void)decrementPageNumber;

- (void)incrementPageNumber;

@end
