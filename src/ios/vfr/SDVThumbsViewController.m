//
//  SDVThumbsViewController.m
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "SDVThumbsViewController.h"
#import "SDVThumbsMainToolbar.h"
#import "ThumbsMainToolbar+SDVThumbsMainToolbarPassThrough.h"
#import "ReaderDocument.h"

@implementation SDVThumbsViewController

#pragma mark - Constants

#define STATUS_HEIGHT 20.0f

#define TOOLBAR_HEIGHT 44.0f

#define PAGE_THUMB_SMALL 160
#define PAGE_THUMB_LARGE 256

//TODO understand how delegation works and why this works if it is not synthesized although none of the delegation stuff of the superclass is in the public header
//@synthesize delegate;
@synthesize viewerOptions;

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
    
    assert(self.delegate != nil); assert(document != nil);
    
    self.view.backgroundColor = [UIColor grayColor]; // Neutral gray
    
    CGRect scrollViewRect = self.view.bounds; UIView *fakeStatusBar = nil;
    
    if ([self respondsToSelector:@selector(edgesForExtendedLayout)]) // iOS 7+
    {
        if ([self prefersStatusBarHidden] == NO) // Visible status bar
        {
            CGRect statusBarRect = self.view.bounds; // Status bar frame
            statusBarRect.size.height = STATUS_HEIGHT; // Default status height
            fakeStatusBar = [[UIView alloc] initWithFrame:statusBarRect]; // UIView
            fakeStatusBar.autoresizingMask = UIViewAutoresizingFlexibleWidth;
            fakeStatusBar.backgroundColor = [UIColor blackColor];
            fakeStatusBar.contentMode = UIViewContentModeRedraw;
            fakeStatusBar.userInteractionEnabled = NO;
            
            scrollViewRect.origin.y += STATUS_HEIGHT; scrollViewRect.size.height -= STATUS_HEIGHT;
        }
    }
    
    NSString *toolbarTitle = [document.fileName stringByDeletingPathExtension];
    
    CGRect toolbarRect = scrollViewRect; // Toolbar frame
    toolbarRect.size.height = TOOLBAR_HEIGHT; // Default toolbar height
//    mainToolbar = [[ThumbsMainToolbar alloc] initWithFrame:toolbarRect title:toolbarTitle]; // ThumbsMainToolbar
    mainToolbar = [[SDVThumbsMainToolbar alloc] initWithFrame:toolbarRect title:toolbarTitle options: viewerOptions]; // ThumbsMainToolbar
    mainToolbar.delegate = self; // ThumbsMainToolbarDelegate
    [self.view addSubview:mainToolbar];
    
    if (fakeStatusBar != nil) [self.view addSubview:fakeStatusBar]; // Add status bar background view
    
    UIEdgeInsets scrollViewInsets = UIEdgeInsetsZero; // Scroll view toolbar insets
    
    if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad) // iPad
    {
        scrollViewRect.origin.y += TOOLBAR_HEIGHT; scrollViewRect.size.height -= TOOLBAR_HEIGHT;
    }
    else // Set UIScrollView insets for non-UIUserInterfaceIdiomPad case
    {
        scrollViewInsets.top = TOOLBAR_HEIGHT;
    }
    
    theThumbsView = [[ReaderThumbsView alloc] initWithFrame:scrollViewRect]; // ReaderThumbsView
    theThumbsView.contentInset = scrollViewInsets; theThumbsView.scrollIndicatorInsets = scrollViewInsets;
    theThumbsView.delegate = self; // ReaderThumbsViewDelegate
    [self.view insertSubview:theThumbsView belowSubview:mainToolbar];
    
    BOOL large = ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad);
    CGFloat thumbSize = (large ? PAGE_THUMB_LARGE : PAGE_THUMB_SMALL); // Thumb dimensions
    [theThumbsView setThumbSize:CGSizeMake(thumbSize, thumbSize)]; // Set the thumb size
}

@end
