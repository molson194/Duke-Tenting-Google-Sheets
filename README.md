# Duke-Tenting-Google-Sheets
Automatically schedules tenting shifts based on availability for UNC and other games. Check out the crazy tenting rules at http://www.kvillenation.com/

## Set Up
1. Go to https://www.google.com/script/start/ and create a new script. Replace the Code.gs with TentingExtension.js and add Prompt.html to the project files.
2. Create a new Google Sheet in Google Drive. A template for the sheet is provided (TentingTemplate.xlsx). The first column must be times, the top row must be tenters, and people mark availability with a 'x'
3. In the script, hover over 'Publish' and press 'Test as add-on'
4. Select the sheet and save the test. Test the sheet.
5. When everyone has filled in his/her availabilty, go to the test sheet, 'Add-ons'->'Duke Tenting Extension'->'Shedule Shifts'
6. Select Black/Blue/White/Walk-Up, fill in the number of tenters, and continue.
7. Wait for the 'Done' popup.
8. Check out your shifts and make any small adjustments

## How it works
All available day and night shifts are put in a list. Each shift has a value according to a heuristic (based on number of current shifts, shifts available at that time slot, contiguous blocks, and other factors). Algorithm goes through each possible shift and finds the element with the highest value. Schedules that shift, removes from list, and recomputes all values for remaining shifts.

## Screenshots
![UI V2](https://github.com/molson194/Duke-Tenting-Google-Sheets/blob/master/Photos/BlackTent1.png)
![UI V2](https://github.com/molson194/Duke-Tenting-Google-Sheets/blob/master/Photos/BlackTent2.png)
![UI V2](https://github.com/molson194/Duke-Tenting-Google-Sheets/blob/master/Photos/Info.png)
![UI V2](https://github.com/molson194/Duke-Tenting-Google-Sheets/blob/master/Photos/Tabs.png)

## Future
Improve the heuristic used for selecting available shifts (sometimes it schedules noncontiguous blocks or unfair shifts).
Account for peoples preferences (perhaps distinguishing between 'X' and 'x' in the heuristic)
