//
//  SDVReaderContentViewDoublePage.m
//
//  implements double page view
//  https://github.com/piyush-readwhere/Reader/commit/06e33dff76da573941f65a6fde88138d84f2bf51
//
//  Created by Philipp Bohnenstengel on 06.11.14.
//
//

#import "ReaderContentPage.h"
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

#if (READER_SHOW_SHADOWS == TRUE) // Option
#define CONTENT_INSET 4.0f
#else
#define CONTENT_INSET 2.0f
#endif // end of READER_SHOW_SHADOWS Option

static inline CGFloat zoomScaleThatFits(CGSize target, CGSize source, CGFloat bfwi)
{
    CGFloat w_scale;
    w_scale= ((target.width/2) / source.width);
    return w_scale;
}

- (void)updateMinimumMaximumZoom
{
    CGFloat zoomScale = zoomScaleThatFits(self.bounds.size, theContentPage.bounds.size, bugFixWidthInset);
    
    self.minimumZoomScale = zoomScale; self.maximumZoomScale = (zoomScale * ZOOM_MAXIMUM); // Limits
    
    realMaximumZoom = self.maximumZoomScale; tempMaximumZoom = (realMaximumZoom * ZOOM_FACTOR);
}

- (id)initWithFrame:(CGRect)frame fileURL:(NSURL *)fileURL page:(NSUInteger)page password:(NSString *)phrase
{
    return [self initWithFrame:frame fileURL:fileURL page:page password:phrase mode:SDVReaderContentViewDoublePageModeDefault];
}

- (id)initWithFrame:(CGRect)frame fileURL:(NSURL *)fileURL page:(NSUInteger)page password:(NSString *)phrase mode:(SDVReaderContentViewDoublePageMode) mode
{
    if ((self = [super initWithFrame:frame]))
    {
        self.scrollsToTop = NO;
        self.delaysContentTouches = NO;
        self.showsVerticalScrollIndicator = NO;
        self.showsHorizontalScrollIndicator = NO;
        self.contentMode = UIViewContentModeRedraw;
        self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        self.backgroundColor = [UIColor clearColor];
        self.userInteractionEnabled = YES;
        self.autoresizesSubviews = NO;
        self.bouncesZoom = YES;
        self.delegate = self;
        theContentPage = [[ReaderContentPage alloc] initWithURL:fileURL page:page password:phrase];
        theContentPage.frame=CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y,theContentPage.frame.size.width/2, theContentPage.frame.size.height/2);
        if (theContentPage != nil) // Must have a valid and initialized content view
        {
            theContentPage1=[[ReaderContentPage alloc]initWithURL:fileURL page:page+1 password:phrase];
            theContentPage1.frame=CGRectMake(theContentPage.frame.size.width, theContentPage1.frame.origin.y, theContentPage.frame.size.width, theContentPage.frame.size.height);
            
            //border in the center
            UIView *centerBorder = [[UIView alloc] initWithFrame:CGRectMake(theContentPage.frame.size.width - 1.0f, theContentPage1.frame.origin.y, 2.0f, theContentPage.frame.size.height)];
            centerBorder.backgroundColor = [UIColor grayColor];
            
            theContainerView = [[UIView alloc] initWithFrame:CGRectMake(theContentPage.frame.origin.x, theContentPage.frame.origin.y, theContentPage.frame.size.width*2, theContentPage.frame.size.height)];
            
            theContainerView.autoresizesSubviews = NO;
            theContainerView.userInteractionEnabled = NO;
            theContainerView.contentMode = UIViewContentModeRedraw;
            theContainerView.autoresizingMask = UIViewAutoresizingNone;
            theContainerView.backgroundColor = [UIColor grayColor];
            
#if (READER_SHOW_SHADOWS == TRUE) // Option
            
            theContainerView.layer.shadowOffset = CGSizeMake(0.0f, 0.0f);
            theContainerView.layer.shadowRadius = 4.0f; theContainerView.layer.shadowOpacity = 1.0f;
            theContainerView.layer.shadowPath = [UIBezierPath bezierPathWithRect:theContainerView.bounds].CGPath;
            
#endif // end of READER_SHOW_SHADOWS Option
            
            self.contentSize = theContentPage.bounds.size; // Content size same as view size
            self.contentOffset = CGPointMake((0.0f - CONTENT_INSET), (0.0f - CONTENT_INSET)); // Offset
            self.contentInset = UIEdgeInsetsMake(CONTENT_INSET, CONTENT_INSET, CONTENT_INSET, CONTENT_INSET);
            
#if (READER_ENABLE_PREVIEW == TRUE) // Option
            
            theThumbView = [[ReaderContentThumb alloc] initWithFrame:theContentPage.bounds]; // Page thumb view
            theThumbView1=[[ReaderContentThumb alloc] initWithFrame:theContentPage1.bounds];
            [theContainerView addSubview:theThumbView]; // Add the thumb view to the container view
            [theContainerView addSubview:theThumbView1];
#endif // end of READER_ENABLE_PREVIEW Option
            
            // show single pages at the right scale
            switch (mode) {
                case SDVReaderContentViewDoublePageModeRight:
                    theContentPage.frame = theContentPage1.frame;
                    [theContainerView addSubview:theContentPage];
                    break;
                case SDVReaderContentViewDoublePageModeLeft:
                    [theContainerView addSubview:theContentPage];
                    break;
                default:
                    [theContainerView addSubview:theContentPage];
                    [theContainerView addSubview:theContentPage1];// Add the content view to the container view
                    break;
            }
            [theContainerView addSubview:centerBorder];
            
            [self addSubview:theContainerView]; // Add the container view to the scroll view
            
            [self updateMinimumMaximumZoom]; // Update the minimum and maximum zoom scales
            
            self.zoomScale = self.minimumZoomScale; // Set zoom to fit page content
        }
        
//        NSLog(@"double page add observer");
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
//        NSLog(@"double page remove observer");
        [self removeObserver:self forKeyPath:@"frame" context:SDVReaderContentViewDoublePageContext];
    }
    @catch (NSException *e)
    {
//        NSLog(@"Four! I mean: Five! I mean: Fire!: %@", e);
    }
}

