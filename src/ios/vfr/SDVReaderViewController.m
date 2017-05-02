//
//  SDVReaderViewController.m
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//  based on https://github.com/etabard/Reader/commit/1001fcee4ccef5db329452dd59d5dfe48bdb783c and
//  https://github.com/piyush-readwhere/Reader/commit/06e33dff76da573941f65a6fde88138d84f2bf51
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "SDVReaderViewController.h"
#import "ReaderViewController+SDVReaderViewControllerPassThrough.h"
#import "SDVReaderMainToolbar.h"
#import "SDVThumbsViewController.h"
#import "SDVReaderMainPagebar.h"
#import "SDVReaderContentViewDoublePage.h"
#import "ReaderThumbCache.h"

@implementation SDVReaderViewController {
    void (^linkHandler)(NSString*, void (^)(void));
}

#pragma mark - Constants

#define PAGING_VIEWS 3

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
@synthesize viewMode;

#pragma mark - ReaderViewController methods

//// individual content size calculation for double page modes
//- (void)updateContentSize:(UIScrollView *)scrollView
//{
//    CGFloat contentHeight = scrollView.bounds.size.height; // Height
//    
//    CGFloat contentWidth;
//    switch (self.viewMode) {
//        case SDVReaderContentViewModeDoublePage:
//        {
//            contentWidth = (scrollView.bounds.size.width * ((maximumPage+1)/2));
//            break;
//        }
//        case SDVReaderContentViewModeCoverDoublePage:
//        {
//            contentWidth = (scrollView.bounds.size.width * ((maximumPage+2)/2));
//            break;
//        }
//        default:
//        {
//            contentWidth = (scrollView.bounds.size.width * (maximumPage));
//            break;
//        }
//    }
//    
//    scrollView.contentSize = CGSizeMake(contentWidth, contentHeight);
//}

// https://github.com/etabard/Reader/commit/1001fcee4ccef5db329452dd59d5dfe48bdb783c
- (void)handleLandscapeDoublePage {
    NSInteger futureCurrentPage = currentPage;
    
    if (futureCurrentPage == 0) {
        return;
    }
    
//    UIInterfaceOrientation orientation= [[UIApplication sharedApplication] statusBarOrientation];
    maximumPage = [document.pageCount integerValue];
    
    if((viewMode == SDVReaderContentViewModeDoublePage)
       || (viewMode == SDVReaderContentViewModeCoverDoublePage))
    {
        float maxPage = maximumPage;
        float nextCurrentPage = (currentPage / 2.0);
        
        
        if (viewMode == SDVReaderContentViewModeCoverDoublePage) {
            nextCurrentPage = floor(nextCurrentPage) + 1;
            maxPage = ((maxPage - 1) / 2) + 1;
        } else {
            maxPage = (maxPage / 2);
        }
        
        currentPage = (int) ceil(nextCurrentPage);
        maximumPage = (int) ceil(maxPage);
    }
    
    //Clear cached pages
    for (NSString *key in [contentViews allKeys]) // Enumerate content views
    {
        ReaderContentView *contentView = [contentViews objectForKey:key];
        
        [contentView removeFromSuperview]; [contentViews removeObjectForKey:key];
    }
    
    
    [self updateContentViews:theScrollView];
    //Force recompute view
    [self showDocumentPage:futureCurrentPage forceRedraw:true];
}

