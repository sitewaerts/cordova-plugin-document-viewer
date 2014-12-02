//
//  ReaderMainToolbar+SDVReaderMainToolbarPassThrough.h
//
//  modify ReaderMainToolbar to enable a subclass' super call to pass through
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderMainToolbar+SDVReaderMainToolbarPassThrough.h"

@implementation ReaderMainToolbar (SDVReaderMainToolbarPassThrough)

//  override ReaderMainToolbar init method to simply pass the call to super
//  because all the UI Elements are being initialised in a subclass now
//  yes I know it is bad practice to override methods in a category but this is the only way
- (instancetype)initWithFrame:(CGRect)frame document:(ReaderDocument *)document
{
    assert(document != nil); // Must have a valid ReaderDocument
    
    return [super initWithFrame:frame];
}

@end
