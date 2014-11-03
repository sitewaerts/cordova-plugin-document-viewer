//
//  ThumbsMainToolbar+SDVThumbsMainToolbarPassThrough.h
//
//  modify ThumbsMainToolbar to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ThumbsMainToolbar.h"

@interface ThumbsMainToolbar (SDVThumbsMainToolbarPassThrough)

- (instancetype)initWithFrame:(CGRect)frame title:(NSString *)title;

@end
