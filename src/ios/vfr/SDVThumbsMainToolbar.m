//
//  SDVThumbsMainToolbar.m
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderConstants.h"
#import "ReaderDocument.h"
#import "SDVThumbsMainToolbar.h"

@implementation SDVThumbsMainToolbar
{
    NSInteger lastSelected;
    UISegmentedControl *showControl;
}

#pragma mark - Constants

#define BUTTON_X 8.0f
#define BUTTON_Y 8.0f

#define BUTTON_SPACE 8.0f
#define BUTTON_HEIGHT 30.0f

#define BUTTON_FONT_SIZE 15.0f
#define TEXT_BUTTON_PADDING 24.0f

#define SHOW_CONTROL_WIDTH 117.0f
#define ICON_BUTTON_WIDTH 40.0f

#define TITLE_FONT_SIZE 19.0f
#define TITLE_HEIGHT 28.0f

#pragma mark - Properties

// new init method with options, modified version of initWithFrame from ReaderMainToolbar
- (instancetype)initWithFrame:(CGRect)frame title:(NSString *)title options:(NSDictionary *)options
{
    NSLog(@"[pdfviewer] toolbar-options: %@", options);
    
    if ((self = [super initWithFrame:frame]))
    {
        CGFloat viewWidth = self.bounds.size.width; // Toolbar view width
        
#if (READER_FLAT_UI == TRUE) // Option
        UIImage *buttonH = nil; UIImage *buttonN = nil;
#else
        UIImage *buttonH = [[UIImage imageNamed:@"Reader-Button-H"] stretchableImageWithLeftCapWidth:5 topCapHeight:0];
        UIImage *buttonN = [[UIImage imageNamed:@"Reader-Button-N"] stretchableImageWithLeftCapWidth:5 topCapHeight:0];
#endif // end of READER_FLAT_UI Option
        
        BOOL largeDevice = ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad);
        
        const CGFloat buttonSpacing = BUTTON_SPACE; //const CGFloat iconButtonWidth = ICON_BUTTON_WIDTH;
        
        CGFloat titleX = BUTTON_X; CGFloat titleWidth = (viewWidth - (titleX + titleX));
        
        CGFloat leftButtonX = BUTTON_X; // Left-side button start X position
        
        UIFont *doneButtonFont = [UIFont systemFontOfSize:BUTTON_FONT_SIZE];
        //get doneButtonText from options
        NSString *toolbarOptionCloseLabel = [[options objectForKey: @"navigationView"] objectForKey: @"closeLabel"];
        NSLog(@"[pdfviewer] toolbar-options close label: %@", toolbarOptionCloseLabel);
        NSString *doneButtonText = toolbarOptionCloseLabel?:NSLocalizedString(@"Done", @"button");
        CGSize doneButtonSize = [doneButtonText sizeWithFont:doneButtonFont];
        CGFloat doneButtonWidth = (doneButtonSize.width + TEXT_BUTTON_PADDING);
        
        UIButton *doneButton = [UIButton buttonWithType:UIButtonTypeCustom];
        doneButton.frame = CGRectMake(leftButtonX, BUTTON_Y, doneButtonWidth, BUTTON_HEIGHT);
        [doneButton setTitleColor:[UIColor colorWithWhite:0.0f alpha:1.0f] forState:UIControlStateNormal];
        [doneButton setTitleColor:[UIColor colorWithWhite:1.0f alpha:1.0f] forState:UIControlStateHighlighted];
        [doneButton setTitle:doneButtonText forState:UIControlStateNormal]; doneButton.titleLabel.font = doneButtonFont;
        [doneButton addTarget:self action:@selector(doneButtonTapped:) forControlEvents:UIControlEventTouchUpInside];
        [doneButton setBackgroundImage:buttonH forState:UIControlStateHighlighted];
        [doneButton setBackgroundImage:buttonN forState:UIControlStateNormal];
        doneButton.autoresizingMask = UIViewAutoresizingNone;
        //doneButton.backgroundColor = [UIColor grayColor];
        doneButton.exclusiveTouch = YES;
        
        [self addSubview:doneButton]; //leftButtonX += (doneButtonWidth + buttonSpacing);
        
        titleX += (doneButtonWidth + buttonSpacing); titleWidth -= (doneButtonWidth + buttonSpacing);
        
//#if (READER_BOOKMARKS == TRUE) // Option
        CGFloat showControlX = (viewWidth - (SHOW_CONTROL_WIDTH + buttonSpacing));
        
        UIImage *thumbsImage = [UIImage imageNamed:@"Reader-Thumbs"];
        UIImage *bookmarkImage = [UIImage imageNamed:@"Reader-Mark-Y"];
        UIImage *outlineButton = [UIImage imageNamed:@"SDVReader-Outline"];
        //Todo: hide bookmark button if option enabled = false
        NSArray *buttonItems = [NSArray arrayWithObjects:thumbsImage, bookmarkImage, outlineButton, nil];
        
        BOOL useTint = [self respondsToSelector:@selector(tintColor)]; // iOS 7 and up
        
        showControl = [[UISegmentedControl alloc] initWithItems:buttonItems];
        showControl.frame = CGRectMake(showControlX, BUTTON_Y, SHOW_CONTROL_WIDTH, BUTTON_HEIGHT);
        showControl.tintColor = (useTint ? [UIColor blackColor] : [UIColor colorWithWhite:0.8f alpha:1.0f]);
        showControl.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
        showControl.segmentedControlStyle = UISegmentedControlStyleBar;
        showControl.selectedSegmentIndex = 0; // Default segment index
        //showControl.backgroundColor = [UIColor grayColor];
        showControl.exclusiveTouch = YES;
        
        //get last selected segment
        NSUserDefaults *settings = [NSUserDefaults standardUserDefaults];
        lastSelected = 0;
        if([settings objectForKey:@"NavigationViewLastSelectedMode"])
        {
            lastSelected = [[settings objectForKey:@"NavigationViewLastSelectedMode"] integerValue];
        }
        
        //deactivate segments if necessary
        BOOL toolbarOptionBookmarks = [[[options objectForKey: @"bookmarks"] objectForKey: @"enabled"] boolValue];
        NSLog(@"[pdfviewer] toolbar-options bookmarks: %d", toolbarOptionBookmarks);
        if (!toolbarOptionBookmarks) {
            [showControl setEnabled:NO forSegmentAtIndex:1];
            //reset remembered segment
            if (lastSelected == 1) {
                lastSelected = 0;
            }
        }
        BOOL toolbarOptionOutline = [[[options objectForKey: @"outline"] objectForKey: @"enabled"] boolValue];
        NSLog(@"[pdfviewer] toolbar-options outline: %d", toolbarOptionBookmarks);
        if (!toolbarOptionOutline) {
            [showControl setEnabled:NO forSegmentAtIndex:2];
            //reset remembered segment
            if (lastSelected == 2) {
                lastSelected = 0;
            }
        }
        
        [showControl addTarget:self action:@selector(showControlTapped:) forControlEvents:UIControlEventValueChanged];
        //set remembered segment
        showControl.selectedSegmentIndex = lastSelected;
        
        [self addSubview:showControl];
        
        titleWidth -= (SHOW_CONTROL_WIDTH + buttonSpacing);
        
//#endif // end of READER_BOOKMARKS Option
        
        if (largeDevice == YES) // Show document filename in toolbar
        {
            CGRect titleRect = CGRectMake(titleX, BUTTON_Y, titleWidth, TITLE_HEIGHT);
            
            UILabel *titleLabel = [[UILabel alloc] initWithFrame:titleRect];
            
            titleLabel.textAlignment = NSTextAlignmentCenter;
            titleLabel.font = [UIFont systemFontOfSize:TITLE_FONT_SIZE];
            titleLabel.autoresizingMask = UIViewAutoresizingFlexibleWidth;
            titleLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
            titleLabel.textColor = [UIColor colorWithWhite:0.0f alpha:1.0f];
            titleLabel.backgroundColor = [UIColor clearColor];
            titleLabel.adjustsFontSizeToFitWidth = YES;
            titleLabel.minimumScaleFactor = 0.75f;
            //get title from options
            NSString *toolbarOptionTitle = [options objectForKey: @"title"];
            NSLog(@"[pdfviewer] toolbar-options title label: %@", toolbarOptionTitle);
            titleLabel.text = toolbarOptionTitle?:title;
#if (READER_FLAT_UI == FALSE) // Option
            titleLabel.shadowColor = [UIColor colorWithWhite:0.65f alpha:1.0f];
            titleLabel.shadowOffset = CGSizeMake(0.0f, 1.0f);
#endif // end of READER_FLAT_UI Option
            
            [self addSubview:titleLabel];
        }
    }
    
    return self;
}

- (void)viewWillAppear:(BOOL)animated
{
    showControl.selectedSegmentIndex = lastSelected;
}

@end
