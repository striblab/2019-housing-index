/**
 * Process data for the application
 */

// Dependencies
const _ = require('lodash');
const ss = require('simple-statistics');

// Get data
const areas = require('./sources/housing-index-areas.json');
const timeseries = require('./sources/housing-index-timeseries.json');

// Process data
function indexData() {
  /*
  FIELDS in the main table:
  GEOID = this is the Census place code (two-digit state FIPS, plus the place FIPS code)
  place =  simple place name
  full_name = place plus state abbreviation (you may want to use this one, since our data crosses into Wisconsin)
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
  pct_owner = percent of housing units that are owner-occupied
  pct_burden = Percent of owner-occupied housing units that spent 30 percent or more of their household income on housing costs
  hhincome = Median household income
  home_value = Median value of owner-occupied homes
  */

  // Add entry for metro area
  // TODO: Fix this in data
  areas.push({
    place: 'Minneapolis-St. Paul Metro Area',
    geoid2: '2733460',
    strib_id: 220
  });

  let parsed = _.map(areas, a => {
    if (a.type) {
      console.log(a.type, a.full_name, a.place, a.type.match(/neighborhood/i));
    }

    let p = {
      id: a.strib_id || a.geoid2,
      geoid2: a.geoid2,
      name: (a.type && a.type.match(/neighborhood/i)
        ? a.full_name
        : a.place
      ).replace(/saint/i, 'St.'),
      // a.full_name
      location: a.location,
      placeType: a.type,
      counties: a.COUNTY ? a.COUNTY.split(',').map(d => d.trim()) : undefined,
      state: a.STATE,
      city: a.city_name,
      index: a.index_score,
      rank: a.index_rank,
      rankPrevious: a.LastRank,
      closedSales: a.cs_curr,
      pricePerSqFtChange: a.ppsf_pctchange,
      daysOnMarketChange: a.dom_diff,
      medianHomeValue: a.home_value,
      perPriceRecieved: a.pctorigprice,
      perNewConstruction: a.NewConstruct,
      perDistressed: a.PctDistressed,
      perOwnerOccupied: a.pct_owner,
      perCostBurdened: a.pct_burden,
      medianHouseholdIncome: a.hhincome
    };

    // Matched time series
    /*
    "place": "Somerset",
    "variable": "2003",
    "closed": 116,
    "geoid2": "5574675",
    "full_name": "Somerset, WI",
    "dom": 54.5,
    "ppsf": 123.08,
    "inventory": 50
    */
    let matched = _.filter(timeseries, { strib_id: p.id });
    _.each(matched, m => {
      let year = parseInt(m.variable, 10);

      p.pricePerSqFtPerYear = p.pricePerSqFtPerYear || {};
      if (m.ppsf || m.ppsf === 0) {
        p.pricePerSqFtPerYear[year] = { year, data: m.ppsf || null };
      }

      p.inventoryPerYear = p.inventoryPerYear || {};
      if (m.inventory || m.inventory === 0) {
        p.inventoryPerYear[year] = { year, data: m.inventory };
      }

      p.closedPerYear = p.closedPerYear || {};
      if (m.closed || m.closed === 0) {
        p.closedPerYear[year] = { year, data: m.closed };
      }

      p.daysOnMarket = p.daysOnMarket || {};
      if (m.dom || m.dom === 0) {
        p.daysOnMarket[year] = { year, data: m.dom || null };
      }
    });

    // Fill in years. This mainly affects the lower charts, but if there is data in the json that includes other years problems will ensue.
    let years = _.range(2015, 2019, 1);
    [
      'pricePerSqFtPerYear',
      'inventoryPerYear',
      'closedPerYear',
      'daysOnMarket'
    ].forEach(set => {
      years.forEach(y => {
        p[set][y] = p[set][y] || { year: y, data: null };
      });

      p[set] = _.sortBy(p[set], 'year');
    });

    // Median day on markey has unreliable data before 2007
    p.daysOnMarket = p.daysOnMarket.map(d => {
      d.data = d.year < 2015 ? null : d.data;
      return d;
    });

    // Otsego has wrong counties
    if (p.name === 'Otsego') {
      p.counties = ['Wright'];
    }

    return p;
  });

  // Connect neighborhoods
  parsed = _.map(parsed, p => {
    if (p.city) {
      let c = _.find(parsed, { name: p.city });
      if (c) {
        p.cityId = c.id;
      }
    }

    return p;
  });

  // Sort
  parsed = _.sortBy(parsed, 'name');

  // Make aggregate data
  let stats = {};
  _.each(
    [
      //'closedSales',
      //'pricePerSqFtChange',
      //'daysOnMarketChange',
      'medianHomeValue',
      'medianHouseholdIncome',
      'perOwnerOccupied',
      'perCostBurdened',
      // Timeseries
      'closedPerYear',
      'daysOnMarket',
      'inventoryPerYear',
      'pricePerSqFtPerYear'
    ],
    f => {
      let s = _.filter(_.map(parsed, f), d => !_.isUndefined(d));

      // If timeseries
      let timeseries = false;
      if (_.isArray(s[0])) {
        timeseries = true;
        s = _.map(_.flatten(s), 'data');
      }

      // Top level stats
      stats[f] = stats[f] || {};
      stats[f].count = s.length;
      stats[f].min = ss.min(s);
      stats[f].max = ss.max(s);
      stats[f].median = ss.median(s);
      stats[f].mean = ss.mean(s);
      stats[f].std = ss.standardDeviation(s);

      // Histogram numbers
      if (!timeseries) {
        let bins = Math.max(Math.ceil(Math.sqrt(s.length)), 8);
        let rawInterval = Math.abs((stats[f].max - stats[f].min) / bins);
        let interval = parseFloat(rawInterval.toPrecision(1));
        let intervalMin = parseFloat(stats[f].min.toPrecision(1));

        // Manual fix
        intervalMin = intervalMin < 2 ? 0 : intervalMin;

        let histogram = [];
        let max = intervalMin + interval;
        let min = intervalMin;
        while (max < stats[f].max) {
          histogram.push({
            min,
            max,
            count: _.filter(s, d => {
              return d >= min && d < max;
            }).length
          });

          min = max;
          max = min + interval;
        }

        stats[f].histogram = histogram;
      }
    }
  );

  return {
    areas: parsed,
    stats
  };
}

