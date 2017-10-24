//
//  SDVReaderContentViewDoublePage.m
//
//  implements double page view
//  https://github.com/piyush-readwhere/Reader/commit/06e33dff76da573941f65a6fde88138d84f2bf51
//
//  Created by Philipp Bohnenstengel on 06.11.14.
//
//

#import "ReaderConstants.h"
#import "ReaderContentPage.h"
#import "ReaderThumbCache.h"
#import "SDVReaderContentViewDoublePage.h"

@implementation SDVReaderContentViewDoublePage
{
    ReaderContentPage *theContentPage1;
    ReaderContentThumb *theThumbView1;
}

static void *SDVReaderContentViewDoublePageContext = &SDVReaderContentViewDoublePageContext;

#pragma mark - Constants

#define ZOOM_FACTOR 2.0f
#define ZOOM_MAXIMUM 16.0f

#define PAGE_THUMB_LARGE 240
#define PAGE_THUMB_SMALL 144

//#if (READER_SHOW_SHADOWS == TRUE) // Option
//#define CONTENT_INSET 4.0f
//#else
//#define CONTENT_INSET 2.0f
//#endif // end of READER_SHOW_SHADOWS Option

#pragma mark - ReaderContentView functions

static inline CGFloat zoomScaleThatFits(CGSize target, CGSize source, CGFloat bfwi)
{
    CGFloat w_scale = (target.width / (source.width + bfwi));
    
    
    CGFloat h_scale = (target.height / source.height);
    
    return ((w_scale < h_scale) ? w_scale : h_scale);
    
//    CGFloat w_scale;
//    w_scale= ((target.width/2) / source.width);
//    return w_scale;
}

#pragma mark - ReaderContentView instance methods

- (void)updateMinimumMaximumZoom
{
    CGSize pageBounds = CGSizeMake(theContentPage.bounds.size.width + theContentPage1.bounds.size.width, theContentPage.bounds.size.height);
    
//    CGFloat zoomScale = zoomScaleThatFits(self.bounds.size, theContentPage.bounds.size, bugFixWidthInset);
    CGFloat zoomScale = zoomScaleThatFits(self.bounds.size, pageBounds, bugFixWidthInset);
    
    self.minimumZoomScale = zoomScale; self.maximumZoomScale = (zoomScale * ZOOM_MAXIMUM); // Limits
    
    realMaximumZoom = self.maximumZoomScale; tempMaximumZoom = (realMaximumZoom * ZOOM_FACTOR);
}

//- (void)centerScrollViewContent
//{
//    CGFloat iw = 0.0f; CGFloat ih = 0.0f; // Content width and height insets
//    
//    CGSize boundsSize = self.bounds.size; CGSize contentSize = self.contentSize; // Sizes
//    
//    if (contentSize.width < boundsSize.width) iw = ((boundsSize.width - contentSize.width) * 0.5f);
//    
//    if (contentSize.height < boundsSize.height) ih = ((boundsSize.height - contentSize.height) * 0.5f);
//    
//    UIEdgeInsets insets = UIEdgeInsetsMake(ih, iw, ih, iw); // Create (possibly updated) content insets
//    
//    if (UIEdgeInsetsEqualToEdgeInsets(self.contentInset, insets) == false) self.contentInset = insets;
//}


- (id)initWithFrame:(CGRect)frame pdfDocumentRef:(CGPDFDocumentRef *)pdfDocumentRef page:(NSUInteger)page
{
    return [self initWithFrame:frame pdfDocumentRef:pdfDocumentRef page:page mode:SDVReaderContentViewDoublePageModeDefault];
}

