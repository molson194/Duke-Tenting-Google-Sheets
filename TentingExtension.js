var numTenters; // 12
var dayTenters; // Depends on type 2, 1, 1
var nightTenters; // Depends on type 10, 6, 2
var sheet;
var data; // All rows/columns
var hours; // Total hours on sheet
var nights; // Total nights on sheet
var avgHours; // Average hours each person should spend
var avgNights; // Average nights each person should spend
var numAvailableTime; // Number of people available at a specific time
var numAvailablePerson; // Number of slots available for a specific person
var hoursForPerson; // Number of hours for each person
var nightsForPerson; // Number of nights for each person
var possibleNights; // Array of all nights marked available (used for 'max heap')
var possibleDays; // Array of all day hours marked available (used for 'max heap')

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Tenting').addItem('Schedule Shifts', 'showDialog').addToUi();
}

function showDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Prompt').setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Tent Info');
}

function infoDone(blackButton, blueButton, whiteButton, walkUpButton, tenters) {
  numTenters=tenters;
  if (blackButton) {
    dayTenters = 2;
    nightTenters = 10;
  } else if (blueButton) {
    dayTenters = 1;
    nightTenters = 6;
  } else if (whiteButton) {
    dayTenters = 1;
    nightTenters = 2;
  } else if (walkUpButton) {
    dayTenters = Math.ceil(numTenters/3);
    nightTenters = Math.ceil(numTenters/3);
  } else {
    // TODO: throw error if wrong data
  }
  scheduleShifts();
}

function scheduleShifts() {
  preprocess();
  process();
  postprocess();
}

function preprocess() {
  // TODO: reinitialize data (reset 1's to x's)
  getSheetData();
  findNumHoursNights();
  findNumAvailableTimePerson();
  initHoursNightsForPerson();
  possibleNightsDays();
}

function getSheetData() {
  sheet = SpreadsheetApp.getActiveSheet();
  data = sheet.getDataRange().getValues();
}

function findNumHoursNights() {
  hours = 0;
  nights = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] instanceof Date) {
      hours += 0.5;
    } else if (data[i][0] == "Night") {
      nights += 1;
    }
  }

  avgHours = 1.0*dayTenters*hours/numTenters;
  avgNights = 1.0*nightTenters*nights/numTenters;
}

function findNumAvailableTimePerson() {
  numAvailableTime = new Array(data.length);
  numAvailablePerson = new Array(data[0].length);

  for (var i = 0; i < data[0].length; i++) {
    numAvailablePerson[i] = 0;
  }

  for (var i = 0; i < data.length; i++) {
    numAvailableTime[i] = 0;
    for (var j = 0; j < data[i].length; j++) {
      if (data[i][j] == "x" || data[i][j] == "X") {
        numAvailableTime[i]++;
        numAvailablePerson[j]++;
      }
    }
  }
}

function initHoursNightsForPerson() {
  hoursForPerson = new Array(data[0].length);
  nightsForPerson = new Array(data[0].length);
  for (var j = 0; j < data[0].length; j++) {
    hoursForPerson[j] = 0;
    nightsForPerson[j] = 0;
  }
}

function possibleNightsDays() {
  possibleNights = [];
  possibleDays = [];
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      if (data[i][j] == "x" || data[i][j] == "X") {
        if (data[i][0] instanceof Date) {
          possibleDays.push({row: i, column: j});
        } else if (data[i][0] == "Night") {
          possibleNights.push({row: i, column: j});
        }
      }
    }
  }
}

