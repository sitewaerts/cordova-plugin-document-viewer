//
//  SDVReaderContentViewDoublePage.h
//
//  implements double page view
//
//  Created by Philipp Bohnenstengel on 06.11.14.
//
//

#import "ReaderContentView.h"

typedef enum
{
    SDVReaderContentViewDoublePageModeDefault = 0,
    SDVReaderContentViewDoublePageModeLeft,
    SDVReaderContentViewDoublePageModeRight
} SDVReaderContentViewDoublePageMode;

@interface SDVReaderContentViewDoublePage : ReaderContentView

- (id)initWithFrame:(CGRect)frame pdfDocumentRef:(CGPDFDocumentRef *)pdfDocumentRef page:(NSUInteger)page mode:(SDVReaderContentViewDoublePageMode) mode;

@end