//  override addContentView to use single or double page
- (void)addContentView:(UIScrollView *)scrollView page:(NSInteger)page
{
//  https://github.com/piyush-readwhere/Reader/commit/06e33dff76da573941f65a6fde88138d84f2bf51
    NSInteger renderPage = page;
    BOOL renderDoublePage = false;
    BOOL singleFirstPage = false;
    BOOL singleLastPage = false;
    if ((viewMode == SDVReaderContentViewModeDoublePage)
        || (viewMode == SDVReaderContentViewModeCoverDoublePage)) {
        NSInteger lastPageEven;
        
        if (viewMode != SDVReaderContentViewModeCoverDoublePage) {
            lastPageEven = [document.pageCount integerValue];
            renderDoublePage = true;
            if (page > 1) {
                renderPage = (renderPage) * 2 - 1;
            }
        } else {
            lastPageEven = [document.pageCount integerValue] - 1;
            if (page > 1) {
                renderPage = (renderPage - 1) * 2;
                renderDoublePage = true;
            } else {
                singleFirstPage = true;
                renderDoublePage = true;
            }
        }
        
        //Handle single last page
        if (page == maximumPage && lastPageEven % 2 == 1) {
//            renderDoublePage = false;
            singleLastPage = true;
        }
    }
    
    CGRect viewRect = CGRectZero; viewRect.size = scrollView.bounds.size;

  	viewRect.origin.x = (viewRect.size.width * (page - 1)); viewRect = CGRectInset(viewRect, scrollViewOutset, 0.0f);
//    //position calculation depending on view mode and page
//    switch (self.viewMode) {
//        case SDVReaderContentViewModeDoublePage:
//        {
//            viewRect.origin.x = (viewRect.size.width * (page - 1)) / 2;
//            break;
//        }
//        case SDVReaderContentViewModeCoverDoublePage:
//        {
//            if (page == 1) {
//                viewRect.origin.x = 0;
//            } else {
//                viewRect.origin.x = (viewRect.size.width * page) / 2;
//            }
//            break;
//        }
//        default:
//        {
//            viewRect.origin.x = (viewRect.size.width * (page - 1));
//            break;
//        }
//    }
    viewRect = CGRectInset(viewRect, scrollViewOutset, 0.0f);
    
    NSString *phrase = document.password; NSString *guid = document.guid; // Document properties
    CGPDFDocumentRef *pdfDocumentRef = document.pdfDocumentRef;
    ReaderContentView *contentView;
    NSString *key;
    // view initialisation depending on view mode and page
    switch (self.viewMode) {
//        case SDVReaderContentViewModeDoublePage:
//        {
//            key = [NSString stringWithFormat:@"%ld-L",(long)page];// # key
//            contentView = [contentViews objectForKey:key];
//            if (contentView) {
//                [contentView removeFromSuperview];
//                [contentViews removeObjectForKey:key];
//            }
//            
//            if (page < maximumPage) {
//                contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page]; // ReaderContentView
//            }
//            //single last page
//            else
//            {
//                //                contentView = [[ReaderContentView alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page]; // ReaderContentView
//                contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page mode:SDVReaderContentViewDoublePageModeLeft]; // ReaderContentView
//            }
//            break;
//        }
//        case SDVReaderContentViewModeCoverDoublePage:
//        {
//            key = [NSString stringWithFormat:@"%ld-LC",(long)page];// # key
//            contentView = [contentViews objectForKey:key];
//            if (contentView) {
//                [contentView removeFromSuperview];
//                [contentViews removeObjectForKey:key];
//            }
//            //first page and single last page
//            if (page == 1)
//            {
//                //                contentView = [[ReaderContentView alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page]; // ReaderContentView
//                contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page mode:SDVReaderContentViewDoublePageModeRight]; // ReaderContentView
//            }
//            else if (page == maximumPage)
//            {
//                contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page mode:SDVReaderContentViewDoublePageModeLeft]; // ReaderContentView
//            }
//            else
//            {
//                contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page]; // ReaderContentView
//            }
//            break;
//        }
        default:
        {
            key = [NSString stringWithFormat:@"%ld",(long)page];// # key
//            contentView = [contentViews objectForKey:key];
//            if (contentView) {
//                [contentView removeFromSuperview];
//                [contentViews removeObjectForKey:key];
//            }
//            contentView = [[ReaderContentView alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:page]; // ReaderContentView
            break;
        }
    }
//    contentView = [contentViews objectForKey:key];
//    if (contentView) {
//        [contentView removeFromSuperview];
//        [contentViews removeObjectForKey:key];
//    }
    
    if (renderDoublePage) {
        if (singleFirstPage) {
            contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:renderPage mode:SDVReaderContentViewDoublePageModeRight]; // ReaderContentView
        } else if (singleLastPage) {
            contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:renderPage mode:SDVReaderContentViewDoublePageModeLeft]; // ReaderContentView
        } else {
            contentView = [[SDVReaderContentViewDoublePage alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:renderPage mode:SDVReaderContentViewDoublePageModeDefault]; // ReaderContentView
        }
    } else {
        contentView = [[ReaderContentView alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:renderPage]; // ReaderContentView
    }
    
    contentView.message = self;
    
    [contentViews setObject:contentView forKey:key];
    [scrollView addSubview:contentView];
    
    [contentView showPageThumb:pdfDocumentRef page:renderPage guid:guid]; // Request page preview thumb
}

// override layout
//- (void)layoutContentViews:(UIScrollView *)scrollView
//{
//    CGFloat viewWidth = scrollView.bounds.size.width; // View width
//    
//    CGFloat contentOffsetX = scrollView.contentOffset.x; // Content offset X
//    
//    NSInteger pageB = ((contentOffsetX + viewWidth - 1.0f) / viewWidth); // Pages
//    
//    NSInteger pageA = (contentOffsetX / viewWidth);
//    
//    pageB += 2; // Add extra pages
//    
//    // double pages require twice the range
//    if ((viewMode == SDVReaderContentViewModeDoublePage) || (viewMode == SDVReaderContentViewModeCoverDoublePage)) {
//        pageA *= 2; pageB *= 2;
//    }
//    
//    if (pageA < minimumPage) pageA = minimumPage; if (pageB > maximumPage) pageB = maximumPage;
//    
//    NSRange pageRange = NSMakeRange(pageA, (pageB - pageA + 1)); // Make page range (A to B)
//    
//    NSMutableIndexSet *pageSet = [NSMutableIndexSet indexSetWithIndexesInRange:pageRange];
//    
//    //  eliminate second halves of double pages
//    if (self.viewMode == SDVReaderContentViewModeDoublePage)
//    {
//        //dont create pages for even indices
//        [pageSet enumerateIndexesWithOptions:0 usingBlock: // Enumerate page set
//         ^(NSUInteger page, BOOL *stop)
//         {
//             if (page%2==0) {
//                 [pageSet removeIndex:page];
//             }
//         }
//         ];
//    }
//    else if (self.viewMode == SDVReaderContentViewModeCoverDoublePage)
//    {
//        //dont create pages for odd indices except cover
//        [pageSet enumerateIndexesWithOptions:0 usingBlock: // Enumerate page set
//         ^(NSUInteger page, BOOL *stop)
//         {
//             if ((page%2==1) && (page > 1)) {
//                 [pageSet removeIndex:page];
//             }
//         }
//         ];
//    }
//    
//    for (NSString *key in [contentViews allKeys]) // Enumerate content views
//    {
//        NSInteger page = [key integerValue]; // Page number value
//        
//        if (([pageSet containsIndex:page] == NO) && (page != currentPage)) // Remove content view
//        {
//            ReaderContentView *contentView = [contentViews objectForKey:key];
//            
//            [contentView removeFromSuperview]; [contentViews removeObjectForKey:key];
//        }
//        else // Visible content view - so remove it from page set
//        {
//            [pageSet removeIndex:page];
//        }
//    }
//    
//    NSInteger pages = pageSet.count;
//    
//    if (pages > 0) // We have pages to add
//    {
//        NSEnumerationOptions options = 0; // Default
//        
//        //  deactivated this part. still works. O.o
//        
//        //        if (pages == 2) // Handle case of only two content views
//        //        {
//        //            if ((maximumPage > 2) && ([pageSet lastIndex] == maximumPage)) options = NSEnumerationReverse;
//        //        }
//        //        else if (pages == 3) // Handle three content views - show the middle one first
//        //        {
//        //            NSMutableIndexSet *workSet = [pageSet mutableCopy]; options = NSEnumerationReverse;
//        //
//        //            [workSet removeIndex:[pageSet firstIndex]]; [workSet removeIndex:[pageSet lastIndex]];
//        //
//        //            NSInteger page = [workSet firstIndex]; [pageSet removeIndex:page];
//        //
//        //            [self addContentView:scrollView page:page];
//        //        }
//        
//        [pageSet enumerateIndexesWithOptions:options usingBlock: // Enumerate page set
//         ^(NSUInteger page, BOOL *stop)
//         {
//             //             NSLog(@"layout add page: %d", page);
//             [self addContentView:scrollView page:page];
//         }
//         ];
//    }
//}

