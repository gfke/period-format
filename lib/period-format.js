/*
 * period-format
 * user/repo
 *
 * Copyright (c) 2015
 * Licensed under the MIT license.
 */

'use strict';
var moment = require('moment');
var minilog = require('minilog');
minilog.enable();

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var api,
  PeriodInstance,
  log = minilog('period-format');

function periodError(reason) {
  var msg;

  msg = 'Period error: ' + reason;
  log.error(msg);
  throw msg;
}

PeriodInstance = function (id) {

  this.id = id;
  this.longFormat = null;
  this.shortFormat = null;
};

PeriodInstance.prototype.isTotal = function () {
  var isTotal = (this.id[0] === 't');
  return isTotal;
};

PeriodInstance.prototype.isYearly = function () {
  if (this.isYtd()) {
    return true;
  }
  if (this.isTotal()) {
    return false;
  }
  if (this.id.length !== 1) {
    return true;
  }
  return false;
};

PeriodInstance.prototype.isYtd = function () {
  var isYtd = (this.id === 'ytd');
  return isYtd;
};

PeriodInstance.prototype.getShortFormat = function () {
  if (null === this.shortFormat) {
    this.shortFormat = getShortPeriodFormat(this.id);
  }
  return this.shortFormat;
};

PeriodInstance.prototype.getLongFormat = function () {
  if (null === this.longFormat) {
    this.longFormat = getLongPeriodFormat(this.id);
  }
  return this.longFormat;
};

function replaceCustomPlaceholders(time, result) {
  var no;

  if (-1 !== result.indexOf('%Q%')) {
    no = getQuarterNoFromTime(time);
    result = result.replace('%Q%', no);
  }
  if (-1 !== result.indexOf('%H%')) {
    no = getHalfyearNoFromTime(time);
    result = result.replace('%H%', no);
  }
  return result;
}

function getQuarterNoFromTime(time) {
  var date = new Date(time);
  var month = date.getMonth();
  var no = Math.ceil(month / 3) + 1;
  return no;
};

function getHalfyearNoFromTime(time) {
  var date = new Date(time);
  var month = date.getMonth();
  var no = Math.ceil(month / 6) + 1;
  return no;
};

PeriodInstance.prototype.getLongStringForTime = function (time) {
  var format,
    result;

  if ('string' === typeof time) {
    time = parseInt(time, 10);
  }
  format = this.getLongFormat();
  result = replaceCustomPlaceholders(time, moment(time).utc().format(format));
  return result;
};

PeriodInstance.prototype.getShortStringForTime = function (time) {
  var format,
    result;

  if ('string' === typeof time) {
    time = parseInt(time, 10);
  }
  format = this.getShortFormat();
  result = replaceCustomPlaceholders(time, moment(time).utc().format(format));
  return result;

};

PeriodInstance.prototype.getOptions = function (from, to) {
  var options,
    currDate,
    endDate,
    steps,
    unit,
    startUnit,
    found;

  options = [];

  if (undefined === to) {
    to = moment().format('YYYY-MM-DD');
  }

  steps = 1;
  if (this.isTotal()) {
    unit = 'd';
    startUnit = 'day';
  } else if (this.isYearly()) {
    unit = 'y';
    startUnit = 'year';
  } else {
    switch (this.id[0]) {
      case 'd':
        unit = 'd';
        startUnit = 'day';
        break;
      case 'w':
        unit = 'w';
        startUnit = 'isoWeek';
        break;
      case 'm':
        unit = 'M';
        startUnit = 'month';
        break;
      case 'q':
        unit = 'Q';
        startUnit = 'quarter';
        break;
      case 'h':
        unit = 'Q';
        steps = 2;
        startUnit = 'quarter';
        break;
      case 'y':
        unit = 'y';
        startUnit = 'year';
        break;
      default:
        throw 'Unsupported unit "' + unit + '"';
    }
  }


  currDate = moment.utc(from);
  currDate = currDate.startOf(startUnit);
  endDate = moment.utc(to).startOf(startUnit);

  found = false;
  while (!found) {
    options.push({name: this.getLongStringForTime(currDate.format('x')), value: currDate.format('YYYY-MM-DD')});
    found = currDate.isSame(endDate, 'd');
    if (!found) {
      currDate.add(steps, unit);
    }
  }
  return options;
};

function getShortPeriodFormat(id) {
  if (id === 'ytd') {
    return '[YTD] YY';
  }
  switch (id[0]) {
    case 'd':
      return 'YYYY-MM-DD';
    case 'w':
      return '[CW]W \'GG';
    case 'm':
      return 'MMM \'YY';
    case 'q':
      return '[Q%Q%] \'YY';
    case 'h':
      return '[H%H%] \'YY';
    case 'y':
      return 'YYYY';
    case 't':
      return '[Total]';
  }
  throw 'No short period format found for "' + id + '"';
}

function getLongPeriodFormat(id) {
  if (id === 'ytd') {
    return '[YTD] YYYY';
  }
  switch (id[0]) {
    case 'd':
      return 'YYYY-MM-DD';
    case 'w':
      return '[CW] W GGGG';
    case 'm':
      return 'MMM YYYY';
    case 'q':
      return '[Q%Q%] YYYY';
    case 'h':
      return '[H%H%] YYYY';
    case 'y':
      return 'YYYY';
    case 't':
      return '[Total]';
  }
  throw 'No long period format found for "' + id + '"';
}

function isValid(id) {
  return true;
}

function getIntForTimeAndFormat(time, format) {
  var int;
  int = parseInt(moment(time).utc().format(format), 10);
  return int;
}

api = {};

api.getIsoWeekNoFromTime = function (time) {
  return getIntForTimeAndFormat(time, 'W');
};

api.getIsoWeekYearFromTime = function (time, short) {
  return getIntForTimeAndFormat(time, short ? 'GG' : 'GGGG');
};

api.getQuarterNoFromTime = function (time) {
  return getQuarterNoFromTime(time);
};

api.getHalfyearNoFromTime = function (time) {
  return getHalfyearNoFromTime(time);
};

api.get = function (id) {
  if (!isValid(id)) {
    periodError('Invalid period id "' + id + '" given!');
  }
  var instance = new PeriodInstance(id);
  return instance;
};

module.exports = api;

