//
//  ReaderMainToolbar+SDVReaderMainToolbarPassThrough
//
//  modify ReaderMainToolbar to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderMainToolbar.h"

@interface ReaderMainToolbar (SDVReaderMainToolbarPassThrough)

- (instancetype)initWithFrame:(CGRect)frame document:(ReaderDocument *)document;

@end