function process() {
  while (true) {
    var removeObjects = [];
    var maxValue = -10000;
    var maxObject = {row: -1, column: -1};

    possibleNights.forEach(function(element) {
      var value = nightHeuristic(element.row, element.column);
      if (value == null) {
        removeObjects.push(element);
      } else if (value > maxValue) {
        maxValue = value;
        maxObject = element;
      }
    });

    if (maxObject.row == -1 && maxObject.column == -1) {
      break;
    } else {
      data[maxObject.row][maxObject.column] = 1;
      var cell = sheet.getRange(maxObject.row+1,maxObject.column+1);
      cell.setValue(data[maxObject.row][maxObject.column]);
      nightsForPerson[maxObject.column]++;
      possibleNights.splice(possibleNights.indexOf(maxObject), 1);
    }

    removeObjects.forEach(function(element) {
      possibleNights.splice(possibleNights.indexOf(element), 1);
    });
  }

  while (true) {
    var removeObjects = [];
    var maxValue = -10000;
    var maxObject = {row: -1, column: -1};

    possibleDays.forEach(function(element) {
      var value = dayHeuristic(element.row, element.column);
      if (value == null) {
        removeObjects.push(element);
      } else if (value > maxValue) {
        maxValue = value;
        maxObject = element;
      }
    });

    if (maxObject.row == -1 && maxObject.column == -1) {
      break;
    } else {
      data[maxObject.row][maxObject.column] = 1;
      var cell = sheet.getRange(maxObject.row+1,maxObject.column+1);
      cell.setValue(data[maxObject.row][maxObject.column]);
      hoursForPerson[maxObject.column]++;
      possibleDays.splice(possibleDays.indexOf(maxObject), 1);
    }

    removeObjects.forEach(function(element) {
      possibleDays.splice(possibleDays.indexOf(element), 1);
    });
  }

  // While true
  //  Loop through all possible
  //    if a shift is on a day that is already done, remove from list
  //    else do max finder heuristic (return valid i,j)
  //  break if (-1,-1) - no elements left
  //  Change i,j to 1, update num nights for that person
}

function nightHeuristic(row, column) {
  // Number of night shifts person marked available (prioritize people who don't have free time, until near average nights)
  // Current num nights (compare to average)
  // Number of people available for specific time slot (lower starts first)

  if (isRowDone(row, nightTenters)) {
    return null;
  } else {
    return (-5*numAvailableTime[row]) + (-2*nightsForPerson[column]);
  }
}

function dayHeuristic(row, column) {
// Number of day shifts person marked available (prioritize people who don't have free time)
// Current number of hours and num nights
// Does person have next shift/previous shift/ next next/ previous previous
// Number of people available for specific time slot
// If time is 7:00 AM or 7:30 AM or 8:00 AM prioritize night people
// If time is 10 PM or 10:30 PM / 12:00 or 12:30 or 1:00 or 1:30 or 2:00 prioritize night
// TODO future: preferences (X, x)

  if (isRowDone(row, dayTenters)) {
    return null;
  } else {
    var value = (-10.0*numAvailableTime[row])+(-2.0*hoursForPerson[column])+(-1.0*avgHours/avgNights*nightsForPerson[column]);

    var upRow = row-1;
    var exploredUp = 0; // 1.5 hours above or below
    var lastTime = data[row][0];
    while (upRow > 0 && exploredUp < 1.5) {
      if (data[upRow][0] instanceof Date) {
        if (data[upRow][column] == 1) {
          value += avgHours/1.0;
        } else if (data[upRow][column] == "x") {
          value += avgHours/8.0;
        } else {
          break;
        }
        exploredUp += 1.0*(lastTime-data[upRow][0])/3600000;
        lastTime = data[upRow][0];
      } else if (data[upRow][0] == "Night") {
        if (data[upRow][column] == 1) {
          value += 3*avgHours;
        }
        break;
      }
      upRow--;
    }

    var downRow = row+1;
    var exploredDown = 0; // TODO: should be time not number
    var lastTime = data[row][0];
    while (downRow < data.length && exploredDown < 1.5) {
      if (data[downRow][0] instanceof Date) {
        if (data[downRow][column] == 1) {
          value += avgHours/1.0;
        } else if (data[downRow][column] == "x") {
          value += avgHours/8.0;
        } else {
          break;
        }
        exploredDown += 1.0*(lastTime-data[upRow][0])/3600000;
        lastTime = data[upRow][0];
      } else if (data[downRow][0] == "Night") {
        if (data[downRow][column] == 1) {
          value += 2.0*avgHours;
        }
        break;
      }
      downRow++;
    }

    return value;
  }
}


function isRowDone(row, peopleNeeded) {
  var peopleOn = 0;
  for (var j = 0; j < data[row].length; j++) {
    if (data[row][j] == 1) {
      peopleOn++;
    }
  }

  if (peopleOn < peopleNeeded) {
    return false;
  } else {
    return true;
  }
}

function postprocess() {
  // TODO: Do analysis/ coloring
  SpreadsheetApp.getUi().alert('Done Scheduling');
}

// Rules: Hour/Night in first column, people accross, x for available
// Thoughts: add all available to array, choose one with best heuristic, do night first (independent of days kind of)