// individual page number calculations on scroll for double page modes
- (void)handleScrollViewDidEnd:(UIScrollView *)scrollView
{
    CGFloat viewWidth = scrollView.bounds.size.width; // Scroll view width
    
    CGFloat contentOffsetX = scrollView.contentOffset.x; // Content offset X
    
    NSInteger page = (contentOffsetX / viewWidth); page++; // Page number
    if (((viewMode == SDVReaderContentViewModeDoublePage) || (viewMode == SDVReaderContentViewModeCoverDoublePage)) && page > 1) {
        if (viewMode != SDVReaderContentViewModeCoverDoublePage) {
            page = page * 2;
        } else if (page > 1) {
            page = (page - 1) * 2;
        }
        //overflow check (for single last pages in double page mode)
        page = (page<[document.pageCount integerValue]?page:[document.pageCount integerValue]);
    }
    
    
//    NSInteger page;
//    switch (self.viewMode) {
//        case SDVReaderContentViewModeDoublePage:
//            page = (contentOffsetX / viewWidth) * 2 - 1; page+=2; // Page number
//            break;
//        case SDVReaderContentViewModeCoverDoublePage:
//            page = (contentOffsetX / viewWidth) * 2; // Page number
//            if (page==0) {
//                page += 1;
//            }
//            break;
//            
//        default:
//            page = (contentOffsetX / viewWidth); page++; // Page number
//            break;
//    }
    
    if (page != currentPage) // Only if on different page
    {
        currentPage = page; document.pageNumber = [NSNumber numberWithInteger:page];
        
        [contentViews enumerateKeysAndObjectsUsingBlock: // Enumerate content views
         ^(NSString *key, ReaderContentView *contentView, BOOL *stop)
         {
             if ([key integerValue] != page) [contentView zoomResetAnimated:NO];
         }
         ];
        
        [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
        
        [mainPagebar updatePagebar]; // Update page bar
    }
}


//  override showDocumentPage
- (void)showDocumentPage:(NSInteger)page
{
    [self showDocumentPage:page forceRedraw:false];
//    // individual handling for different view modes. probably a lot of room for optimisation
//    switch (self.viewMode)
//    {
//        case SDVReaderContentViewModeDoublePage:
//        {
//            //even pages are on a double page with the previous page
//            if(page%2==0){
//                page=page-1;
//            }
//            else{
//                page=page;
//            }
//            
//            //deactivated because it caused blank pages in some situations
//            //            if (page != currentPage) // Only if on different page
//            //            {
//            
//            NSInteger minValue; NSInteger maxValue;
//            NSInteger maxPage;
//            if([document.pageCount integerValue]%2==0){
//                maxPage = [document.pageCount integerValue]-1;
//            }
//            else{
//                maxPage=[document.pageCount integerValue];
//            }
//            
//            
//            
//            NSInteger minPage = 1;
//            
//            if ((page < minPage) || (page > maxPage)) return;
//            
//            if (maxPage <= PAGING_VIEWS) // Few pages
//            {
//                minValue = minPage;
//                maxValue = maxPage;
//            }
//            else // Handle more pages
//            {
//                
//                
//                
//                minValue=page-2;
//                maxValue=page+2;
//                if(minValue<minPage){
//                    minValue=minValue+2;
//                    maxValue=maxValue+2;
//                }
//                if (maxValue > maxPage)
//                {
//                    minValue= (minValue > 2) ? minValue-2 : 1;
//                    maxValue=maxValue-2;
//                }
//                
//            }
//            NSMutableIndexSet *newPageSet = [NSMutableIndexSet new];
//            
//            NSMutableDictionary *unusedViews = [contentViews mutableCopy];
//            
//            CGRect viewRect = CGRectZero; viewRect.size = theScrollView.bounds.size;
//            
//            for (NSInteger number = minValue; number <= maxValue; number=number+2)
//            {
//                viewRect.origin.x = (viewRect.size.width * (number - 1)) / 2;
//                NSString *key = [NSString stringWithFormat:@"%ld-L",(long)number]; // # key
//                ReaderContentView *contentView = [contentViews objectForKey:key];
//                
//                //                    if (contentView == nil) // Create a brand new document content view
//                //                    {
//                //                        [self addContentView:theScrollView page:page];
//                //
//                //                        [newPageSet addIndex:number];
//                //                    }
//                //                    else // Reposition the existing content view
//                //                    {
//                //                        contentView.frame = viewRect; [contentView zoomResetAnimated:NO];
//                //
//                //                        [unusedViews removeObjectForKey:key];
//                //                    }
//                //delete old version
//                if (contentView != nil)
//                {
//                    [contentView removeFromSuperview];
//                    [contentViews removeObjectForKey:key];
//                    [newPageSet addIndex:number];
//                }
//                [self addContentView:theScrollView page:page];
//                
//                
//                
//                viewRect.origin.x += viewRect.size.width;
//            }
//            [unusedViews enumerateKeysAndObjectsUsingBlock: // Remove unused views
//             ^(id key, id object, BOOL *stop)
//             {
//                 [contentViews removeObjectForKey:key];
//                 
//                 ReaderContentView *contentView = object;
//                 
//                 [contentView removeFromSuperview];
//             }
//             ];
//            
//            unusedViews = nil; // Release unused views
//            
//            //                CGFloat viewWidthX1 = viewRect.size.width;
//            //                CGFloat viewWidthX2 = (viewWidthX1 * 2.0f);
//            
//            CGPoint contentOffset = CGPointZero;
//            
//            //  strange behaviour from original code, replaced
//            //                if (maxPage >= PAGING_VIEWS)
//            //                {
//            //                    if (page == maxPage)
//            //                        contentOffset.x = viewWidthX2;
//            //                    else
//            //                        if (page != minPage)
//            //                            contentOffset.x = viewWidthX1;
//            //                }
//            //                else
//            //                    if (page == (PAGING_VIEWS - 1))
//            //                        contentOffset.x = viewWidthX1;
//            
//            contentOffset.x = viewRect.size.width * (page/2);
//            
//            if (CGPointEqualToPoint(theScrollView.contentOffset, contentOffset) == false)
//            {
//                theScrollView.contentOffset = contentOffset; // Update content offset
//            }
//            
//            if ([document.pageNumber integerValue] != page) // Only if different
//            {
//                document.pageNumber = [NSNumber numberWithInteger:page]; // Update page number
//            }
//            
//            NSString *phrase = document.password; NSString *guid = document.guid;
//            CGPDFDocumentRef *pdfDocumentRef = document.pdfDocumentRef;
//            
//            if ([newPageSet containsIndex:page] == YES) // Preview visible page first
//            {
//                NSString *key =  [NSString stringWithFormat:@"%ld-L",(long)page]; // # key
//                
//                ReaderContentView *targetView = [contentViews objectForKey:key];
//                
//                [targetView showPageThumb:pdfDocumentRef page:page guid:guid];
//                
//                [newPageSet removeIndex:page]; // Remove visible page from set
//            }
//            
//            [newPageSet enumerateIndexesWithOptions:NSEnumerationReverse usingBlock: // Show previews
//             ^(NSUInteger number, BOOL *stop)
//             {
//                 NSString *key =  [NSString stringWithFormat:@"%ld-L",(long)page];// # key
//                 
//                 ReaderContentView *targetView = [contentViews objectForKey:key];
//                 
//                 [targetView showPageThumb:pdfDocumentRef page:number guid:guid];
//             }
//             ];
//            newPageSet = nil; // Release new page set
//            
//            [mainPagebar updatePagebar]; // Update the pagebar display
//            
//            //        [self updateToolbarBookmarkIcon]; // Update bookmark
//            [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
//            
//            currentPage = page;
//            NSLog(@"current page is %ld",(long)currentPage);
//            //            }
//            break;
//        }
//        case SDVReaderContentViewModeCoverDoublePage:
//        {
//            // odd pages are on the same double page as the previous even one
//            if((page > 1) && (page%2==1)){
//                page=page-1;
//            }
//            else{
//                //first page (cover) and even pages
//                page=page;
//            }
//            
//            //deactivated because it caused blank pages in some situations
//            //            if (page != currentPage) // Only if on different page
//            //            {
//            
//            NSInteger minValue; NSInteger maxValue;
//            NSInteger maxPage;
//            if([document.pageCount integerValue]%2==0){
//                maxPage = [document.pageCount integerValue];
//            }
//            else{
//                maxPage=[document.pageCount integerValue]-1;
//            }
//            
//            
//            
//            NSInteger minPage = 1;
//            
//            if ((page < minPage) || (page > maxPage)) return;
//            
//            if (maxPage <= PAGING_VIEWS) // Few pages
//            {
//                minValue = minPage;
//                maxValue = maxPage;
//            }
//            else // Handle more pages
//            {
//                
//                
//                
//                minValue=page-2;
//                maxValue=page+2;
//                if(minValue<minPage){
//                    minValue=minValue+2;
//                    maxValue=maxValue+2;
//                }
//                if (maxValue > maxPage)
//                {
//                    minValue= (minValue > 2) ? minValue-2 : 1;
//                    maxValue=maxValue-2;
//                }
//                
//            }
//            NSMutableIndexSet *newPageSet = [NSMutableIndexSet new];
//            
//            NSMutableDictionary *unusedViews = [contentViews mutableCopy];
//            
//            CGRect viewRect = CGRectZero; viewRect.size = theScrollView.bounds.size;
//            
//            for (NSInteger number = minValue; number <= maxValue; number=number+2)
//            {
//                if (page == 1) {
//                    viewRect.origin.x = 0;
//                } else {
//                    viewRect.origin.x = (viewRect.size.width * number) / 2;
//                }
//                NSString *key = [NSString stringWithFormat:@"%ld-LC",(long)number]; // # key
//                ReaderContentView *contentView = [contentViews objectForKey:key];
//                
//                //                if (contentView == nil) // Create a brand new document content view
//                //                {
//                //                    [self addContentView:theScrollView page:page];
//                //
//                //                    [newPageSet addIndex:number];
//                //                }
//                //                else // Reposition the existing content view
//                //                {
//                //                    contentView.frame = viewRect; [contentView zoomResetAnimated:NO];
//                //
//                //                    [unusedViews removeObjectForKey:key];
//                //                }
//                //delete old version
//                if (contentView != nil)
//                {
//                    [contentView removeFromSuperview];
//                    [contentViews removeObjectForKey:key];
//                    [newPageSet addIndex:number];
//                }
//                [self addContentView:theScrollView page:page];
//                
//                
//                viewRect.origin.x += viewRect.size.width;
//            }
//            [unusedViews enumerateKeysAndObjectsUsingBlock: // Remove unused views
//             ^(id key, id object, BOOL *stop)
//             {
//                 [contentViews removeObjectForKey:key];
//                 
//                 ReaderContentView *contentView = object;
//                 
//                 [contentView removeFromSuperview];
//             }
//             ];
//            
//            unusedViews = nil; // Release unused views
//            
//            //            CGFloat viewWidthX1 = viewRect.size.width;
//            //            CGFloat viewWidthX2 = (viewWidthX1 * 2.0f);
//            
//            CGPoint contentOffset = CGPointZero;
//            
//            //  strange behaviour from original code, replaced
//            //                if (maxPage >= PAGING_VIEWS)
//            //                {
//            //                    if (page == maxPage)
//            //                        contentOffset.x = viewWidthX2;
//            //                    else
//            //                        if (page != minPage)
//            //                            contentOffset.x = viewWidthX1;
//            //                }
//            //                else
//            //                    if (page == (PAGING_VIEWS - 1))
//            //                        contentOffset.x = viewWidthX1;
//            
//            contentOffset.x = viewRect.size.width * (page/2);
//            
//            if (CGPointEqualToPoint(theScrollView.contentOffset, contentOffset) == false)
//            {
//                theScrollView.contentOffset = contentOffset; // Update content offset
//            }
//            
//            if ([document.pageNumber integerValue] != page) // Only if different
//            {
//                document.pageNumber = [NSNumber numberWithInteger:page]; // Update page number
//            }
//            
//            NSString *phrase = document.password; NSString *guid = document.guid;
//            CGPDFDocumentRef *pdfDocumentRef = document.pdfDocumentRef;
//            
//            if ([newPageSet containsIndex:page] == YES) // Preview visible page first
//            {
//                NSString *key =  [NSString stringWithFormat:@"%ld-LC",(long)page]; // # key
//                
//                ReaderContentView *targetView = [contentViews objectForKey:key];
//                
//                [targetView showPageThumb:pdfDocumentRef page:page guid:guid];
//                
//                [newPageSet removeIndex:page]; // Remove visible page from set
//            }
//            
//            [newPageSet enumerateIndexesWithOptions:NSEnumerationReverse usingBlock: // Show previews
//             ^(NSUInteger number, BOOL *stop)
//             {
//                 NSString *key =  [NSString stringWithFormat:@"%ld-LC",(long)page];// # key
//                 
//                 ReaderContentView *targetView = [contentViews objectForKey:key];
//                 
//                 [targetView showPageThumb:pdfDocumentRef page:number guid:guid];
//             }
//             ];
//            newPageSet = nil; // Release new page set
//            
//            [mainPagebar updatePagebar]; // Update the pagebar display
//            
//            //        [self updateToolbarBookmarkIcon]; // Update bookmark
//            [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
//            
//            currentPage = page;
//            NSLog(@"current page is %ld",(long)currentPage);
//            //            }
//            break;
//        }
//        default:
//        {
//            //deactivated because it caused blank pages in some situations
//            //            if (page != currentPage) // Only if on different page
//            //            {
//            if ((page < minimumPage) || (page > maximumPage)) return;
//            
//            currentPage = page; document.pageNumber = [NSNumber numberWithInteger:page];
//            
//            CGPoint contentOffset = CGPointMake((theScrollView.bounds.size.width * (page - 1)), 0.0f);
//            
//            NSString *key = [NSString stringWithFormat:@"%ld",(long)page]; // # key
//            ReaderContentView *contentView = [contentViews objectForKey:key];
//            
//            //                if (contentView == nil) // Create a brand new document content view
//            //                    [self addContentView:theScrollView page:page];
//            //delete old version
//            if (contentView != nil)
//            {
//                [contentView removeFromSuperview];
//                [contentViews removeObjectForKey:key];
//            }
//            [self addContentView:theScrollView page:page];
//            
//            if (CGPointEqualToPoint(theScrollView.contentOffset, contentOffset) == true)
//            {
//                [self layoutContentViews:theScrollView];
//            }
//            else
//                [theScrollView setContentOffset:contentOffset];
//            
//            [contentViews enumerateKeysAndObjectsUsingBlock: // Enumerate content views
//             ^(NSNumber *key, ReaderContentView *contentView, BOOL *stop)
//             {
//                 if ([key integerValue] != page) [contentView zoomResetAnimated:NO];
//             }
//             ];
//            
//            [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
//            
//            [mainPagebar updatePagebar]; // Update page bar
//            //            }
//            
//            // original code from fork seemed buggy, replaced with current default from vfr Reader
//            
//            //            NSInteger minValue; NSInteger maxValue;
//            //            NSInteger maxPage = [document.pageCount integerValue];
//            //            NSInteger minPage = 1;
//            //
//            //            if ((page < minPage) || (page > maxPage)) return;
//            //
//            //            if (maxPage <= PAGING_VIEWS) // Few pages
//            //            {
//            //                minValue = minPage;
//            //                maxValue = maxPage;
//            //            }
//            //            else // Handle more pages
//            //            {
//            //                minValue = (page - 1);
//            //                maxValue = (page + 1);
//            //
//            //                if (minValue < minPage)
//            //                {minValue++; maxValue++;}
//            //                else
//            //                    if (maxValue > maxPage)
//            //                    {minValue--; maxValue--;}
//            //            }
//            //
//            //            NSMutableIndexSet *newPageSet = [NSMutableIndexSet new];
//            //
//            //            NSMutableDictionary *unusedViews = [contentViews mutableCopy];
//            //
//            //            CGRect viewRect = CGRectZero; viewRect.size = theScrollView.bounds.size;
//            //
//            //            for (NSInteger number = minValue; number <= maxValue; number++)
//            //            {
//            //                NSNumber *key = [NSNumber numberWithInteger:number]; // # key
//            //
//            //                ReaderContentView *contentView = [contentViews objectForKey:key];
//            //
//            //                if (contentView == nil) // Create a brand new document content view
//            //                {
//            //                    NSString *phrase = document.password; // Document properties
//            //                    CGPDFDocumentRef *pdfDocumentRef = document.pdfDocumentRef;
//            //
//            //                    contentView = [[ReaderContentView alloc] initWithFrame:viewRect pdfDocumentRef:pdfDocumentRef page:number];
//            //
//            //                    [theScrollView addSubview:contentView]; [contentViews setObject:contentView forKey:key];
//            //
//            //                    contentView.message = self; [newPageSet addIndex:number];
//            //                }
//            //                else // Reposition the existing content view
//            //                {
//            //                    contentView.frame = viewRect; [contentView zoomResetAnimated:NO];
//            //
//            //                    [unusedViews removeObjectForKey:key];
//            //                }
//            //
//            //                viewRect.origin.x += viewRect.size.width;
//            //            }
//            //
//            //            [unusedViews enumerateKeysAndObjectsUsingBlock: // Remove unused views
//            //             ^(id key, id object, BOOL *stop)
//            //             {
//            //                 [contentViews removeObjectForKey:key];
//            //
//            //                 ReaderContentView *contentView = object;
//            //
//            //                 [contentView removeFromSuperview];
//            //             }
//            //             ];
//            //
//            //            unusedViews = nil; // Release unused views
//            //
//            //            CGFloat viewWidthX1 = viewRect.size.width;
//            //            CGFloat viewWidthX2 = (viewWidthX1 * 2.0f);
//            //
//            //            CGPoint contentOffset = CGPointZero;
//            //
//            //            if (maxPage >= PAGING_VIEWS)
//            //            {
//            //                if (page == maxPage)
//            //                    contentOffset.x = viewWidthX2;
//            //                else
//            //                    if (page != minPage)
//            //                        contentOffset.x = viewWidthX1;
//            //            }
//            //            else
//            //                if (page == (PAGING_VIEWS - 1))
//            //                    contentOffset.x = viewWidthX1;
//            //
//            //            if (CGPointEqualToPoint(theScrollView.contentOffset, contentOffset) == false)
//            //            {
//            //                theScrollView.contentOffset = contentOffset; // Update content offset
//            //            }
//            //
//            //            if ([document.pageNumber integerValue] != page) // Only if different
//            //            {
//            //                document.pageNumber = [NSNumber numberWithInteger:page]; // Update page number
//            //            }
//            //
//            //            NSString *phrase = document.password; NSString *guid = document.guid;
//            //            CGPDFDocumentRef *pdfDocumentRef = document.pdfDocumentRef;
//            //
//            //            if ([newPageSet containsIndex:page] == YES) // Preview visible page first
//            //            {
//            //                NSNumber *key = [NSNumber numberWithInteger:page]; // # key
//            //                
//            //                ReaderContentView *targetView = [contentViews objectForKey:key];
//            //                
//            //                [targetView showPageThumb:pdfDocumentRef page:page guid:guid];
//            //                
//            //                [newPageSet removeIndex:page]; // Remove visible page from set
//            //            }
//            //            
//            //            [newPageSet enumerateIndexesWithOptions:NSEnumerationReverse usingBlock: // Show previews
//            //             ^(NSUInteger number, BOOL *stop)
//            //             {
//            //                 NSNumber *key = [NSNumber numberWithInteger:number]; // # key
//            //                 
//            //                 ReaderContentView *targetView = [contentViews objectForKey:key];
//            //                 
//            //                 [targetView showPageThumb:pdfDocumentRef page:number guid:guid];
//            //             }
//            //             ];
//            //            
//            //            newPageSet = nil; // Release new page set
//            //            
//            //            [mainPagebar updatePagebar]; // Update the pagebar display
//            //            
//            //            //        [self updateToolbarBookmarkIcon]; // Update bookmark
//            //            [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
//            //            
//            //            currentPage = page; // Track current page number
//            break;
//        }
//    }
}

- (void)showDocumentPage:(NSInteger)page forceRedraw:(bool)forceRedraw
{
    NSInteger renderPage = page;
    
    if((viewMode == SDVReaderContentViewModeDoublePage)
       || (viewMode == SDVReaderContentViewModeCoverDoublePage)){
        float nextRenderPage;
        //If double renderPage is not the same as page
        nextRenderPage = (page / 2.0);
        if (viewMode == SDVReaderContentViewModeCoverDoublePage) {
            nextRenderPage = floor(nextRenderPage) + 1;
        } else if (page == 1) {
            nextRenderPage = 1;
        }
        
        renderPage = (int) ceil(nextRenderPage);
    }

    if (page != currentPage || forceRedraw) // Only if on different page or if force redraw
    {
        if ((renderPage < minimumPage) || (renderPage > maximumPage)) return;
        
        currentPage = page; document.pageNumber = [NSNumber numberWithInteger:page];
        
        CGPoint contentOffset = CGPointMake((theScrollView.bounds.size.width * (renderPage - 1)), 0.0f);
        
        if (CGPointEqualToPoint(theScrollView.contentOffset, contentOffset) == true)
            [self layoutContentViews:theScrollView];
        else
            [theScrollView setContentOffset:contentOffset];
        
        [contentViews enumerateKeysAndObjectsUsingBlock: // Enumerate content views
         ^(NSString *key, ReaderContentView *contentView, BOOL *stop)
         {
             if ([key integerValue] != page) [contentView zoomResetAnimated:NO];
         }
         ];
        
        [mainToolbar setBookmarkState:[document.bookmarks containsIndex:page]];
        
        [mainPagebar updatePagebar]; // Update page bar
    }
}

//  https://github.com/etabard/Reader/commit/1001fcee4ccef5db329452dd59d5dfe48bdb783c
- (void)showDocument
{
//    UIInterfaceOrientation orientation= [[UIApplication sharedApplication] statusBarOrientation];

    [[ReaderThumbCache sharedInstance] removeAllObjects]; // Empty the thumb cache

    if((viewMode == SDVReaderContentViewModeDoublePage)
       || (viewMode == SDVReaderContentViewModeCoverDoublePage)){
        currentPage = [document.pageNumber integerValue];
        [self handleLandscapeDoublePage];
    } else {
        [self updateContentSize:theScrollView]; // Update content size first
        [self showDocumentPage:[document.pageNumber integerValue]]; // Show page
    }
    
    document.lastOpen = [NSDate date]; // Update document last opened date
}

#pragma mark - UIViewController methods

- (instancetype)initWithReaderDocument:(ReaderDocument *)object options:(NSMutableDictionary *)options linkHandler:(void (^)(NSString*, void (^)(void)))newLinkHandler
{
    self = [super initWithReaderDocument:object];
    self.viewerOptions = options;
    linkHandler = newLinkHandler;
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
    [self setViewMode:SDVReaderContentViewModeSinglePage];
    
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
    
    CGRect pagebarRect = self.view.bounds; pagebarRect.size.height = PAGEBAR_HEIGHT;
    pagebarRect.origin.y = (self.view.bounds.size.height - pagebarRect.size.height);
    mainPagebar = [[SDVReaderMainPagebar alloc] initWithFrame:pagebarRect document:document]; // ReaderMainPagebar
    mainPagebar.delegate = self; // ReaderMainPagebarDelegate
    [self.view addSubview:mainPagebar];
    // hide thumbs if not required
    if ([document.pageCount integerValue] <= pagesPerScreen) {
        [mainPagebar hidePagebar]; // Show
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

// show status bar
- (BOOL)prefersStatusBarHidden
{
    return NO;
}

//  https://github.com/etabard/Reader/commit/1001fcee4ccef5db329452dd59d5dfe48bdb783c
- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration
{
    if (CGSizeEqualToSize(theScrollView.contentSize, CGSizeZero) == false)
    {
        if ((viewMode == SDVReaderContentViewModeDoublePage)
            || (viewMode == SDVReaderContentViewModeCoverDoublePage)) {
            [self handleLandscapeDoublePage];
        } else {
            [self updateContentViews:theScrollView];
        }
        lastAppearSize = CGSizeZero;
    }
}

//reinitialize everything on rotation
//- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
//{
//    //double pages behave strangely...
//    if (viewMode != SDVReaderContentViewModeSinglePage) {
//        for(UIView *subview in [theScrollView subviews]) {
//            [subview removeFromSuperview];
//        }
//    }
//    [self updateContentSize:theScrollView];
//    [self layoutContentViews:theScrollView];
//    [self showDocumentPage:currentPage];
//    ignoreDidScroll = NO;
//}


#pragma mark - UIGestureRecognizerDelegate methods

#pragma mark - UIGestureRecognizer action methods

- (void)decrementPageNumber
{
    switch (self.viewMode) {
        case SDVReaderContentViewModeDoublePage:
        {
            if ((maximumPage > minimumPage) && (currentPage != minimumPage) && ((currentPage-1) != minimumPage))
            {
                CGPoint contentOffset = theScrollView.contentOffset; // Offset
                
                contentOffset.x -= theScrollView.bounds.size.width; // View X--
                
                [theScrollView setContentOffset:contentOffset animated:YES];
            }
            break;
        }
        default:
        {
            if ((maximumPage > minimumPage) && (currentPage != minimumPage))
            {
                CGPoint contentOffset = theScrollView.contentOffset; // Offset
        
                contentOffset.x -= theScrollView.bounds.size.width; // View X--
        
                [theScrollView setContentOffset:contentOffset animated:YES];
            }
            break;
        }
    }
}

//individual maximum page checks for double page modes
- (void)incrementPageNumber
{
    switch (self.viewMode) {
        case SDVReaderContentViewModeDoublePage:
        {
            if ((maximumPage > minimumPage) && (currentPage/2 < maximumPage))
            {
                CGPoint contentOffset = theScrollView.contentOffset; // Offset
                
                contentOffset.x += theScrollView.bounds.size.width; // View X++
                
                [theScrollView setContentOffset:contentOffset animated:YES];
            }
            break;
        }
        case SDVReaderContentViewModeCoverDoublePage:
        {
            if ((maximumPage > minimumPage) && ((currentPage/2)+1 < maximumPage))
            {
                CGPoint contentOffset = theScrollView.contentOffset; // Offset
                
                contentOffset.x += theScrollView.bounds.size.width; // View X++
                
                [theScrollView setContentOffset:contentOffset animated:YES];
            }
            break;
        }
            
        default:
        {
            if ((maximumPage > minimumPage) && (currentPage != maximumPage))
            {
                CGPoint contentOffset = theScrollView.contentOffset; // Offset
                
                contentOffset.x += theScrollView.bounds.size.width; // View X++
                
                [theScrollView setContentOffset:contentOffset animated:YES];
            }
            break;
        }
    }
}

// dont show page bar for short documents
- (void)handleSingleTap:(UITapGestureRecognizer *)recognizer
{
    if (recognizer.state == UIGestureRecognizerStateRecognized)
    {
        CGRect viewRect = recognizer.view.bounds; // View bounds
        
        CGPoint point = [recognizer locationInView:recognizer.view]; // Point
        
        CGRect areaRect = CGRectInset(viewRect, TAP_AREA_SIZE, 0.0f); // Area rect
        
        if (CGRectContainsPoint(areaRect, point) == true) // Single tap is inside area
        {
            NSString *key;
            switch (viewMode) {
                case SDVReaderContentViewModeDoublePage:
                {
                    key = [NSString stringWithFormat:@"%ld",(long)((currentPage+1)/2)]; // Page number key
                    break;
                }
                case SDVReaderContentViewModeCoverDoublePage:
                {
                    key = [NSString stringWithFormat:@"%ld",(long)(currentPage/2)+1]; // Page number key
                    break;
                }
                default:
                    key = [NSString stringWithFormat:@"%ld",(long)currentPage];; // Page number key
                    break;
            }
            
            ReaderContentView *targetView = [contentViews objectForKey:key]; // View
            
            id target = [targetView processSingleTap:recognizer]; // Target object
            
            if (target != nil) // Handle the returned target object
            {
                NSString *link;
                if ([target isKindOfClass:[NSURL class]])
                {
                    link = [target absoluteString];
                }
                else if ([target isKindOfClass:[NSNumber class]])
                {
                    link = [target stringValue];
                }
                else
                {
                    link = [target description];
                }
                linkHandler(link, ^{
                    if ([target isKindOfClass:[NSURL class]]) // Open a URL
                    {
                        NSURL *url = (NSURL *)target; // Cast to a NSURL object
                        
                        if (url.scheme == nil) // Handle a missing URL scheme
                        {
                            NSString *www = url.absoluteString; // Get URL string
                            
                            if ([www hasPrefix:@"www"] == YES) // Check for 'www' prefix
                            {
                                NSString *http = [[NSString alloc] initWithFormat:@"http://%@", www];
                                
                                url = [NSURL URLWithString:http]; // Proper http-based URL
                            }
                        }
                        
                        if ([[UIApplication sharedApplication] openURL:url] == NO)
                        {
#ifdef DEBUG
                            NSLog(@"%s '%@'", __FUNCTION__, url); // Bad or unknown URL
#endif
                        }
                    }
                    else // Not a URL, so check for another possible object type
                    {
                        if ([target isKindOfClass:[NSNumber class]]) // Goto page
                        {
                            NSInteger number = [target integerValue]; // Number
                            
                            [self showDocumentPage:number]; // Show the page
                        }
                    }
                });
            }
            else // Nothing active tapped in the target content view
            {
                if ([lastHideTime timeIntervalSinceNow] < -0.75) // Delay since hide
                {
                    if ((mainToolbar.alpha < 1.0f) || (mainPagebar.alpha < 1.0f)) // Hidden
                    {
                        [mainToolbar showToolbar];
                        //only show page bar if required
                        if ([document.pageCount integerValue] > pagesPerScreen) {
                            [mainPagebar showPagebar]; // Show
                        }
                    }
                }
            }
            
            return;
        }
        
        CGRect nextPageRect = viewRect;
        nextPageRect.size.width = TAP_AREA_SIZE;
        nextPageRect.origin.x = (viewRect.size.width - TAP_AREA_SIZE);
        
        if (CGRectContainsPoint(nextPageRect, point) == true) // page++
        {
            [self incrementPageNumber]; return;
        }
        
        CGRect prevPageRect = viewRect;
        prevPageRect.size.width = TAP_AREA_SIZE;
        
        if (CGRectContainsPoint(prevPageRect, point) == true) // page--
        {
            [self decrementPageNumber]; return;
        }
    }
}

- (void)handleDoubleTap:(UITapGestureRecognizer *)recognizer
{
    if (recognizer.state == UIGestureRecognizerStateRecognized)
    {
        CGRect viewRect = recognizer.view.bounds; // View bounds
        
        CGPoint point = [recognizer locationInView:recognizer.view]; // Point
        
        CGRect zoomArea = CGRectInset(viewRect, TAP_AREA_SIZE, TAP_AREA_SIZE); // Area
        
        if (CGRectContainsPoint(zoomArea, point) == true) // Double tap is inside zoom area
        {
            NSString *key;
            switch (viewMode) {
                case SDVReaderContentViewModeDoublePage:
                {
                    key = [NSString stringWithFormat:@"%ld",(long)((currentPage+1)/2)]; // Page number key
                    break;
                }
                case SDVReaderContentViewModeCoverDoublePage:
                {
                    key = [NSString stringWithFormat:@"%ld",(long)(currentPage/2)+1]; // Page number key
                    break;
                }
                default:
                    key = [NSString stringWithFormat:@"%ld",(long)currentPage]; // Page number key
                    break;
            }
            
            ReaderContentView *targetView = [contentViews objectForKey:key]; // View
            
            switch (recognizer.numberOfTouchesRequired) // Touches count
            {
                case 1: // One finger double tap: zoom++
                {
                    if (targetView.zoomScale <= targetView.minimumZoomScale)
                    {
                        [targetView zoomIncrement:recognizer];
                    } else {
                        [targetView zoomResetAnimated:YES];
                    }
                    break;
                }
                    //                deactivated two finger double tap because not desired behaviour
                    //                case 2: // Two finger double tap: zoom--
                    //                {
                    //                    [targetView zoomDecrement:recognizer]; break;
                    //                }
            }
            
            return;
        }
        
        CGRect nextPageRect = viewRect;
        nextPageRect.size.width = TAP_AREA_SIZE;
        nextPageRect.origin.x = (viewRect.size.width - TAP_AREA_SIZE);
        
        if (CGRectContainsPoint(nextPageRect, point) == true) // page++
        {
            [self incrementPageNumber]; return;
        }
        
        CGRect prevPageRect = viewRect;
        prevPageRect.size.width = TAP_AREA_SIZE;
        
        if (CGRectContainsPoint(prevPageRect, point) == true) // page--
        {
            [self decrementPageNumber]; return;
        }
    }
}

#pragma mark - ReaderContentViewDelegate methods

#pragma mark - ReaderMainToolbarDelegate methods

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

//new segmented control single/double page/cover
- (void)tappedInToolbar:(ReaderMainToolbar *)toolbar showControl:(UISegmentedControl *)control
{
    switch (control.selectedSegmentIndex)
    {
        case 0: // single page
        {
            NSLog(@"[pdfviewer] single page");
            self.pagesPerScreen = 1;
            self.viewMode = SDVReaderContentViewModeSinglePage;
            break;
        }
            
        case 1: // double page
        {
            NSLog(@"[pdfviewer] double page");
            self.pagesPerScreen = 2;
            self.viewMode = SDVReaderContentViewModeDoublePage;
            break;
        }
        case 2: // cover
        {
            NSLog(@"[pdfviewer] cover mode");
            self.pagesPerScreen = 1; // this is the minimum value
            self.viewMode = SDVReaderContentViewModeCoverDoublePage;
            break;
        }
    }
//    //reset everything
//    for(UIView *subview in [theScrollView subviews]) {
//        [subview removeFromSuperview];
//    }
//    [self updateContentSize:theScrollView];
//    [self layoutContentViews:theScrollView];
//    [self showDocumentPage:currentPage];
    [self handleLandscapeDoublePage];
    
    lastAppearSize = CGSizeZero;
    
    // hide thumbs if they are not required
    if ([document.pageCount integerValue] <= pagesPerScreen) {
        [mainPagebar hidePagebar]; // Show
    }
}

@end
