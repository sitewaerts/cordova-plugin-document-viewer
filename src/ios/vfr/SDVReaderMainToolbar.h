//
//  SDVReaderMainToolbar.h
//
//  implements Sitewaerts Document Viewer runtime options for VFR Reader
//
//  Created by Philipp Bohnenstengel on 03.11.14.
//
//

#import "ReaderMainToolbar.h"

@interface SDVReaderMainToolbar : ReaderMainToolbar

- (instancetype)initWithFrame:(CGRect)frame document:(ReaderDocument *)document options:(NSDictionary *)options;

@end
