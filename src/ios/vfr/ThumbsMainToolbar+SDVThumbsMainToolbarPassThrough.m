//
//  ThumbsMainToolbar+SDVThumbsMainToolbarPassThrough.m
//
//  modify ThumbsMainToolbar to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ThumbsMainToolbar+SDVThumbsMainToolbarPassThrough.h"

@implementation ThumbsMainToolbar (SDVThumbsMainToolbarPassThrough)

//  override ReaderMainToolbar init method to simply pass the call to super
//  because all the UI Elements are being initialised in a subclass now
//  yes I know it is bad practice to override methods in a category but this is the only way
- (instancetype)initWithFrame:(CGRect)frame title:(NSString *)title
{
    return [super initWithFrame:frame];
}

@end