- (id)initWithFrame:(CGRect)frame pdfDocumentRef:(CGPDFDocumentRef *)pdfDocumentRef page:(NSUInteger)page mode:(SDVReaderContentViewDoublePageMode) mode
{
    if ((self = [super initWithFrame:frame]))
    {
        self.scrollsToTop = NO;
        self.delaysContentTouches = NO;
        self.showsVerticalScrollIndicator = NO;
        self.showsHorizontalScrollIndicator = NO;
        self.contentMode = UIViewContentModeRedraw;
        self.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
        self.backgroundColor = [UIColor clearColor];
//        self.userInteractionEnabled = YES;
        self.autoresizesSubviews = NO;
//        self.bouncesZoom = YES;
		self.clipsToBounds = NO;
        self.delegate = self;
        
        userInterfaceIdiom = [UIDevice currentDevice].userInterfaceIdiom; // User interface idiom
        
#ifndef __arm64__ // Only under 32-bit iOS
        if (userInterfaceIdiom == UIUserInterfaceIdiomPhone) // iOS 8.0 UIScrollView bug workaround
        {
            NSString *iosVersion = [UIDevice currentDevice].systemVersion; // iOS version as a string
            
            if ([@"8.0" compare:iosVersion options:NSNumericSearch] != NSOrderedDescending) // 8.0 and up
            {
                bugFixWidthInset = 4.0f; // Slightly reduce width of content view
            }
        }
#endif // End of only under 32-bit iOS code
        
        theContentPage = [[ReaderContentPage alloc] initWithDocument:pdfDocumentRef page:page];
        
        theContentPage1 = nil;
        theThumbView1 = nil;
        
        if (theContentPage != nil) // Must have a valid and initialized content view
        {
            CGRect containerFrame = theContentPage.bounds;
            
            theContentPage.frame=CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y,theContentPage.frame.size.width/2, theContentPage.frame.size.height/2);
            //if double page 2
            theContentPage1 = [[ReaderContentPage alloc] initWithDocument:pdfDocumentRef page:page+1];
            theContentPage1.frame =CGRectMake(theContentPage.frame.size.width, theContentPage.frame.origin.y,theContentPage.frame.size.width, theContentPage.frame.size.height);
                
            containerFrame = CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y, theContentPage.frame.size.width*2, theContentPage.frame.size.height);
        
            //border in the center
            UIView *centerBorder = [[UIView alloc] initWithFrame:CGRectMake(theContentPage.frame.size.width - 1.0f, theContentPage1.frame.origin.y, 2.0f, theContentPage.frame.size.height)];
            centerBorder.backgroundColor = [UIColor grayColor];
            
//            theContainerView = [[UIView alloc] initWithFrame:CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y, theContentPage.frame.size.width*2, theContentPage.frame.size.height)];
            theContainerView = [[UIView alloc] initWithFrame:containerFrame];
            
            theContainerView.autoresizesSubviews = NO;
            theContainerView.userInteractionEnabled = NO;
            theContainerView.contentMode = UIViewContentModeRedraw;
            theContainerView.autoresizingMask = UIViewAutoresizingNone;
            theContainerView.backgroundColor = [UIColor grayColor];
            
#if (READER_SHOW_SHADOWS == TRUE) // Option

			theContainerView.layer.shadowOffset = CGSizeMake(0.0f, 0.0f);
			theContainerView.layer.shadowRadius = 4.0f; theContainerView.layer.shadowOpacity = 1.0f;
            CGRect shadowFrame;
            switch (mode) {
                case SDVReaderContentViewDoublePageModeRight:
                    shadowFrame = CGRectMake(theContentPage1.frame.origin.x, theContentPage1.frame.origin.y, theContentPage1.frame.size.width, theContentPage1.frame.size.height);
                    theContainerView.layer.shadowPath = [UIBezierPath bezierPathWithRect:shadowFrame].CGPath;
                    break;
                case SDVReaderContentViewDoublePageModeLeft:
                    shadowFrame = CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y, theContentPage.frame.size.width, theContentPage.frame.size.height);
                    theContainerView.layer.shadowPath = [UIBezierPath bezierPathWithRect:shadowFrame].CGPath;
                    break;
                default:
                    theContainerView.layer.shadowPath = [UIBezierPath bezierPathWithRect:theContainerView.bounds].CGPath;
                    break;
            }

#endif // end of READER_SHOW_SHADOWS Option
            
            self.contentSize = theContentPage.bounds.size; // Content size same as view size
//            self.contentOffset = CGPointMake((0.0f - CONTENT_INSET), (0.0f - CONTENT_INSET)); // Offset
//            self.contentInset = UIEdgeInsetsMake(CONTENT_INSET, CONTENT_INSET, CONTENT_INSET, CONTENT_INSET);
            
            [self centerScrollViewContent];
            
#if (READER_ENABLE_PREVIEW == TRUE) // Option
            
            theThumbView = [[ReaderContentThumb alloc] initWithFrame:theContentPage.frame]; // Page thumb view
            if (mode == SDVReaderContentViewDoublePageModeRight) {
                theThumbView.frame = theContentPage1.frame;
            }
            [theContainerView addSubview:theThumbView]; // Add the thumb view to the container view
            if (theContentPage1) {
                theThumbView1=[[ReaderContentThumb alloc] initWithFrame:theContentPage1.frame];
                [theContainerView addSubview:theThumbView1];
            }