- (void)centerScrollViewContent
{
    CGFloat iw = 0.0f; CGFloat ih = 0.0f; // Content width and height insets
    
    CGSize boundsSize = self.bounds.size; CGSize contentSize = self.contentSize; // Sizes
    
    if (contentSize.width < boundsSize.width) iw = ((boundsSize.width - contentSize.width) * 0.5f);
    
    if (contentSize.height < boundsSize.height) ih = ((boundsSize.height - contentSize.height) * 0.5f);
    
    UIEdgeInsets insets = UIEdgeInsetsMake(ih, iw, ih, iw); // Create (possibly updated) content insets
    
    if (UIEdgeInsetsEqualToEdgeInsets(self.contentInset, insets) == false) self.contentInset = insets;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    if (context == SDVReaderContentViewDoublePageContext) // Our context
    {
        if ((object == self) && [keyPath isEqualToString:@"frame"])
        {
            [self centerScrollViewContent]; // Center content
            
            CGFloat oldMinimumZoomScale = self.minimumZoomScale;
            
            [self updateMinimumMaximumZoom]; // Update zoom scale limits
            
            if (self.zoomScale == oldMinimumZoomScale) // Old minimum
            {
                self.zoomScale = self.minimumZoomScale;
            }
            else // Check against minimum zoom scale
            {
                if (self.zoomScale < self.minimumZoomScale)
                {
                    self.zoomScale = self.minimumZoomScale;
                }
                else // Check against maximum zoom scale
                {
                    if (self.zoomScale > self.maximumZoomScale)
                    {
                        self.zoomScale = self.maximumZoomScale;
                    }
                }
            }
        }
    }
}

//url detection etc
- (id)processSingleTap:(UITapGestureRecognizer *)recognizer
{
    CGPoint point = [recognizer locationInView:recognizer.view]; // Point
    if (CGRectContainsPoint(theContentPage.frame, point) == true)
    {
        return [theContentPage processSingleTap:recognizer];
    }
    else
    {
        return [theContentPage1 processSingleTap:recognizer];
    }
}

@end
