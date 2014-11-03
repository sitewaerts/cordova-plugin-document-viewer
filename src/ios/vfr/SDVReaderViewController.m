//
//  SDVReaderViewController.m
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "SDVReaderViewController.h"
#import "ReaderViewController+SDVReaderViewControllerPassThrough.h"
#import "SDVReaderMainToolbar.h"
#import "SDVThumbsViewController.h"

@implementation SDVReaderViewController

#pragma mark - Constants

#define STATUS_HEIGHT 20.0f

#define TOOLBAR_HEIGHT 44.0f
#define PAGEBAR_HEIGHT 48.0f

#define SCROLLVIEW_OUTSET_SMALL 4.0f
#define SCROLLVIEW_OUTSET_LARGE 8.0f

#define TAP_AREA_SIZE 48.0f

//TODO understand how delegation works and why this works if it is not synthesized although none of the delegation stuff of the superclass is in the public header
//@synthesize delegate;
@synthesize viewerOptions;
@synthesize pagesPerScreen;

- (instancetype)initWithReaderDocument:(ReaderDocument *)object options:(NSMutableDictionary *)options
{
    self = [super initWithReaderDocument:object];
    self.viewerOptions = options;
    return self;
}

//  override viewDidLoad
- (void)viewDidLoad
{
    [super viewDidLoad];
    
    assert(document != nil); // Must have a valid ReaderDocument
    
    self.view.backgroundColor = [UIColor grayColor]; // Neutral gray
    
    UIView *fakeStatusBar = nil; CGRect viewRect = self.view.bounds; // View bounds
    
    if ([self respondsToSelector:@selector(edgesForExtendedLayout)]) // iOS 7+
    {
        if ([self prefersStatusBarHidden] == NO) // Visible status bar
        {
            CGRect statusBarRect = viewRect; statusBarRect.size.height = STATUS_HEIGHT;
            fakeStatusBar = [[UIView alloc] initWithFrame:statusBarRect]; // UIView
            fakeStatusBar.autoresizingMask = UIViewAutoresizingFlexibleWidth;
            fakeStatusBar.backgroundColor = [UIColor blackColor];
            fakeStatusBar.contentMode = UIViewContentModeRedraw;
            fakeStatusBar.userInteractionEnabled = NO;
            
            viewRect.origin.y += STATUS_HEIGHT; viewRect.size.height -= STATUS_HEIGHT;
        }
    }
    
    //initialise with single page per screen
    [self setPagesPerScreen: 1];
    
    CGRect scrollViewRect = CGRectInset(viewRect, -scrollViewOutset, 0.0f);
    theScrollView = [[UIScrollView alloc] initWithFrame:scrollViewRect]; // All
    theScrollView.autoresizesSubviews = NO; theScrollView.contentMode = UIViewContentModeRedraw;
    theScrollView.showsHorizontalScrollIndicator = NO; theScrollView.showsVerticalScrollIndicator = NO;
    theScrollView.scrollsToTop = NO; theScrollView.delaysContentTouches = NO; theScrollView.pagingEnabled = YES;
    theScrollView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
    theScrollView.backgroundColor = [UIColor clearColor]; theScrollView.delegate = self;
    [self.view addSubview:theScrollView];
    
    CGRect toolbarRect = viewRect; toolbarRect.size.height = TOOLBAR_HEIGHT;
//    mainToolbar = [[ReaderMainToolbar alloc] initWithFrame:toolbarRect document:document]; // ReaderMainToolbar
    mainToolbar = [[SDVReaderMainToolbar alloc] initWithFrame:toolbarRect document:document options:self.viewerOptions]; // customised ReaderMainToolbar
    mainToolbar.delegate = self; // ReaderMainToolbarDelegate
    [self.view addSubview:mainToolbar];
    
    //don't show thumbnails if all pages are in view
    if ([document.pageCount intValue] > self.pagesPerScreen)
    {
        CGRect pagebarRect = self.view.bounds; pagebarRect.size.height = PAGEBAR_HEIGHT;
        pagebarRect.origin.y = (self.view.bounds.size.height - pagebarRect.size.height);
        mainPagebar = [[ReaderMainPagebar alloc] initWithFrame:pagebarRect document:document]; // ReaderMainPagebar
        mainPagebar.delegate = self; // ReaderMainPagebarDelegate
        [self.view addSubview:mainPagebar];
    }
    
    if (fakeStatusBar != nil) [self.view addSubview:fakeStatusBar]; // Add status bar background view
    
    UITapGestureRecognizer *singleTapOne = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTapOne.numberOfTouchesRequired = 1; singleTapOne.numberOfTapsRequired = 1; singleTapOne.delegate = self;
    [self.view addGestureRecognizer:singleTapOne];
    
    UITapGestureRecognizer *doubleTapOne = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleDoubleTap:)];
    doubleTapOne.numberOfTouchesRequired = 1; doubleTapOne.numberOfTapsRequired = 2; doubleTapOne.delegate = self;
    [self.view addGestureRecognizer:doubleTapOne];
    
    UITapGestureRecognizer *doubleTapTwo = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleDoubleTap:)];
    doubleTapTwo.numberOfTouchesRequired = 2; doubleTapTwo.numberOfTapsRequired = 2; doubleTapTwo.delegate = self;
    [self.view addGestureRecognizer:doubleTapTwo];
    
    [singleTapOne requireGestureRecognizerToFail:doubleTapOne]; // Single tap requires double tap to fail
    
    contentViews = [NSMutableDictionary new]; lastHideTime = [NSDate date];
    
    minimumPage = 1; maximumPage = [document.pageCount integerValue];
}

//  override thumbsButton/ThumbsViewController
- (void)tappedInToolbar:(ReaderMainToolbar *)toolbar thumbsButton:(UIButton *)button
{
#if (READER_ENABLE_THUMBS == TRUE) // Option
    
    if (printInteraction != nil) [printInteraction dismissAnimated:NO];
    
    SDVThumbsViewController *thumbsViewController = [[SDVThumbsViewController alloc] initWithReaderDocument:document options:self.viewerOptions];
    
    thumbsViewController.title = self.title; thumbsViewController.delegate = self; // ThumbsViewControllerDelegate
    
    thumbsViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    thumbsViewController.modalPresentationStyle = UIModalPresentationFullScreen;
    
    [self presentViewController:thumbsViewController animated:NO completion:NULL];
    
#endif // end of READER_ENABLE_THUMBS Option
}


@end
