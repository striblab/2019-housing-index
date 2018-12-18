/**
 * Process data for the application
 */

// Dependencies
const _ = require('lodash');

// Get data
const areas = require('./sources/housing-index-areas.test.json');
const timeseries = require('./sources/housing-index-timeseries.test.json');

// Process data
function indexData() {
  console.log(areas);
  /*
  FIELDS in the main table:
  GEOID = this is the Census place code (two-digit state FIPS, plus the place FIPS code)
  Place =  simple place name
  FullName = place plus state abbreviation (you may want to use this one, since our data crosses into Wisconsin)
  County =county or counties that this city is located in
  State = state that this city is located in
  Location = my attempt to bucket these cities by “inner suburbs”, “outer suburbs”, etc. (not sure we need this for the data viz)
  Cs_curr = Number of closed sales in 2018
  Ppsf_pctchange = Percent change in 2018 price per square foot compared the previous four-year average
  Dom_diff = Change in average days on market (i.e. -4 would mean that is 4 fewer days) than previous year
  pctorigprice = Percent of original list price received
  PctDistressed = Percent of closed sales that were short sales or foreclosures
  NewConstruct = Percent of closed sales that were new construction
  Index_score = This year’s score on the hot housing index (don’t need to display this, IMO)
  Index_rank = This year’s rank on the hot housing index (this will be blank for communities that weren’t included in the index)
  Last_rank = Where this city ranked on last year’s index (re-run using the new baseline for including communities)
  PctOwner = percent of housing units that are owner-occupied
  PctCostBurdenedOwners = Percent of owner-occupied housing units that spent 30 percent or more of their household income on housing costs
  MedianHHIncome = Median household income
  MedianValue = Median value of owner-occupied homes
  */

  let parsed = _.map(areas, a => {
    return {
      geoid2: a.geoid2,
      name: a.Place,
      // a.FullName
      locationType: a.location,
      county: a.COUNTY,
      state: a.STATE,
      index: a.Index_score,
      rank: a.Index_rank,
      rankPrevious: a.Last_rank,
      closedSales2018: a.Cs_curr,
      pricePerSqFtChange: a.Ppsf_pctchange,
      daysOnMarketChange: a.Dom_diff,
      medianHomeValue: a.MedianValue,
      perPriceRecieved: a.pctorigprice,
      perNewConstruction: a.pctorigprice,
      perOwnerOccupied: a.PctOwner,
      perCostBurdened: a.PctCostBurdenedOwners,
      medianHouseholdIncome: a.MedianHHIncome
    };
  });

  return parsed;
}

// Exports
module.exports = {
  index: {
    data: indexData()
  }
};
