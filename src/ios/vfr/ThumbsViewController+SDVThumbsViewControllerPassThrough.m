//
//  ThumbsViewController+SDVThumbsViewControllerPassThrough.m
//
//  modify ThumbsViewController to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ThumbsViewController+SDVThumbsViewControllerPassThrough.h"

@implementation ThumbsViewController (SDVThumbsViewControllerPassThrough)

//  override ReaderViewController view method to simply pass the call to super
//  because all the UI Elements are being initialised in a subclass now
//  yes I know it is bad practice to override methods in a category but this is the only way
- (void)viewDidLoad
{
    [super viewDidLoad];
}

@end
