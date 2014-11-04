//
//  SDVReaderMainPagebar.m
//
//  override page number to language neutral default
//
//  Created by Philipp Bohnenstengel on 04.11.14.
//
//

#import "ReaderDocument.h"
#import "SDVReaderMainPagebar.h"


@implementation SDVReaderMainPagebar

//  override page number string
- (void)updatePageNumberText:(NSInteger)page
{
    if (page != pageNumberLabel.tag) // Only if page number changed
    {
        NSInteger pages = [document.pageCount integerValue]; // Total pages
        
        //this is the line...
        NSString *format = NSLocalizedString(@"%i / %i", @"format"); // Format
        
        NSString *number = [[NSString alloc] initWithFormat:format, (int)page, (int)pages];
        
        pageNumberLabel.text = number; // Update the page number label text
        
        pageNumberLabel.tag = page; // Update the last page number tag
    }
}


@end