#endif // end of READER_ENABLE_PREVIEW Option
            
            // show single pages at the right scale
            switch (mode)
            {
                case SDVReaderContentViewDoublePageModeRight:
                {
                    theContentPage.frame = theContentPage1.frame;
                    [theContainerView addSubview:theContentPage];
                    break;
                }
                case SDVReaderContentViewDoublePageModeLeft:
                {
                    [theContainerView addSubview:theContentPage];
                    break;
                }
                case SDVReaderContentViewDoublePageModeDefault:
                {
                    [theContainerView addSubview:theContentPage];
                    [theContainerView addSubview:theContentPage1];// Add the content view to the container view
                    //border in the center
                    UIView *centerBorder = [[UIView alloc] initWithFrame:CGRectMake(theContentPage.frame.size.width - 1.0f, theContentPage1.frame.origin.y, 2.0f, theContentPage.frame.size.height)];
                    centerBorder.backgroundColor = [UIColor grayColor];
                    [theContainerView addSubview:centerBorder];
                    break;
				}
            }
            
            [self addSubview:theContainerView]; // Add the container view to the scroll view
            
            [self updateMinimumMaximumZoom]; // Update the minimum and maximum zoom scales
            
            self.zoomScale = self.minimumZoomScale; // Set zoom to fit page content
        }
        
        [self addObserver:self forKeyPath:@"frame" options:0 context:SDVReaderContentViewDoublePageContext];
        
        self.tag = page; // Tag the view with the page number
    }
    
    return self;
}

// mysterious exeption
- (void)dealloc
{
    @try
    {
        [self removeObserver:self forKeyPath:@"frame" context:SDVReaderContentViewDoublePageContext];
    }
    @catch (NSException *e)
    {
        NSLog(@"ignored DVReaderContentViewDoublePage dealloc exception");
    }
}

//- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
//{
//    if (context == SDVReaderContentViewDoublePageContext) // Our context
//    {
//        if ((object == self) && [keyPath isEqualToString:@"frame"])
//        {
//            [self centerScrollViewContent]; // Center content
//            
//            CGFloat oldMinimumZoomScale = self.minimumZoomScale;
//            
//            [self updateMinimumMaximumZoom]; // Update zoom scale limits
//            
//            if (self.zoomScale == oldMinimumZoomScale) // Old minimum
//            {
//                self.zoomScale = self.minimumZoomScale;
//            }
//            else // Check against minimum zoom scale
//            {
//                if (self.zoomScale < self.minimumZoomScale)
//                {
//                    self.zoomScale = self.minimumZoomScale;
//                }
//                else // Check against maximum zoom scale
//                {
//                    if (self.zoomScale > self.maximumZoomScale)
//                    {
//                        self.zoomScale = self.maximumZoomScale;
//                    }
//                }
//            }
//        }
//    }
//}

- (void)showPageThumb:(CGPDFDocumentRef *)pdfDocumentRef page:(NSInteger)page guid:(NSString *)guid
{
#if (READER_ENABLE_PREVIEW == TRUE) // Option
    
    CGSize size = ((userInterfaceIdiom == UIUserInterfaceIdiomPad) ? CGSizeMake(PAGE_THUMB_LARGE, PAGE_THUMB_LARGE) : CGSizeMake(PAGE_THUMB_SMALL, PAGE_THUMB_SMALL));
    
    ReaderThumbRequest *request = [ReaderThumbRequest newForView:theThumbView pdfDocumentRef:pdfDocumentRef guid:guid page:page size:size];
    
    UIImage *image = [[ReaderThumbCache sharedInstance] thumbRequest:request priority:YES]; // Request the page thumb
    
    if ([image isKindOfClass:[UIImage class]]) [theThumbView showImage:image]; // Show image from cache
    
    if (theThumbView1) {
        ReaderThumbRequest *request1 = [ReaderThumbRequest newForView:theThumbView1 pdfDocumentRef:pdfDocumentRef guid:guid page:page+1 size:size];
        
        UIImage *image1 = [[ReaderThumbCache sharedInstance] thumbRequest:request1 priority:YES]; // Request the page thumb
        
        if ([image1 isKindOfClass:[UIImage class]]) [theThumbView1 showImage:image1]; // Show image from cache
        
    }
    
#endif // end of READER_ENABLE_PREVIEW Option
}

//url detection etc
- (id)processSingleTap:(UITapGestureRecognizer *)recognizer
{
    // using theContentPage for locationInView requires theContentPage.frame.origin
    // to be 0,0 for the subsequent CGRectContainsPoint check to work correctly
    // luckily that is the case right now but keep in mind for the future
    CGPoint point = [recognizer locationInView:theContentPage]; // Point
    
    CGRect frame = theContentPage.frame;
    // SDVReaderContentViewModeCoverDoublePage uses theContentPage instead of
    // theContentPage1 for the first page on the right which means that
    // theContentPage.frame.origin is not 0,0 anymore
    frame = CGRectMake(0, 0, frame.size.width, frame.size.height);
    
    if (CGRectContainsPoint(frame, point) == true)
    {
        return [theContentPage processSingleTap:recognizer];
    }
    else
    {
        return [theContentPage1 processSingleTap:recognizer];
    }
}

@end
