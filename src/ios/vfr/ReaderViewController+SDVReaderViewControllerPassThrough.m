//
//  ReaderViewController+SDVReaderViewControllerPassThrough.h
//
//  modify ReaderViewController to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderViewController+SDVReaderViewControllerPassThrough.h"

@implementation ReaderViewController (SDVReaderViewControllerPassThrough)

//  override ReaderViewController view method to simply pass the call to super
//  because all the UI Elements are being initialised in a subclass now
//  yes I know it is bad practice to override methods in a category but this is the only way
- (void)viewDidLoad
{
    [super viewDidLoad];
}

@end