// Exports
module.exports = {
  index: {
    data: indexData(),
    local: 'housing-index.json'
  },
  metroTotals: {
    source: './sources/metro-totals.csv',
    type: 'csv',
    local: 'metro-totals.json',
    postprocess: data => {
      /*
    { year: '2014',
      pct_new_construct: '0.0707',
      median_sale_price: '205000 ',
      median_dom: '46',
      inventory: ' 13,007 ' }
    */
      let parsed = data.map(d => {
        return {
          year: parseInt(d.year, 10),
          perNewConstruction: parseFlowt(d.pct_new_construct),
          medianSalePrice: parseFlowt(d.median_sale_price),
          daysOnMarket: parseFlowt(d.daysOnMarket),
          inventoryPerYear: parseFlowt(d.inventory),
          closedsales: parseFlowt(d.closedsales),
          newlistings: parseFlowt(d.newlistings)
        };
      });

      let collected = {};
      parsed.forEach(d => {
        collected.perNewConstruction = collected.perNewConstruction || [];
        collected.perNewConstruction.push({
          year: d.year,
          data: d.perNewConstruction ? d.perNewConstruction : null
        });
        collected.medianSalePrice = collected.medianSalePrice || [];
        collected.medianSalePrice.push({
          year: d.year,
          data: d.medianSalePrice ? d.medianSalePrice : null
        });
        collected.daysOnMarket = collected.daysOnMarket || [];
        collected.daysOnMarket.push({
          year: d.year,
          data: d.daysOnMarket ? d.daysOnMarket : null
        });
        collected.inventoryPerYear = collected.inventoryPerYear || [];
        collected.inventoryPerYear.push({
          year: d.year,
          data: d.inventoryPerYear ? d.inventoryPerYear : null
        });
        collected.closedsales = collected.closedsales || [];
        collected.closedsales.push({
          year: d.year,
          data: d.closedsales ? d.closedsales : null
        });
        collected.newlistings = collected.newlistings || [];
        collected.newlistings.push({
          year: d.year,
          data: d.newlistings ? d.newlistings : null
        });
      });

      // Median day on markey has unreliable data before 2007
      collected.daysOnMarket = collected.daysOnMarket.map(d => {
        d.data = d.year < 2007 ? null : d.data;
        return d;
      });

      return collected;
    }
  }
};

// Parsing number
function parseFlowt(input) {
  let i = _.isNumber(input)
    ? input
    : _.isString(input)
      ? parseFloat(input.replace(/,/g, '').trim())
      : NaN;
  return _.isNaN(i) ? null : i;
}
