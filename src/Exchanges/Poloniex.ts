// https://poloniex.com/support/api/

import * as utils from "@ekliptor/apputils";
const logger = utils.logger,
  nconf = utils.nconf;
import {
  AbstractExchange,
  ExOptions,
  ExApiKey,
  OrderBookUpdate,
  OpenOrders,
  OpenOrder,
  ExRequestParams,
  ExResponse,
  OrderParameters,
  MarginOrderParameters,
  CancelOrderResult,
  PushApiConnectionType,
  AbstractExchangeCurrencies,
} from "./AbstractExchange";
import { OrderResult } from "../structs/OrderResult";
import { MarginPosition, MarginPositionList } from "../structs/MarginPosition";
import MarginAccountSummary from "../structs/MarginAccountSummary";
import * as autobahn from "autobahn";
import * as WebSocket from "ws";
import * as request from "request";
import * as crypto from "crypto";
import * as querystring from "querystring";
import * as db from "../database";
import * as helper from "../utils/helper";

import EventStream from "../Trade/EventStream";
import {
  Currency,
  Ticker,
  Trade,
  TradeHistory,
  MarketOrder,
} from "@ekliptor/bit-models";
import { MarketAction } from "../Trade/MarketStream";
import { OrderBook } from "../Trade/OrderBook";
import {
  AbstractLendingExchange,
  ActiveLoan,
  ExchangeActiveLoanMap,
  LoanDirection,
  LoanOffers,
  MarginLendingParams,
} from "./AbstractLendingExchange";
import { OfferResult } from "../structs/OfferResult";
import { ExternalTickerExchange } from "./ExternalTickerExchange";

// from poloniex html
// TODO fetch automatically
let markets = {
  byCurrencyPair: {
    BTC_BTS: {
      id: 14,
      baseID: 28,
      quoteID: 32,
      base: "BTC",
      quote: "BTS",
      currencyPair: "BTC_BTS",
    },
    BTC_DOGE: {
      id: 27,
      baseID: 28,
      quoteID: 59,
      base: "BTC",
      quote: "DOGE",
      currencyPair: "BTC_DOGE",
    },
    BTC_DASH: {
      id: 24,
      baseID: 28,
      quoteID: 60,
      base: "BTC",
      quote: "DASH",
      currencyPair: "BTC_DASH",
    },
    BTC_EXE: {
      id: 382,
      baseID: 28,
      quoteID: 73,
      base: "BTC",
      quote: "EXE",
      currencyPair: "BTC_EXE",
    },
    BTC_LTC: {
      id: 50,
      baseID: 28,
      quoteID: 125,
      base: "BTC",
      quote: "LTC",
      currencyPair: "BTC_LTC",
    },
    BTC_NXT: {
      id: 69,
      baseID: 28,
      quoteID: 162,
      base: "BTC",
      quote: "NXT",
      currencyPair: "BTC_NXT",
    },
    BTC_STR: {
      id: 89,
      baseID: 28,
      quoteID: 198,
      base: "BTC",
      quote: "STR",
      currencyPair: "BTC_STR",
    },
    BTC_XMR: {
      id: 114,
      baseID: 28,
      quoteID: 240,
      base: "BTC",
      quote: "XMR",
      currencyPair: "BTC_XMR",
    },
    BTC_XRP: {
      id: 117,
      baseID: 28,
      quoteID: 243,
      base: "BTC",
      quote: "XRP",
      currencyPair: "BTC_XRP",
    },
    BTC_XEM: {
      id: 112,
      baseID: 28,
      quoteID: 256,
      base: "BTC",
      quote: "XEM",
      currencyPair: "BTC_XEM",
    },
    BTC_ETH: {
      id: 148,
      baseID: 28,
      quoteID: 267,
      base: "BTC",
      quote: "ETH",
      currencyPair: "BTC_ETH",
    },
    BTC_SC: {
      id: 150,
      baseID: 28,
      quoteID: 268,
      base: "BTC",
      quote: "SC",
      currencyPair: "BTC_SC",
    },
    BTC_DCR: {
      id: 162,
      baseID: 28,
      quoteID: 277,
      base: "BTC",
      quote: "DCR",
      currencyPair: "BTC_DCR",
    },
    BTC_LSK: {
      id: 163,
      baseID: 28,
      quoteID: 278,
      base: "BTC",
      quote: "LSK",
      currencyPair: "BTC_LSK",
    },
    BTC_STEEM: {
      id: 168,
      baseID: 28,
      quoteID: 281,
      base: "BTC",
      quote: "STEEM",
      currencyPair: "BTC_STEEM",
    },
    BTC_ETC: {
      id: 171,
      baseID: 28,
      quoteID: 283,
      base: "BTC",
      quote: "ETC",
      currencyPair: "BTC_ETC",
    },
    BTC_REP: {
      id: 174,
      baseID: 28,
      quoteID: 284,
      base: "BTC",
      quote: "REP",
      currencyPair: "BTC_REP",
    },
    BTC_ARDR: {
      id: 177,
      baseID: 28,
      quoteID: 285,
      base: "BTC",
      quote: "ARDR",
      currencyPair: "BTC_ARDR",
    },
    BTC_ZEC: {
      id: 178,
      baseID: 28,
      quoteID: 286,
      base: "BTC",
      quote: "ZEC",
      currencyPair: "BTC_ZEC",
    },
    BTC_STRAT: {
      id: 182,
      baseID: 28,
      quoteID: 287,
      base: "BTC",
      quote: "STRAT",
      currencyPair: "BTC_STRAT",
    },
    BTC_GNT: {
      id: 185,
      baseID: 28,
      quoteID: 290,
      base: "BTC",
      quote: "GNT",
      currencyPair: "BTC_GNT",
    },
    BTC_ZRX: {
      id: 192,
      baseID: 28,
      quoteID: 293,
      base: "BTC",
      quote: "ZRX",
      currencyPair: "BTC_ZRX",
    },
    BTC_CVC: {
      id: 194,
      baseID: 28,
      quoteID: 294,
      base: "BTC",
      quote: "CVC",
      currencyPair: "BTC_CVC",
    },
    BTC_OMG: {
      id: 196,
      baseID: 28,
      quoteID: 295,
      base: "BTC",
      quote: "OMG",
      currencyPair: "BTC_OMG",
    },
    BTC_GAS: {
      id: 198,
      baseID: 28,
      quoteID: 296,
      base: "BTC",
      quote: "GAS",
      currencyPair: "BTC_GAS",
    },
    BTC_STORJ: {
      id: 200,
      baseID: 28,
      quoteID: 297,
      base: "BTC",
      quote: "STORJ",
      currencyPair: "BTC_STORJ",
    },
    BTC_EOS: {
      id: 201,
      baseID: 28,
      quoteID: 298,
      base: "BTC",
      quote: "EOS",
      currencyPair: "BTC_EOS",
    },
    BTC_SNT: {
      id: 204,
      baseID: 28,
      quoteID: 300,
      base: "BTC",
      quote: "SNT",
      currencyPair: "BTC_SNT",
    },
    BTC_KNC: {
      id: 207,
      baseID: 28,
      quoteID: 301,
      base: "BTC",
      quote: "KNC",
      currencyPair: "BTC_KNC",
    },
    BTC_BAT: {
      id: 210,
      baseID: 28,
      quoteID: 302,
      base: "BTC",
      quote: "BAT",
      currencyPair: "BTC_BAT",
    },
    BTC_LOOM: {
      id: 213,
      baseID: 28,
      quoteID: 303,
      base: "BTC",
      quote: "LOOM",
      currencyPair: "BTC_LOOM",
    },
    BTC_QTUM: {
      id: 221,
      baseID: 28,
      quoteID: 304,
      base: "BTC",
      quote: "QTUM",
      currencyPair: "BTC_QTUM",
    },
    BTC_BNT: {
      id: 232,
      baseID: 28,
      quoteID: 305,
      base: "BTC",
      quote: "BNT",
      currencyPair: "BTC_BNT",
    },
    BTC_MANA: {
      id: 229,
      baseID: 28,
      quoteID: 306,
      base: "BTC",
      quote: "MANA",
      currencyPair: "BTC_MANA",
    },
    BTC_FOAM: {
      id: 246,
      baseID: 28,
      quoteID: 307,
      base: "BTC",
      quote: "FOAM",
      currencyPair: "BTC_FOAM",
    },
    BTC_BCHABC: {
      id: 236,
      baseID: 28,
      quoteID: 308,
      base: "BTC",
      quote: "BCHABC",
      currencyPair: "BTC_BCHABC",
    },
    BTC_BCHSV: {
      id: 238,
      baseID: 28,
      quoteID: 309,
      base: "BTC",
      quote: "BCHSV",
      currencyPair: "BTC_BCHSV",
    },
    BTC_NMR: {
      id: 248,
      baseID: 28,
      quoteID: 310,
      base: "BTC",
      quote: "NMR",
      currencyPair: "BTC_NMR",
    },
    BTC_POLY: {
      id: 249,
      baseID: 28,
      quoteID: 311,
      base: "BTC",
      quote: "POLY",
      currencyPair: "BTC_POLY",
    },
    BTC_LPT: {
      id: 250,
      baseID: 28,
      quoteID: 312,
      base: "BTC",
      quote: "LPT",
      currencyPair: "BTC_LPT",
    },
    BTC_ATOM: {
      id: 253,
      baseID: 28,
      quoteID: 313,
      base: "BTC",
      quote: "ATOM",
      currencyPair: "BTC_ATOM",
    },
    BTC_TRX: {
      id: 263,
      baseID: 28,
      quoteID: 315,
      base: "BTC",
      quote: "TRX",
      currencyPair: "BTC_TRX",
    },
    BTC_ETHBNT: {
      id: 266,
      baseID: 28,
      quoteID: 319,
      base: "BTC",
      quote: "ETHBNT",
      currencyPair: "BTC_ETHBNT",
    },
    BTC_LINK: {
      id: 275,
      baseID: 28,
      quoteID: 327,
      base: "BTC",
      quote: "LINK",
      currencyPair: "BTC_LINK",
    },
    BTC_MKR: {
      id: 302,
      baseID: 28,
      quoteID: 328,
      base: "BTC",
      quote: "MKR",
      currencyPair: "BTC_MKR",
    },
    BTC_SNX: {
      id: 290,
      baseID: 28,
      quoteID: 335,
      base: "BTC",
      quote: "SNX",
      currencyPair: "BTC_SNX",
    },
    BTC_XTZ: {
      id: 277,
      baseID: 28,
      quoteID: 336,
      base: "BTC",
      quote: "XTZ",
      currencyPair: "BTC_XTZ",
    },
    BTC_MATIC: {
      id: 295,
      baseID: 28,
      quoteID: 338,
      base: "BTC",
      quote: "MATIC",
      currencyPair: "BTC_MATIC",
    },
    BTC_AVA: {
      id: 324,
      baseID: 28,
      quoteID: 344,
      base: "BTC",
      quote: "AVA",
      currencyPair: "BTC_AVA",
    },
    BTC_NEO: {
      id: 309,
      baseID: 28,
      quoteID: 348,
      base: "BTC",
      quote: "NEO",
      currencyPair: "BTC_NEO",
    },
    BTC_SWFTC: {
      id: 312,
      baseID: 28,
      quoteID: 349,
      base: "BTC",
      quote: "SWFTC",
      currencyPair: "BTC_SWFTC",
    },
    BTC_STPT: {
      id: 369,
      baseID: 28,
      quoteID: 350,
      base: "BTC",
      quote: "STPT",
      currencyPair: "BTC_STPT",
    },
    BTC_FXC: {
      id: 317,
      baseID: 28,
      quoteID: 351,
      base: "BTC",
      quote: "FXC",
      currencyPair: "BTC_FXC",
    },
    BTC_CHR: {
      id: 333,
      baseID: 28,
      quoteID: 358,
      base: "BTC",
      quote: "CHR",
      currencyPair: "BTC_CHR",
    },
    BTC_MDT: {
      id: 342,
      baseID: 28,
      quoteID: 359,
      base: "BTC",
      quote: "MDT",
      currencyPair: "BTC_MDT",
    },
    BTC_WRX: {
      id: 359,
      baseID: 28,
      quoteID: 363,
      base: "BTC",
      quote: "WRX",
      currencyPair: "BTC_WRX",
    },
    BTC_XFIL: {
      id: 348,
      baseID: 28,
      quoteID: 365,
      base: "BTC",
      quote: "XFIL",
      currencyPair: "BTC_XFIL",
    },
    BTC_LEND: {
      id: 351,
      baseID: 28,
      quoteID: 366,
      base: "BTC",
      quote: "LEND",
      currencyPair: "BTC_LEND",
    },
    BTC_REN: {
      id: 353,
      baseID: 28,
      quoteID: 367,
      base: "BTC",
      quote: "REN",
      currencyPair: "BTC_REN",
    },
    BTC_LRC: {
      id: 355,
      baseID: 28,
      quoteID: 368,
      base: "BTC",
      quote: "LRC",
      currencyPair: "BTC_LRC",
    },
    BTC_SXP: {
      id: 364,
      baseID: 28,
      quoteID: 373,
      base: "BTC",
      quote: "SXP",
      currencyPair: "BTC_SXP",
    },
    BTC_SWAP: {
      id: 379,
      baseID: 28,
      quoteID: 384,
      base: "BTC",
      quote: "SWAP",
      currencyPair: "BTC_SWAP",
    },
    BTC_DMG: {
      id: 408,
      baseID: 28,
      quoteID: 404,
      base: "BTC",
      quote: "DMG",
      currencyPair: "BTC_DMG",
    },
    BTC_SWINGBY: {
      id: 403,
      baseID: 28,
      quoteID: 409,
      base: "BTC",
      quote: "SWINGBY",
      currencyPair: "BTC_SWINGBY",
    },
    BTC_FUND: {
      id: 432,
      baseID: 28,
      quoteID: 410,
      base: "BTC",
      quote: "FUND",
      currencyPair: "BTC_FUND",
    },
    BTC_FCT2: {
      id: 414,
      baseID: 28,
      quoteID: 413,
      base: "BTC",
      quote: "FCT2",
      currencyPair: "BTC_FCT2",
    },
    USDT_BCN: {
      id: 320,
      baseID: 214,
      quoteID: 17,
      base: "USDT",
      quote: "BCN",
      currencyPair: "USDT_BCN",
    },
    USDT_BTC: {
      id: 121,
      baseID: 214,
      quoteID: 28,
      base: "USDT",
      quote: "BTC",
      currencyPair: "USDT_BTC",
    },
    USDT_DOGE: {
      id: 216,
      baseID: 214,
      quoteID: 59,
      base: "USDT",
      quote: "DOGE",
      currencyPair: "USDT_DOGE",
    },
    USDT_DASH: {
      id: 122,
      baseID: 214,
      quoteID: 60,
      base: "USDT",
      quote: "DASH",
      currencyPair: "USDT_DASH",
    },
    USDT_EXE: {
      id: 383,
      baseID: 214,
      quoteID: 73,
      base: "USDT",
      quote: "EXE",
      currencyPair: "USDT_EXE",
    },
    USDT_LTC: {
      id: 123,
      baseID: 214,
      quoteID: 125,
      base: "USDT",
      quote: "LTC",
      currencyPair: "USDT_LTC",
    },
    USDT_STR: {
      id: 125,
      baseID: 214,
      quoteID: 198,
      base: "USDT",
      quote: "STR",
      currencyPair: "USDT_STR",
    },
    USDT_SUN: {
      id: 434,
      baseID: 214,
      quoteID: 200,
      base: "USDT",
      quote: "SUN",
      currencyPair: "USDT_SUN",
    },
    USDT_XMR: {
      id: 126,
      baseID: 214,
      quoteID: 240,
      base: "USDT",
      quote: "XMR",
      currencyPair: "USDT_XMR",
    },
    USDT_XRP: {
      id: 127,
      baseID: 214,
      quoteID: 243,
      base: "USDT",
      quote: "XRP",
      currencyPair: "USDT_XRP",
    },
    USDT_ETH: {
      id: 149,
      baseID: 214,
      quoteID: 267,
      base: "USDT",
      quote: "ETH",
      currencyPair: "USDT_ETH",
    },
    USDT_SC: {
      id: 219,
      baseID: 214,
      quoteID: 268,
      base: "USDT",
      quote: "SC",
      currencyPair: "USDT_SC",
    },
    USDT_LSK: {
      id: 218,
      baseID: 214,
      quoteID: 278,
      base: "USDT",
      quote: "LSK",
      currencyPair: "USDT_LSK",
    },
    USDT_STEEM: {
      id: 321,
      baseID: 214,
      quoteID: 281,
      base: "USDT",
      quote: "STEEM",
      currencyPair: "USDT_STEEM",
    },
    USDT_ETC: {
      id: 173,
      baseID: 214,
      quoteID: 283,
      base: "USDT",
      quote: "ETC",
      currencyPair: "USDT_ETC",
    },
    USDT_REP: {
      id: 175,
      baseID: 214,
      quoteID: 284,
      base: "USDT",
      quote: "REP",
      currencyPair: "USDT_REP",
    },
    USDT_ZEC: {
      id: 180,
      baseID: 214,
      quoteID: 286,
      base: "USDT",
      quote: "ZEC",
      currencyPair: "USDT_ZEC",
    },
    USDT_GNT: {
      id: 217,
      baseID: 214,
      quoteID: 290,
      base: "USDT",
      quote: "GNT",
      currencyPair: "USDT_GNT",
    },
    USDT_ZRX: {
      id: 220,
      baseID: 214,
      quoteID: 293,
      base: "USDT",
      quote: "ZRX",
      currencyPair: "USDT_ZRX",
    },
    USDT_EOS: {
      id: 203,
      baseID: 214,
      quoteID: 298,
      base: "USDT",
      quote: "EOS",
      currencyPair: "USDT_EOS",
    },
    USDT_BAT: {
      id: 212,
      baseID: 214,
      quoteID: 302,
      base: "USDT",
      quote: "BAT",
      currencyPair: "USDT_BAT",
    },
    USDT_QTUM: {
      id: 223,
      baseID: 214,
      quoteID: 304,
      base: "USDT",
      quote: "QTUM",
      currencyPair: "USDT_QTUM",
    },
    USDT_MANA: {
      id: 231,
      baseID: 214,
      quoteID: 306,
      base: "USDT",
      quote: "MANA",
      currencyPair: "USDT_MANA",
    },
    USDT_BCHABC: {
      id: 260,
      baseID: 214,
      quoteID: 308,
      base: "USDT",
      quote: "BCHABC",
      currencyPair: "USDT_BCHABC",
    },
    USDT_BCHSV: {
      id: 259,
      baseID: 214,
      quoteID: 309,
      base: "USDT",
      quote: "BCHSV",
      currencyPair: "USDT_BCHSV",
    },
    USDT_ATOM: {
      id: 255,
      baseID: 214,
      quoteID: 313,
      base: "USDT",
      quote: "ATOM",
      currencyPair: "USDT_ATOM",
    },
    USDT_GRIN: {
      id: 261,
      baseID: 214,
      quoteID: 314,
      base: "USDT",
      quote: "GRIN",
      currencyPair: "USDT_GRIN",
    },
    USDT_TRX: {
      id: 265,
      baseID: 214,
      quoteID: 315,
      base: "USDT",
      quote: "TRX",
      currencyPair: "USDT_TRX",
    },
    USDT_BTT: {
      id: 270,
      baseID: 214,
      quoteID: 320,
      base: "USDT",
      quote: "BTT",
      currencyPair: "USDT_BTT",
    },
    USDT_WIN: {
      id: 272,
      baseID: 214,
      quoteID: 321,
      base: "USDT",
      quote: "WIN",
      currencyPair: "USDT_WIN",
    },
    USDT_BEAR: {
      id: 280,
      baseID: 214,
      quoteID: 322,
      base: "USDT",
      quote: "BEAR",
      currencyPair: "USDT_BEAR",
    },
    USDT_BULL: {
      id: 281,
      baseID: 214,
      quoteID: 323,
      base: "USDT",
      quote: "BULL",
      currencyPair: "USDT_BULL",
    },
    USDT_BUSD: {
      id: 338,
      baseID: 214,
      quoteID: 324,
      base: "USDT",
      quote: "BUSD",
      currencyPair: "USDT_BUSD",
    },
    USDT_DAI: {
      id: 308,
      baseID: 214,
      quoteID: 325,
      base: "USDT",
      quote: "DAI",
      currencyPair: "USDT_DAI",
    },
    USDT_LINK: {
      id: 322,
      baseID: 214,
      quoteID: 327,
      base: "USDT",
      quote: "LINK",
      currencyPair: "USDT_LINK",
    },
    USDT_MKR: {
      id: 303,
      baseID: 214,
      quoteID: 328,
      base: "USDT",
      quote: "MKR",
      currencyPair: "USDT_MKR",
    },
    USDT_PAX: {
      id: 286,
      baseID: 214,
      quoteID: 329,
      base: "USDT",
      quote: "PAX",
      currencyPair: "USDT_PAX",
    },
    USDT_TRXBEAR: {
      id: 282,
      baseID: 214,
      quoteID: 330,
      base: "USDT",
      quote: "TRXBEAR",
      currencyPair: "USDT_TRXBEAR",
    },
    USDT_TRXBULL: {
      id: 283,
      baseID: 214,
      quoteID: 331,
      base: "USDT",
      quote: "TRXBULL",
      currencyPair: "USDT_TRXBULL",
    },
    USDT_ETHBEAR: {
      id: 300,
      baseID: 214,
      quoteID: 333,
      base: "USDT",
      quote: "ETHBEAR",
      currencyPair: "USDT_ETHBEAR",
    },
    USDT_ETHBULL: {
      id: 301,
      baseID: 214,
      quoteID: 334,
      base: "USDT",
      quote: "ETHBULL",
      currencyPair: "USDT_ETHBULL",
    },
    USDT_SNX: {
      id: 291,
      baseID: 214,
      quoteID: 335,
      base: "USDT",
      quote: "SNX",
      currencyPair: "USDT_SNX",
    },
    USDT_XTZ: {
      id: 278,
      baseID: 214,
      quoteID: 336,
      base: "USDT",
      quote: "XTZ",
      currencyPair: "USDT_XTZ",
    },
    USDT_USDJ: {
      id: 287,
      baseID: 214,
      quoteID: 337,
      base: "USDT",
      quote: "USDJ",
      currencyPair: "USDT_USDJ",
    },
    USDT_MATIC: {
      id: 296,
      baseID: 214,
      quoteID: 338,
      base: "USDT",
      quote: "MATIC",
      currencyPair: "USDT_MATIC",
    },
    USDT_BCHBEAR: {
      id: 298,
      baseID: 214,
      quoteID: 339,
      base: "USDT",
      quote: "BCHBEAR",
      currencyPair: "USDT_BCHBEAR",
    },
    USDT_BCHBULL: {
      id: 299,
      baseID: 214,
      quoteID: 340,
      base: "USDT",
      quote: "BCHBULL",
      currencyPair: "USDT_BCHBULL",
    },
    USDT_BSVBEAR: {
      id: 293,
      baseID: 214,
      quoteID: 341,
      base: "USDT",
      quote: "BSVBEAR",
      currencyPair: "USDT_BSVBEAR",
    },
    USDT_BSVBULL: {
      id: 294,
      baseID: 214,
      quoteID: 342,
      base: "USDT",
      quote: "BSVBULL",
      currencyPair: "USDT_BSVBULL",
    },
    USDT_BNB: {
      id: 337,
      baseID: 214,
      quoteID: 343,
      base: "USDT",
      quote: "BNB",
      currencyPair: "USDT_BNB",
    },
    USDT_AVA: {
      id: 325,
      baseID: 214,
      quoteID: 344,
      base: "USDT",
      quote: "AVA",
      currencyPair: "USDT_AVA",
    },
    USDT_JST: {
      id: 315,
      baseID: 214,
      quoteID: 345,
      base: "USDT",
      quote: "JST",
      currencyPair: "USDT_JST",
    },
    USDT_BVOL: {
      id: 304,
      baseID: 214,
      quoteID: 346,
      base: "USDT",
      quote: "BVOL",
      currencyPair: "USDT_BVOL",
    },
    USDT_IBVOL: {
      id: 305,
      baseID: 214,
      quoteID: 347,
      base: "USDT",
      quote: "IBVOL",
      currencyPair: "USDT_IBVOL",
    },
    USDT_NEO: {
      id: 310,
      baseID: 214,
      quoteID: 348,
      base: "USDT",
      quote: "NEO",
      currencyPair: "USDT_NEO",
    },
    USDT_SWFTC: {
      id: 313,
      baseID: 214,
      quoteID: 349,
      base: "USDT",
      quote: "SWFTC",
      currencyPair: "USDT_SWFTC",
    },
    USDT_STPT: {
      id: 370,
      baseID: 214,
      quoteID: 350,
      base: "USDT",
      quote: "STPT",
      currencyPair: "USDT_STPT",
    },
    USDT_FXC: {
      id: 318,
      baseID: 214,
      quoteID: 351,
      base: "USDT",
      quote: "FXC",
      currencyPair: "USDT_FXC",
    },
    USDT_XRPBULL: {
      id: 327,
      baseID: 214,
      quoteID: 352,
      base: "USDT",
      quote: "XRPBULL",
      currencyPair: "USDT_XRPBULL",
    },
    USDT_XRPBEAR: {
      id: 328,
      baseID: 214,
      quoteID: 353,
      base: "USDT",
      quote: "XRPBEAR",
      currencyPair: "USDT_XRPBEAR",
    },
    USDT_EOSBULL: {
      id: 329,
      baseID: 214,
      quoteID: 354,
      base: "USDT",
      quote: "EOSBULL",
      currencyPair: "USDT_EOSBULL",
    },
    USDT_EOSBEAR: {
      id: 330,
      baseID: 214,
      quoteID: 355,
      base: "USDT",
      quote: "EOSBEAR",
      currencyPair: "USDT_EOSBEAR",
    },
    USDT_LINKBULL: {
      id: 331,
      baseID: 214,
      quoteID: 356,
      base: "USDT",
      quote: "LINKBULL",
      currencyPair: "USDT_LINKBULL",
    },
    USDT_LINKBEAR: {
      id: 332,
      baseID: 214,
      quoteID: 357,
      base: "USDT",
      quote: "LINKBEAR",
      currencyPair: "USDT_LINKBEAR",
    },
    USDT_CHR: {
      id: 334,
      baseID: 214,
      quoteID: 358,
      base: "USDT",
      quote: "CHR",
      currencyPair: "USDT_CHR",
    },
    USDT_MDT: {
      id: 343,
      baseID: 214,
      quoteID: 359,
      base: "USDT",
      quote: "MDT",
      currencyPair: "USDT_MDT",
    },
    USDT_BCHC: {
      id: 345,
      baseID: 214,
      quoteID: 360,
      base: "USDT",
      quote: "BCHC",
      currencyPair: "USDT_BCHC",
    },
    USDT_COMP: {
      id: 346,
      baseID: 214,
      quoteID: 361,
      base: "USDT",
      quote: "COMP",
      currencyPair: "USDT_COMP",
    },
    USDT_WRX: {
      id: 360,
      baseID: 214,
      quoteID: 363,
      base: "USDT",
      quote: "WRX",
      currencyPair: "USDT_WRX",
    },
    USDT_CUSDT: {
      id: 350,
      baseID: 214,
      quoteID: 364,
      base: "USDT",
      quote: "CUSDT",
      currencyPair: "USDT_CUSDT",
    },
    USDT_XFIL: {
      id: 349,
      baseID: 214,
      quoteID: 365,
      base: "USDT",
      quote: "XFIL",
      currencyPair: "USDT_XFIL",
    },
    USDT_LEND: {
      id: 352,
      baseID: 214,
      quoteID: 366,
      base: "USDT",
      quote: "LEND",
      currencyPair: "USDT_LEND",
    },
    USDT_REN: {
      id: 354,
      baseID: 214,
      quoteID: 367,
      base: "USDT",
      quote: "REN",
      currencyPair: "USDT_REN",
    },
    USDT_LRC: {
      id: 356,
      baseID: 214,
      quoteID: 368,
      base: "USDT",
      quote: "LRC",
      currencyPair: "USDT_LRC",
    },
    USDT_BAL: {
      id: 357,
      baseID: 214,
      quoteID: 369,
      base: "USDT",
      quote: "BAL",
      currencyPair: "USDT_BAL",
    },
    USDT_STAKE: {
      id: 362,
      baseID: 214,
      quoteID: 371,
      base: "USDT",
      quote: "STAKE",
      currencyPair: "USDT_STAKE",
    },
    USDT_BZRX: {
      id: 363,
      baseID: 214,
      quoteID: 372,
      base: "USDT",
      quote: "BZRX",
      currencyPair: "USDT_BZRX",
    },
    USDT_SXP: {
      id: 365,
      baseID: 214,
      quoteID: 373,
      base: "USDT",
      quote: "SXP",
      currencyPair: "USDT_SXP",
    },
    USDT_MTA: {
      id: 367,
      baseID: 214,
      quoteID: 374,
      base: "USDT",
      quote: "MTA",
      currencyPair: "USDT_MTA",
    },
    USDT_YFI: {
      id: 368,
      baseID: 214,
      quoteID: 375,
      base: "USDT",
      quote: "YFI",
      currencyPair: "USDT_YFI",
    },
    USDT_TRUMPWIN: {
      id: 372,
      baseID: 214,
      quoteID: 377,
      base: "USDT",
      quote: "TRUMPWIN",
      currencyPair: "USDT_TRUMPWIN",
    },
    USDT_TRUMPLOSE: {
      id: 373,
      baseID: 214,
      quoteID: 378,
      base: "USDT",
      quote: "TRUMPLOSE",
      currencyPair: "USDT_TRUMPLOSE",
    },
    USDT_DEC: {
      id: 374,
      baseID: 214,
      quoteID: 379,
      base: "USDT",
      quote: "DEC",
      currencyPair: "USDT_DEC",
    },
    USDT_PLT: {
      id: 375,
      baseID: 214,
      quoteID: 380,
      base: "USDT",
      quote: "PLT",
      currencyPair: "USDT_PLT",
    },
    USDT_UMA: {
      id: 376,
      baseID: 214,
      quoteID: 381,
      base: "USDT",
      quote: "UMA",
      currencyPair: "USDT_UMA",
    },
    USDT_KTON: {
      id: 377,
      baseID: 214,
      quoteID: 382,
      base: "USDT",
      quote: "KTON",
      currencyPair: "USDT_KTON",
    },
    USDT_RING: {
      id: 378,
      baseID: 214,
      quoteID: 383,
      base: "USDT",
      quote: "RING",
      currencyPair: "USDT_RING",
    },
    USDT_SWAP: {
      id: 380,
      baseID: 214,
      quoteID: 384,
      base: "USDT",
      quote: "SWAP",
      currencyPair: "USDT_SWAP",
    },
    USDT_TEND: {
      id: 381,
      baseID: 214,
      quoteID: 385,
      base: "USDT",
      quote: "TEND",
      currencyPair: "USDT_TEND",
    },
    USDT_TRADE: {
      id: 384,
      baseID: 214,
      quoteID: 386,
      base: "USDT",
      quote: "TRADE",
      currencyPair: "USDT_TRADE",
    },
    USDT_GEEQ: {
      id: 385,
      baseID: 214,
      quoteID: 388,
      base: "USDT",
      quote: "GEEQ",
      currencyPair: "USDT_GEEQ",
    },
    USDT_BAND: {
      id: 387,
      baseID: 214,
      quoteID: 390,
      base: "USDT",
      quote: "BAND",
      currencyPair: "USDT_BAND",
    },
    USDT_DIA: {
      id: 389,
      baseID: 214,
      quoteID: 391,
      base: "USDT",
      quote: "DIA",
      currencyPair: "USDT_DIA",
    },
    USDT_DOS: {
      id: 388,
      baseID: 214,
      quoteID: 392,
      base: "USDT",
      quote: "DOS",
      currencyPair: "USDT_DOS",
    },
    USDT_ZAP: {
      id: 390,
      baseID: 214,
      quoteID: 393,
      base: "USDT",
      quote: "ZAP",
      currencyPair: "USDT_ZAP",
    },
    USDT_TRB: {
      id: 393,
      baseID: 214,
      quoteID: 394,
      base: "USDT",
      quote: "TRB",
      currencyPair: "USDT_TRB",
    },
    USDT_SBREE: {
      id: 391,
      baseID: 214,
      quoteID: 396,
      base: "USDT",
      quote: "SBREE",
      currencyPair: "USDT_SBREE",
    },
    USDT_DEXT: {
      id: 395,
      baseID: 214,
      quoteID: 397,
      base: "USDT",
      quote: "DEXT",
      currencyPair: "USDT_DEXT",
    },
    USDT_MCB: {
      id: 396,
      baseID: 214,
      quoteID: 398,
      base: "USDT",
      quote: "MCB",
      currencyPair: "USDT_MCB",
    },
    USDT_PERX: {
      id: 392,
      baseID: 214,
      quoteID: 399,
      base: "USDT",
      quote: "PERX",
      currencyPair: "USDT_PERX",
    },
    USDT_DOT: {
      id: 407,
      baseID: 214,
      quoteID: 400,
      base: "USDT",
      quote: "DOT",
      currencyPair: "USDT_DOT",
    },
    USDT_CRV: {
      id: 397,
      baseID: 214,
      quoteID: 401,
      base: "USDT",
      quote: "CRV",
      currencyPair: "USDT_CRV",
    },
    USDT_OCEAN: {
      id: 400,
      baseID: 214,
      quoteID: 403,
      base: "USDT",
      quote: "OCEAN",
      currencyPair: "USDT_OCEAN",
    },
    USDT_DMG: {
      id: 409,
      baseID: 214,
      quoteID: 404,
      base: "USDT",
      quote: "DMG",
      currencyPair: "USDT_DMG",
    },
    USDT_OM: {
      id: 399,
      baseID: 214,
      quoteID: 405,
      base: "USDT",
      quote: "OM",
      currencyPair: "USDT_OM",
    },
    USDT_BLY: {
      id: 401,
      baseID: 214,
      quoteID: 406,
      base: "USDT",
      quote: "BLY",
      currencyPair: "USDT_BLY",
    },
    USDT_OPT: {
      id: 402,
      baseID: 214,
      quoteID: 407,
      base: "USDT",
      quote: "OPT",
      currencyPair: "USDT_OPT",
    },
    USDT_PRQ: {
      id: 406,
      baseID: 214,
      quoteID: 408,
      base: "USDT",
      quote: "PRQ",
      currencyPair: "USDT_PRQ",
    },
    USDT_SWINGBY: {
      id: 404,
      baseID: 214,
      quoteID: 409,
      base: "USDT",
      quote: "SWINGBY",
      currencyPair: "USDT_SWINGBY",
    },
    USDT_FUND: {
      id: 430,
      baseID: 214,
      quoteID: 410,
      base: "USDT",
      quote: "FUND",
      currencyPair: "USDT_FUND",
    },
    USDT_RSR: {
      id: 411,
      baseID: 214,
      quoteID: 411,
      base: "USDT",
      quote: "RSR",
      currencyPair: "USDT_RSR",
    },
    USDT_WNXM: {
      id: 412,
      baseID: 214,
      quoteID: 412,
      base: "USDT",
      quote: "WNXM",
      currencyPair: "USDT_WNXM",
    },
    USDT_FCT2: {
      id: 413,
      baseID: 214,
      quoteID: 413,
      base: "USDT",
      quote: "FCT2",
      currencyPair: "USDT_FCT2",
    },
    USDT_SUSHI: {
      id: 415,
      baseID: 214,
      quoteID: 414,
      base: "USDT",
      quote: "SUSHI",
      currencyPair: "USDT_SUSHI",
    },
    USDT_YFII: {
      id: 416,
      baseID: 214,
      quoteID: 415,
      base: "USDT",
      quote: "YFII",
      currencyPair: "USDT_YFII",
    },
    USDT_YFV: {
      id: 417,
      baseID: 214,
      quoteID: 416,
      base: "USDT",
      quote: "YFV",
      currencyPair: "USDT_YFV",
    },
    USDT_YFL: {
      id: 418,
      baseID: 214,
      quoteID: 417,
      base: "USDT",
      quote: "YFL",
      currencyPair: "USDT_YFL",
    },
    USDT_TAI: {
      id: 419,
      baseID: 214,
      quoteID: 418,
      base: "USDT",
      quote: "TAI",
      currencyPair: "USDT_TAI",
    },
    USDT_PEARL: {
      id: 421,
      baseID: 214,
      quoteID: 419,
      base: "USDT",
      quote: "PEARL",
      currencyPair: "USDT_PEARL",
    },
    USDT_ANK: {
      id: 423,
      baseID: 214,
      quoteID: 420,
      base: "USDT",
      quote: "ANK",
      currencyPair: "USDT_ANK",
    },
    USDT_JFI: {
      id: 424,
      baseID: 214,
      quoteID: 421,
      base: "USDT",
      quote: "JFI",
      currencyPair: "USDT_JFI",
    },
    USDT_CRT: {
      id: 425,
      baseID: 214,
      quoteID: 422,
      base: "USDT",
      quote: "CRT",
      currencyPair: "USDT_CRT",
    },
    USDT_SAL: {
      id: 426,
      baseID: 214,
      quoteID: 423,
      base: "USDT",
      quote: "SAL",
      currencyPair: "USDT_SAL",
    },
    USDT_CORN: {
      id: 427,
      baseID: 214,
      quoteID: 424,
      base: "USDT",
      quote: "CORN",
      currencyPair: "USDT_CORN",
    },
    USDT_SWRV: {
      id: 428,
      baseID: 214,
      quoteID: 425,
      base: "USDT",
      quote: "SWRV",
      currencyPair: "USDT_SWRV",
    },
    USDT_FSW: {
      id: 429,
      baseID: 214,
      quoteID: 426,
      base: "USDT",
      quote: "FSW",
      currencyPair: "USDT_FSW",
    },
    USDT_CREAM: {
      id: 433,
      baseID: 214,
      quoteID: 427,
      base: "USDT",
      quote: "CREAM",
      currencyPair: "USDT_CREAM",
    },
    ETH_ETC: {
      id: 172,
      baseID: 267,
      quoteID: 283,
      base: "ETH",
      quote: "ETC",
      currencyPair: "ETH_ETC",
    },
    ETH_ZEC: {
      id: 179,
      baseID: 267,
      quoteID: 286,
      base: "ETH",
      quote: "ZEC",
      currencyPair: "ETH_ZEC",
    },
    ETH_ZRX: {
      id: 193,
      baseID: 267,
      quoteID: 293,
      base: "ETH",
      quote: "ZRX",
      currencyPair: "ETH_ZRX",
    },
    ETH_EOS: {
      id: 202,
      baseID: 267,
      quoteID: 298,
      base: "ETH",
      quote: "EOS",
      currencyPair: "ETH_EOS",
    },
    ETH_BAT: {
      id: 211,
      baseID: 267,
      quoteID: 302,
      base: "ETH",
      quote: "BAT",
      currencyPair: "ETH_BAT",
    },
    ETH_COMP: {
      id: 347,
      baseID: 267,
      quoteID: 361,
      base: "ETH",
      quote: "COMP",
      currencyPair: "ETH_COMP",
    },
    ETH_BAL: {
      id: 358,
      baseID: 267,
      quoteID: 369,
      base: "ETH",
      quote: "BAL",
      currencyPair: "ETH_BAL",
    },
    USDC_BTC: {
      id: 224,
      baseID: 299,
      quoteID: 28,
      base: "USDC",
      quote: "BTC",
      currencyPair: "USDC_BTC",
    },
    USDC_DOGE: {
      id: 243,
      baseID: 299,
      quoteID: 59,
      base: "USDC",
      quote: "DOGE",
      currencyPair: "USDC_DOGE",
    },
    USDC_DASH: {
      id: 256,
      baseID: 299,
      quoteID: 60,
      base: "USDC",
      quote: "DASH",
      currencyPair: "USDC_DASH",
    },
    USDC_LTC: {
      id: 244,
      baseID: 299,
      quoteID: 125,
      base: "USDC",
      quote: "LTC",
      currencyPair: "USDC_LTC",
    },
    USDC_STR: {
      id: 242,
      baseID: 299,
      quoteID: 198,
      base: "USDC",
      quote: "STR",
      currencyPair: "USDC_STR",
    },
    USDC_USDT: {
      id: 226,
      baseID: 299,
      quoteID: 214,
      base: "USDC",
      quote: "USDT",
      currencyPair: "USDC_USDT",
    },
    USDC_XMR: {
      id: 241,
      baseID: 299,
      quoteID: 240,
      base: "USDC",
      quote: "XMR",
      currencyPair: "USDC_XMR",
    },
    USDC_XRP: {
      id: 240,
      baseID: 299,
      quoteID: 243,
      base: "USDC",
      quote: "XRP",
      currencyPair: "USDC_XRP",
    },
    USDC_ETH: {
      id: 225,
      baseID: 299,
      quoteID: 267,
      base: "USDC",
      quote: "ETH",
      currencyPair: "USDC_ETH",
    },
    USDC_ETC: {
      id: 258,
      baseID: 299,
      quoteID: 283,
      base: "USDC",
      quote: "ETC",
      currencyPair: "USDC_ETC",
    },
    USDC_ZEC: {
      id: 245,
      baseID: 299,
      quoteID: 286,
      base: "USDC",
      quote: "ZEC",
      currencyPair: "USDC_ZEC",
    },
    USDC_EOS: {
      id: 257,
      baseID: 299,
      quoteID: 298,
      base: "USDC",
      quote: "EOS",
      currencyPair: "USDC_EOS",
    },
    USDC_BCHABC: {
      id: 237,
      baseID: 299,
      quoteID: 308,
      base: "USDC",
      quote: "BCHABC",
      currencyPair: "USDC_BCHABC",
    },
    USDC_BCHSV: {
      id: 239,
      baseID: 299,
      quoteID: 309,
      base: "USDC",
      quote: "BCHSV",
      currencyPair: "USDC_BCHSV",
    },
    USDC_ATOM: {
      id: 254,
      baseID: 299,
      quoteID: 313,
      base: "USDC",
      quote: "ATOM",
      currencyPair: "USDC_ATOM",
    },
    USDC_GRIN: {
      id: 252,
      baseID: 299,
      quoteID: 314,
      base: "USDC",
      quote: "GRIN",
      currencyPair: "USDC_GRIN",
    },
    USDC_TRX: {
      id: 264,
      baseID: 299,
      quoteID: 315,
      base: "USDC",
      quote: "TRX",
      currencyPair: "USDC_TRX",
    },
    TRX_XRP: {
      id: 268,
      baseID: 315,
      quoteID: 243,
      base: "TRX",
      quote: "XRP",
      currencyPair: "TRX_XRP",
    },
    TRX_ETH: {
      id: 267,
      baseID: 315,
      quoteID: 267,
      base: "TRX",
      quote: "ETH",
      currencyPair: "TRX_ETH",
    },
    TRX_STEEM: {
      id: 274,
      baseID: 315,
      quoteID: 281,
      base: "TRX",
      quote: "STEEM",
      currencyPair: "TRX_STEEM",
    },
    TRX_BTT: {
      id: 271,
      baseID: 315,
      quoteID: 320,
      base: "TRX",
      quote: "BTT",
      currencyPair: "TRX_BTT",
    },
    TRX_WIN: {
      id: 273,
      baseID: 315,
      quoteID: 321,
      base: "TRX",
      quote: "WIN",
      currencyPair: "TRX_WIN",
    },
    TRX_LINK: {
      id: 276,
      baseID: 315,
      quoteID: 327,
      base: "TRX",
      quote: "LINK",
      currencyPair: "TRX_LINK",
    },
    TRX_SNX: {
      id: 292,
      baseID: 315,
      quoteID: 335,
      base: "TRX",
      quote: "SNX",
      currencyPair: "TRX_SNX",
    },
    TRX_XTZ: {
      id: 279,
      baseID: 315,
      quoteID: 336,
      base: "TRX",
      quote: "XTZ",
      currencyPair: "TRX_XTZ",
    },
    TRX_MATIC: {
      id: 297,
      baseID: 315,
      quoteID: 338,
      base: "TRX",
      quote: "MATIC",
      currencyPair: "TRX_MATIC",
    },
    TRX_BNB: {
      id: 339,
      baseID: 315,
      quoteID: 343,
      base: "TRX",
      quote: "BNB",
      currencyPair: "TRX_BNB",
    },
    TRX_AVA: {
      id: 326,
      baseID: 315,
      quoteID: 344,
      base: "TRX",
      quote: "AVA",
      currencyPair: "TRX_AVA",
    },
    TRX_JST: {
      id: 316,
      baseID: 315,
      quoteID: 345,
      base: "TRX",
      quote: "JST",
      currencyPair: "TRX_JST",
    },
    TRX_NEO: {
      id: 311,
      baseID: 315,
      quoteID: 348,
      base: "TRX",
      quote: "NEO",
      currencyPair: "TRX_NEO",
    },
    TRX_SWFTC: {
      id: 314,
      baseID: 315,
      quoteID: 349,
      base: "TRX",
      quote: "SWFTC",
      currencyPair: "TRX_SWFTC",
    },
    TRX_STPT: {
      id: 371,
      baseID: 315,
      quoteID: 350,
      base: "TRX",
      quote: "STPT",
      currencyPair: "TRX_STPT",
    },
    TRX_FXC: {
      id: 319,
      baseID: 315,
      quoteID: 351,
      base: "TRX",
      quote: "FXC",
      currencyPair: "TRX_FXC",
    },
    TRX_CHR: {
      id: 335,
      baseID: 315,
      quoteID: 358,
      base: "TRX",
      quote: "CHR",
      currencyPair: "TRX_CHR",
    },
    TRX_MDT: {
      id: 344,
      baseID: 315,
      quoteID: 359,
      base: "TRX",
      quote: "MDT",
      currencyPair: "TRX_MDT",
    },
    TRX_WRX: {
      id: 361,
      baseID: 315,
      quoteID: 363,
      base: "TRX",
      quote: "WRX",
      currencyPair: "TRX_WRX",
    },
    TRX_SXP: {
      id: 366,
      baseID: 315,
      quoteID: 373,
      base: "TRX",
      quote: "SXP",
      currencyPair: "TRX_SXP",
    },
    TRX_DMG: {
      id: 410,
      baseID: 315,
      quoteID: 404,
      base: "TRX",
      quote: "DMG",
      currencyPair: "TRX_DMG",
    },
    TRX_SWINGBY: {
      id: 405,
      baseID: 315,
      quoteID: 409,
      base: "TRX",
      quote: "SWINGBY",
      currencyPair: "TRX_SWINGBY",
    },
    TRX_FUND: {
      id: 431,
      baseID: 315,
      quoteID: 410,
      base: "TRX",
      quote: "FUND",
      currencyPair: "TRX_FUND",
    },
    TRX_TAI: {
      id: 420,
      baseID: 315,
      quoteID: 418,
      base: "TRX",
      quote: "TAI",
      currencyPair: "TRX_TAI",
    },
    TRX_PEARL: {
      id: 422,
      baseID: 315,
      quoteID: 419,
      base: "TRX",
      quote: "PEARL",
      currencyPair: "TRX_PEARL",
    },
    BUSD_BTC: {
      id: 341,
      baseID: 324,
      quoteID: 28,
      base: "BUSD",
      quote: "BTC",
      currencyPair: "BUSD_BTC",
    },
    BUSD_BNB: {
      id: 340,
      baseID: 324,
      quoteID: 343,
      base: "BUSD",
      quote: "BNB",
      currencyPair: "BUSD_BNB",
    },
    DAI_BTC: {
      id: 306,
      baseID: 325,
      quoteID: 28,
      base: "DAI",
      quote: "BTC",
      currencyPair: "DAI_BTC",
    },
    DAI_ETH: {
      id: 307,
      baseID: 325,
      quoteID: 267,
      base: "DAI",
      quote: "ETH",
      currencyPair: "DAI_ETH",
    },
    PAX_BTC: {
      id: 284,
      baseID: 329,
      quoteID: 28,
      base: "PAX",
      quote: "BTC",
      currencyPair: "PAX_BTC",
    },
    PAX_ETH: {
      id: 285,
      baseID: 329,
      quoteID: 267,
      base: "PAX",
      quote: "ETH",
      currencyPair: "PAX_ETH",
    },
    USDJ_BTC: {
      id: 288,
      baseID: 337,
      quoteID: 28,
      base: "USDJ",
      quote: "BTC",
      currencyPair: "USDJ_BTC",
    },
    USDJ_TRX: {
      id: 289,
      baseID: 337,
      quoteID: 315,
      base: "USDJ",
      quote: "TRX",
      currencyPair: "USDJ_TRX",
    },
    USDJ_BTT: {
      id: 323,
      baseID: 337,
      quoteID: 320,
      base: "USDJ",
      quote: "BTT",
      currencyPair: "USDJ_BTT",
    },
    BNB_BTC: {
      id: 336,
      baseID: 343,
      quoteID: 28,
      base: "BNB",
      quote: "BTC",
      currencyPair: "BNB_BTC",
    },
  },
  byID: {
    "14": {
      id: 14,
      baseID: 28,
      quoteID: 32,
      base: "BTC",
      quote: "BTS",
      currencyPair: "BTC_BTS",
    },
    "27": {
      id: 27,
      baseID: 28,
      quoteID: 59,
      base: "BTC",
      quote: "DOGE",
      currencyPair: "BTC_DOGE",
    },
    "24": {
      id: 24,
      baseID: 28,
      quoteID: 60,
      base: "BTC",
      quote: "DASH",
      currencyPair: "BTC_DASH",
    },
    "382": {
      id: 382,
      baseID: 28,
      quoteID: 73,
      base: "BTC",
      quote: "EXE",
      currencyPair: "BTC_EXE",
    },
    "50": {
      id: 50,
      baseID: 28,
      quoteID: 125,
      base: "BTC",
      quote: "LTC",
      currencyPair: "BTC_LTC",
    },
    "69": {
      id: 69,
      baseID: 28,
      quoteID: 162,
      base: "BTC",
      quote: "NXT",
      currencyPair: "BTC_NXT",
    },
    "89": {
      id: 89,
      baseID: 28,
      quoteID: 198,
      base: "BTC",
      quote: "STR",
      currencyPair: "BTC_STR",
    },
    "114": {
      id: 114,
      baseID: 28,
      quoteID: 240,
      base: "BTC",
      quote: "XMR",
      currencyPair: "BTC_XMR",
    },
    "117": {
      id: 117,
      baseID: 28,
      quoteID: 243,
      base: "BTC",
      quote: "XRP",
      currencyPair: "BTC_XRP",
    },
    "112": {
      id: 112,
      baseID: 28,
      quoteID: 256,
      base: "BTC",
      quote: "XEM",
      currencyPair: "BTC_XEM",
    },
    "148": {
      id: 148,
      baseID: 28,
      quoteID: 267,
      base: "BTC",
      quote: "ETH",
      currencyPair: "BTC_ETH",
    },
    "150": {
      id: 150,
      baseID: 28,
      quoteID: 268,
      base: "BTC",
      quote: "SC",
      currencyPair: "BTC_SC",
    },
    "162": {
      id: 162,
      baseID: 28,
      quoteID: 277,
      base: "BTC",
      quote: "DCR",
      currencyPair: "BTC_DCR",
    },
    "163": {
      id: 163,
      baseID: 28,
      quoteID: 278,
      base: "BTC",
      quote: "LSK",
      currencyPair: "BTC_LSK",
    },
    "168": {
      id: 168,
      baseID: 28,
      quoteID: 281,
      base: "BTC",
      quote: "STEEM",
      currencyPair: "BTC_STEEM",
    },
    "171": {
      id: 171,
      baseID: 28,
      quoteID: 283,
      base: "BTC",
      quote: "ETC",
      currencyPair: "BTC_ETC",
    },
    "174": {
      id: 174,
      baseID: 28,
      quoteID: 284,
      base: "BTC",
      quote: "REP",
      currencyPair: "BTC_REP",
    },
    "177": {
      id: 177,
      baseID: 28,
      quoteID: 285,
      base: "BTC",
      quote: "ARDR",
      currencyPair: "BTC_ARDR",
    },
    "178": {
      id: 178,
      baseID: 28,
      quoteID: 286,
      base: "BTC",
      quote: "ZEC",
      currencyPair: "BTC_ZEC",
    },
    "182": {
      id: 182,
      baseID: 28,
      quoteID: 287,
      base: "BTC",
      quote: "STRAT",
      currencyPair: "BTC_STRAT",
    },
    "185": {
      id: 185,
      baseID: 28,
      quoteID: 290,
      base: "BTC",
      quote: "GNT",
      currencyPair: "BTC_GNT",
    },
    "192": {
      id: 192,
      baseID: 28,
      quoteID: 293,
      base: "BTC",
      quote: "ZRX",
      currencyPair: "BTC_ZRX",
    },
    "194": {
      id: 194,
      baseID: 28,
      quoteID: 294,
      base: "BTC",
      quote: "CVC",
      currencyPair: "BTC_CVC",
    },
    "196": {
      id: 196,
      baseID: 28,
      quoteID: 295,
      base: "BTC",
      quote: "OMG",
      currencyPair: "BTC_OMG",
    },
    "198": {
      id: 198,
      baseID: 28,
      quoteID: 296,
      base: "BTC",
      quote: "GAS",
      currencyPair: "BTC_GAS",
    },
    "200": {
      id: 200,
      baseID: 28,
      quoteID: 297,
      base: "BTC",
      quote: "STORJ",
      currencyPair: "BTC_STORJ",
    },
    "201": {
      id: 201,
      baseID: 28,
      quoteID: 298,
      base: "BTC",
      quote: "EOS",
      currencyPair: "BTC_EOS",
    },
    "204": {
      id: 204,
      baseID: 28,
      quoteID: 300,
      base: "BTC",
      quote: "SNT",
      currencyPair: "BTC_SNT",
    },
    "207": {
      id: 207,
      baseID: 28,
      quoteID: 301,
      base: "BTC",
      quote: "KNC",
      currencyPair: "BTC_KNC",
    },
    "210": {
      id: 210,
      baseID: 28,
      quoteID: 302,
      base: "BTC",
      quote: "BAT",
      currencyPair: "BTC_BAT",
    },
    "213": {
      id: 213,
      baseID: 28,
      quoteID: 303,
      base: "BTC",
      quote: "LOOM",
      currencyPair: "BTC_LOOM",
    },
    "221": {
      id: 221,
      baseID: 28,
      quoteID: 304,
      base: "BTC",
      quote: "QTUM",
      currencyPair: "BTC_QTUM",
    },
    "232": {
      id: 232,
      baseID: 28,
      quoteID: 305,
      base: "BTC",
      quote: "BNT",
      currencyPair: "BTC_BNT",
    },
    "229": {
      id: 229,
      baseID: 28,
      quoteID: 306,
      base: "BTC",
      quote: "MANA",
      currencyPair: "BTC_MANA",
    },
    "246": {
      id: 246,
      baseID: 28,
      quoteID: 307,
      base: "BTC",
      quote: "FOAM",
      currencyPair: "BTC_FOAM",
    },
    "236": {
      id: 236,
      baseID: 28,
      quoteID: 308,
      base: "BTC",
      quote: "BCHABC",
      currencyPair: "BTC_BCHABC",
    },
    "238": {
      id: 238,
      baseID: 28,
      quoteID: 309,
      base: "BTC",
      quote: "BCHSV",
      currencyPair: "BTC_BCHSV",
    },
    "248": {
      id: 248,
      baseID: 28,
      quoteID: 310,
      base: "BTC",
      quote: "NMR",
      currencyPair: "BTC_NMR",
    },
    "249": {
      id: 249,
      baseID: 28,
      quoteID: 311,
      base: "BTC",
      quote: "POLY",
      currencyPair: "BTC_POLY",
    },
    "250": {
      id: 250,
      baseID: 28,
      quoteID: 312,
      base: "BTC",
      quote: "LPT",
      currencyPair: "BTC_LPT",
    },
    "253": {
      id: 253,
      baseID: 28,
      quoteID: 313,
      base: "BTC",
      quote: "ATOM",
      currencyPair: "BTC_ATOM",
    },
    "263": {
      id: 263,
      baseID: 28,
      quoteID: 315,
      base: "BTC",
      quote: "TRX",
      currencyPair: "BTC_TRX",
    },
    "266": {
      id: 266,
      baseID: 28,
      quoteID: 319,
      base: "BTC",
      quote: "ETHBNT",
      currencyPair: "BTC_ETHBNT",
    },
    "275": {
      id: 275,
      baseID: 28,
      quoteID: 327,
      base: "BTC",
      quote: "LINK",
      currencyPair: "BTC_LINK",
    },
    "302": {
      id: 302,
      baseID: 28,
      quoteID: 328,
      base: "BTC",
      quote: "MKR",
      currencyPair: "BTC_MKR",
    },
    "290": {
      id: 290,
      baseID: 28,
      quoteID: 335,
      base: "BTC",
      quote: "SNX",
      currencyPair: "BTC_SNX",
    },
    "277": {
      id: 277,
      baseID: 28,
      quoteID: 336,
      base: "BTC",
      quote: "XTZ",
      currencyPair: "BTC_XTZ",
    },
    "295": {
      id: 295,
      baseID: 28,
      quoteID: 338,
      base: "BTC",
      quote: "MATIC",
      currencyPair: "BTC_MATIC",
    },
    "324": {
      id: 324,
      baseID: 28,
      quoteID: 344,
      base: "BTC",
      quote: "AVA",
      currencyPair: "BTC_AVA",
    },
    "309": {
      id: 309,
      baseID: 28,
      quoteID: 348,
      base: "BTC",
      quote: "NEO",
      currencyPair: "BTC_NEO",
    },
    "312": {
      id: 312,
      baseID: 28,
      quoteID: 349,
      base: "BTC",
      quote: "SWFTC",
      currencyPair: "BTC_SWFTC",
    },
    "369": {
      id: 369,
      baseID: 28,
      quoteID: 350,
      base: "BTC",
      quote: "STPT",
      currencyPair: "BTC_STPT",
    },
    "317": {
      id: 317,
      baseID: 28,
      quoteID: 351,
      base: "BTC",
      quote: "FXC",
      currencyPair: "BTC_FXC",
    },
    "333": {
      id: 333,
      baseID: 28,
      quoteID: 358,
      base: "BTC",
      quote: "CHR",
      currencyPair: "BTC_CHR",
    },
    "342": {
      id: 342,
      baseID: 28,
      quoteID: 359,
      base: "BTC",
      quote: "MDT",
      currencyPair: "BTC_MDT",
    },
    "359": {
      id: 359,
      baseID: 28,
      quoteID: 363,
      base: "BTC",
      quote: "WRX",
      currencyPair: "BTC_WRX",
    },
    "348": {
      id: 348,
      baseID: 28,
      quoteID: 365,
      base: "BTC",
      quote: "XFIL",
      currencyPair: "BTC_XFIL",
    },
    "351": {
      id: 351,
      baseID: 28,
      quoteID: 366,
      base: "BTC",
      quote: "LEND",
      currencyPair: "BTC_LEND",
    },
    "353": {
      id: 353,
      baseID: 28,
      quoteID: 367,
      base: "BTC",
      quote: "REN",
      currencyPair: "BTC_REN",
    },
    "355": {
      id: 355,
      baseID: 28,
      quoteID: 368,
      base: "BTC",
      quote: "LRC",
      currencyPair: "BTC_LRC",
    },
    "364": {
      id: 364,
      baseID: 28,
      quoteID: 373,
      base: "BTC",
      quote: "SXP",
      currencyPair: "BTC_SXP",
    },
    "379": {
      id: 379,
      baseID: 28,
      quoteID: 384,
      base: "BTC",
      quote: "SWAP",
      currencyPair: "BTC_SWAP",
    },
    "408": {
      id: 408,
      baseID: 28,
      quoteID: 404,
      base: "BTC",
      quote: "DMG",
      currencyPair: "BTC_DMG",
    },
    "403": {
      id: 403,
      baseID: 28,
      quoteID: 409,
      base: "BTC",
      quote: "SWINGBY",
      currencyPair: "BTC_SWINGBY",
    },
    "432": {
      id: 432,
      baseID: 28,
      quoteID: 410,
      base: "BTC",
      quote: "FUND",
      currencyPair: "BTC_FUND",
    },
    "414": {
      id: 414,
      baseID: 28,
      quoteID: 413,
      base: "BTC",
      quote: "FCT2",
      currencyPair: "BTC_FCT2",
    },
    "320": {
      id: 320,
      baseID: 214,
      quoteID: 17,
      base: "USDT",
      quote: "BCN",
      currencyPair: "USDT_BCN",
    },
    "121": {
      id: 121,
      baseID: 214,
      quoteID: 28,
      base: "USDT",
      quote: "BTC",
      currencyPair: "USDT_BTC",
    },
    "216": {
      id: 216,
      baseID: 214,
      quoteID: 59,
      base: "USDT",
      quote: "DOGE",
      currencyPair: "USDT_DOGE",
    },
    "122": {
      id: 122,
      baseID: 214,
      quoteID: 60,
      base: "USDT",
      quote: "DASH",
      currencyPair: "USDT_DASH",
    },
    "383": {
      id: 383,
      baseID: 214,
      quoteID: 73,
      base: "USDT",
      quote: "EXE",
      currencyPair: "USDT_EXE",
    },
    "123": {
      id: 123,
      baseID: 214,
      quoteID: 125,
      base: "USDT",
      quote: "LTC",
      currencyPair: "USDT_LTC",
    },
    "125": {
      id: 125,
      baseID: 214,
      quoteID: 198,
      base: "USDT",
      quote: "STR",
      currencyPair: "USDT_STR",
    },
    "434": {
      id: 434,
      baseID: 214,
      quoteID: 200,
      base: "USDT",
      quote: "SUN",
      currencyPair: "USDT_SUN",
    },
    "126": {
      id: 126,
      baseID: 214,
      quoteID: 240,
      base: "USDT",
      quote: "XMR",
      currencyPair: "USDT_XMR",
    },
    "127": {
      id: 127,
      baseID: 214,
      quoteID: 243,
      base: "USDT",
      quote: "XRP",
      currencyPair: "USDT_XRP",
    },
    "149": {
      id: 149,
      baseID: 214,
      quoteID: 267,
      base: "USDT",
      quote: "ETH",
      currencyPair: "USDT_ETH",
    },
    "219": {
      id: 219,
      baseID: 214,
      quoteID: 268,
      base: "USDT",
      quote: "SC",
      currencyPair: "USDT_SC",
    },
    "218": {
      id: 218,
      baseID: 214,
      quoteID: 278,
      base: "USDT",
      quote: "LSK",
      currencyPair: "USDT_LSK",
    },
    "321": {
      id: 321,
      baseID: 214,
      quoteID: 281,
      base: "USDT",
      quote: "STEEM",
      currencyPair: "USDT_STEEM",
    },
    "173": {
      id: 173,
      baseID: 214,
      quoteID: 283,
      base: "USDT",
      quote: "ETC",
      currencyPair: "USDT_ETC",
    },
    "175": {
      id: 175,
      baseID: 214,
      quoteID: 284,
      base: "USDT",
      quote: "REP",
      currencyPair: "USDT_REP",
    },
    "180": {
      id: 180,
      baseID: 214,
      quoteID: 286,
      base: "USDT",
      quote: "ZEC",
      currencyPair: "USDT_ZEC",
    },
    "217": {
      id: 217,
      baseID: 214,
      quoteID: 290,
      base: "USDT",
      quote: "GNT",
      currencyPair: "USDT_GNT",
    },
    "220": {
      id: 220,
      baseID: 214,
      quoteID: 293,
      base: "USDT",
      quote: "ZRX",
      currencyPair: "USDT_ZRX",
    },
    "203": {
      id: 203,
      baseID: 214,
      quoteID: 298,
      base: "USDT",
      quote: "EOS",
      currencyPair: "USDT_EOS",
    },
    "212": {
      id: 212,
      baseID: 214,
      quoteID: 302,
      base: "USDT",
      quote: "BAT",
      currencyPair: "USDT_BAT",
    },
    "223": {
      id: 223,
      baseID: 214,
      quoteID: 304,
      base: "USDT",
      quote: "QTUM",
      currencyPair: "USDT_QTUM",
    },
    "231": {
      id: 231,
      baseID: 214,
      quoteID: 306,
      base: "USDT",
      quote: "MANA",
      currencyPair: "USDT_MANA",
    },
    "260": {
      id: 260,
      baseID: 214,
      quoteID: 308,
      base: "USDT",
      quote: "BCHABC",
      currencyPair: "USDT_BCHABC",
    },
    "259": {
      id: 259,
      baseID: 214,
      quoteID: 309,
      base: "USDT",
      quote: "BCHSV",
      currencyPair: "USDT_BCHSV",
    },
    "255": {
      id: 255,
      baseID: 214,
      quoteID: 313,
      base: "USDT",
      quote: "ATOM",
      currencyPair: "USDT_ATOM",
    },
    "261": {
      id: 261,
      baseID: 214,
      quoteID: 314,
      base: "USDT",
      quote: "GRIN",
      currencyPair: "USDT_GRIN",
    },
    "265": {
      id: 265,
      baseID: 214,
      quoteID: 315,
      base: "USDT",
      quote: "TRX",
      currencyPair: "USDT_TRX",
    },
    "270": {
      id: 270,
      baseID: 214,
      quoteID: 320,
      base: "USDT",
      quote: "BTT",
      currencyPair: "USDT_BTT",
    },
    "272": {
      id: 272,
      baseID: 214,
      quoteID: 321,
      base: "USDT",
      quote: "WIN",
      currencyPair: "USDT_WIN",
    },
    "280": {
      id: 280,
      baseID: 214,
      quoteID: 322,
      base: "USDT",
      quote: "BEAR",
      currencyPair: "USDT_BEAR",
    },
    "281": {
      id: 281,
      baseID: 214,
      quoteID: 323,
      base: "USDT",
      quote: "BULL",
      currencyPair: "USDT_BULL",
    },
    "338": {
      id: 338,
      baseID: 214,
      quoteID: 324,
      base: "USDT",
      quote: "BUSD",
      currencyPair: "USDT_BUSD",
    },
    "308": {
      id: 308,
      baseID: 214,
      quoteID: 325,
      base: "USDT",
      quote: "DAI",
      currencyPair: "USDT_DAI",
    },
    "322": {
      id: 322,
      baseID: 214,
      quoteID: 327,
      base: "USDT",
      quote: "LINK",
      currencyPair: "USDT_LINK",
    },
    "303": {
      id: 303,
      baseID: 214,
      quoteID: 328,
      base: "USDT",
      quote: "MKR",
      currencyPair: "USDT_MKR",
    },
    "286": {
      id: 286,
      baseID: 214,
      quoteID: 329,
      base: "USDT",
      quote: "PAX",
      currencyPair: "USDT_PAX",
    },
    "282": {
      id: 282,
      baseID: 214,
      quoteID: 330,
      base: "USDT",
      quote: "TRXBEAR",
      currencyPair: "USDT_TRXBEAR",
    },
    "283": {
      id: 283,
      baseID: 214,
      quoteID: 331,
      base: "USDT",
      quote: "TRXBULL",
      currencyPair: "USDT_TRXBULL",
    },
    "300": {
      id: 300,
      baseID: 214,
      quoteID: 333,
      base: "USDT",
      quote: "ETHBEAR",
      currencyPair: "USDT_ETHBEAR",
    },
    "301": {
      id: 301,
      baseID: 214,
      quoteID: 334,
      base: "USDT",
      quote: "ETHBULL",
      currencyPair: "USDT_ETHBULL",
    },
    "291": {
      id: 291,
      baseID: 214,
      quoteID: 335,
      base: "USDT",
      quote: "SNX",
      currencyPair: "USDT_SNX",
    },
    "278": {
      id: 278,
      baseID: 214,
      quoteID: 336,
      base: "USDT",
      quote: "XTZ",
      currencyPair: "USDT_XTZ",
    },
    "287": {
      id: 287,
      baseID: 214,
      quoteID: 337,
      base: "USDT",
      quote: "USDJ",
      currencyPair: "USDT_USDJ",
    },
    "296": {
      id: 296,
      baseID: 214,
      quoteID: 338,
      base: "USDT",
      quote: "MATIC",
      currencyPair: "USDT_MATIC",
    },
    "298": {
      id: 298,
      baseID: 214,
      quoteID: 339,
      base: "USDT",
      quote: "BCHBEAR",
      currencyPair: "USDT_BCHBEAR",
    },
    "299": {
      id: 299,
      baseID: 214,
      quoteID: 340,
      base: "USDT",
      quote: "BCHBULL",
      currencyPair: "USDT_BCHBULL",
    },
    "293": {
      id: 293,
      baseID: 214,
      quoteID: 341,
      base: "USDT",
      quote: "BSVBEAR",
      currencyPair: "USDT_BSVBEAR",
    },
    "294": {
      id: 294,
      baseID: 214,
      quoteID: 342,
      base: "USDT",
      quote: "BSVBULL",
      currencyPair: "USDT_BSVBULL",
    },
    "337": {
      id: 337,
      baseID: 214,
      quoteID: 343,
      base: "USDT",
      quote: "BNB",
      currencyPair: "USDT_BNB",
    },
    "325": {
      id: 325,
      baseID: 214,
      quoteID: 344,
      base: "USDT",
      quote: "AVA",
      currencyPair: "USDT_AVA",
    },
    "315": {
      id: 315,
      baseID: 214,
      quoteID: 345,
      base: "USDT",
      quote: "JST",
      currencyPair: "USDT_JST",
    },
    "304": {
      id: 304,
      baseID: 214,
      quoteID: 346,
      base: "USDT",
      quote: "BVOL",
      currencyPair: "USDT_BVOL",
    },
    "305": {
      id: 305,
      baseID: 214,
      quoteID: 347,
      base: "USDT",
      quote: "IBVOL",
      currencyPair: "USDT_IBVOL",
    },
    "310": {
      id: 310,
      baseID: 214,
      quoteID: 348,
      base: "USDT",
      quote: "NEO",
      currencyPair: "USDT_NEO",
    },
    "313": {
      id: 313,
      baseID: 214,
      quoteID: 349,
      base: "USDT",
      quote: "SWFTC",
      currencyPair: "USDT_SWFTC",
    },
    "370": {
      id: 370,
      baseID: 214,
      quoteID: 350,
      base: "USDT",
      quote: "STPT",
      currencyPair: "USDT_STPT",
    },
    "318": {
      id: 318,
      baseID: 214,
      quoteID: 351,
      base: "USDT",
      quote: "FXC",
      currencyPair: "USDT_FXC",
    },
    "327": {
      id: 327,
      baseID: 214,
      quoteID: 352,
      base: "USDT",
      quote: "XRPBULL",
      currencyPair: "USDT_XRPBULL",
    },
    "328": {
      id: 328,
      baseID: 214,
      quoteID: 353,
      base: "USDT",
      quote: "XRPBEAR",
      currencyPair: "USDT_XRPBEAR",
    },
    "329": {
      id: 329,
      baseID: 214,
      quoteID: 354,
      base: "USDT",
      quote: "EOSBULL",
      currencyPair: "USDT_EOSBULL",
    },
    "330": {
      id: 330,
      baseID: 214,
      quoteID: 355,
      base: "USDT",
      quote: "EOSBEAR",
      currencyPair: "USDT_EOSBEAR",
    },
    "331": {
      id: 331,
      baseID: 214,
      quoteID: 356,
      base: "USDT",
      quote: "LINKBULL",
      currencyPair: "USDT_LINKBULL",
    },
    "332": {
      id: 332,
      baseID: 214,
      quoteID: 357,
      base: "USDT",
      quote: "LINKBEAR",
      currencyPair: "USDT_LINKBEAR",
    },
    "334": {
      id: 334,
      baseID: 214,
      quoteID: 358,
      base: "USDT",
      quote: "CHR",
      currencyPair: "USDT_CHR",
    },
    "343": {
      id: 343,
      baseID: 214,
      quoteID: 359,
      base: "USDT",
      quote: "MDT",
      currencyPair: "USDT_MDT",
    },
    "345": {
      id: 345,
      baseID: 214,
      quoteID: 360,
      base: "USDT",
      quote: "BCHC",
      currencyPair: "USDT_BCHC",
    },
    "346": {
      id: 346,
      baseID: 214,
      quoteID: 361,
      base: "USDT",
      quote: "COMP",
      currencyPair: "USDT_COMP",
    },
    "360": {
      id: 360,
      baseID: 214,
      quoteID: 363,
      base: "USDT",
      quote: "WRX",
      currencyPair: "USDT_WRX",
    },
    "350": {
      id: 350,
      baseID: 214,
      quoteID: 364,
      base: "USDT",
      quote: "CUSDT",
      currencyPair: "USDT_CUSDT",
    },
    "349": {
      id: 349,
      baseID: 214,
      quoteID: 365,
      base: "USDT",
      quote: "XFIL",
      currencyPair: "USDT_XFIL",
    },
    "352": {
      id: 352,
      baseID: 214,
      quoteID: 366,
      base: "USDT",
      quote: "LEND",
      currencyPair: "USDT_LEND",
    },
    "354": {
      id: 354,
      baseID: 214,
      quoteID: 367,
      base: "USDT",
      quote: "REN",
      currencyPair: "USDT_REN",
    },
    "356": {
      id: 356,
      baseID: 214,
      quoteID: 368,
      base: "USDT",
      quote: "LRC",
      currencyPair: "USDT_LRC",
    },
    "357": {
      id: 357,
      baseID: 214,
      quoteID: 369,
      base: "USDT",
      quote: "BAL",
      currencyPair: "USDT_BAL",
    },
    "362": {
      id: 362,
      baseID: 214,
      quoteID: 371,
      base: "USDT",
      quote: "STAKE",
      currencyPair: "USDT_STAKE",
    },
    "363": {
      id: 363,
      baseID: 214,
      quoteID: 372,
      base: "USDT",
      quote: "BZRX",
      currencyPair: "USDT_BZRX",
    },
    "365": {
      id: 365,
      baseID: 214,
      quoteID: 373,
      base: "USDT",
      quote: "SXP",
      currencyPair: "USDT_SXP",
    },
    "367": {
      id: 367,
      baseID: 214,
      quoteID: 374,
      base: "USDT",
      quote: "MTA",
      currencyPair: "USDT_MTA",
    },
    "368": {
      id: 368,
      baseID: 214,
      quoteID: 375,
      base: "USDT",
      quote: "YFI",
      currencyPair: "USDT_YFI",
    },
    "372": {
      id: 372,
      baseID: 214,
      quoteID: 377,
      base: "USDT",
      quote: "TRUMPWIN",
      currencyPair: "USDT_TRUMPWIN",
    },
    "373": {
      id: 373,
      baseID: 214,
      quoteID: 378,
      base: "USDT",
      quote: "TRUMPLOSE",
      currencyPair: "USDT_TRUMPLOSE",
    },
    "374": {
      id: 374,
      baseID: 214,
      quoteID: 379,
      base: "USDT",
      quote: "DEC",
      currencyPair: "USDT_DEC",
    },
    "375": {
      id: 375,
      baseID: 214,
      quoteID: 380,
      base: "USDT",
      quote: "PLT",
      currencyPair: "USDT_PLT",
    },
    "376": {
      id: 376,
      baseID: 214,
      quoteID: 381,
      base: "USDT",
      quote: "UMA",
      currencyPair: "USDT_UMA",
    },
    "377": {
      id: 377,
      baseID: 214,
      quoteID: 382,
      base: "USDT",
      quote: "KTON",
      currencyPair: "USDT_KTON",
    },
    "378": {
      id: 378,
      baseID: 214,
      quoteID: 383,
      base: "USDT",
      quote: "RING",
      currencyPair: "USDT_RING",
    },
    "380": {
      id: 380,
      baseID: 214,
      quoteID: 384,
      base: "USDT",
      quote: "SWAP",
      currencyPair: "USDT_SWAP",
    },
    "381": {
      id: 381,
      baseID: 214,
      quoteID: 385,
      base: "USDT",
      quote: "TEND",
      currencyPair: "USDT_TEND",
    },
    "384": {
      id: 384,
      baseID: 214,
      quoteID: 386,
      base: "USDT",
      quote: "TRADE",
      currencyPair: "USDT_TRADE",
    },
    "385": {
      id: 385,
      baseID: 214,
      quoteID: 388,
      base: "USDT",
      quote: "GEEQ",
      currencyPair: "USDT_GEEQ",
    },
    "387": {
      id: 387,
      baseID: 214,
      quoteID: 390,
      base: "USDT",
      quote: "BAND",
      currencyPair: "USDT_BAND",
    },
    "389": {
      id: 389,
      baseID: 214,
      quoteID: 391,
      base: "USDT",
      quote: "DIA",
      currencyPair: "USDT_DIA",
    },
    "388": {
      id: 388,
      baseID: 214,
      quoteID: 392,
      base: "USDT",
      quote: "DOS",
      currencyPair: "USDT_DOS",
    },
    "390": {
      id: 390,
      baseID: 214,
      quoteID: 393,
      base: "USDT",
      quote: "ZAP",
      currencyPair: "USDT_ZAP",
    },
    "393": {
      id: 393,
      baseID: 214,
      quoteID: 394,
      base: "USDT",
      quote: "TRB",
      currencyPair: "USDT_TRB",
    },
    "391": {
      id: 391,
      baseID: 214,
      quoteID: 396,
      base: "USDT",
      quote: "SBREE",
      currencyPair: "USDT_SBREE",
    },
    "395": {
      id: 395,
      baseID: 214,
      quoteID: 397,
      base: "USDT",
      quote: "DEXT",
      currencyPair: "USDT_DEXT",
    },
    "396": {
      id: 396,
      baseID: 214,
      quoteID: 398,
      base: "USDT",
      quote: "MCB",
      currencyPair: "USDT_MCB",
    },
    "392": {
      id: 392,
      baseID: 214,
      quoteID: 399,
      base: "USDT",
      quote: "PERX",
      currencyPair: "USDT_PERX",
    },
    "407": {
      id: 407,
      baseID: 214,
      quoteID: 400,
      base: "USDT",
      quote: "DOT",
      currencyPair: "USDT_DOT",
    },
    "397": {
      id: 397,
      baseID: 214,
      quoteID: 401,
      base: "USDT",
      quote: "CRV",
      currencyPair: "USDT_CRV",
    },
    "400": {
      id: 400,
      baseID: 214,
      quoteID: 403,
      base: "USDT",
      quote: "OCEAN",
      currencyPair: "USDT_OCEAN",
    },
    "409": {
      id: 409,
      baseID: 214,
      quoteID: 404,
      base: "USDT",
      quote: "DMG",
      currencyPair: "USDT_DMG",
    },
    "399": {
      id: 399,
      baseID: 214,
      quoteID: 405,
      base: "USDT",
      quote: "OM",
      currencyPair: "USDT_OM",
    },
    "401": {
      id: 401,
      baseID: 214,
      quoteID: 406,
      base: "USDT",
      quote: "BLY",
      currencyPair: "USDT_BLY",
    },
    "402": {
      id: 402,
      baseID: 214,
      quoteID: 407,
      base: "USDT",
      quote: "OPT",
      currencyPair: "USDT_OPT",
    },
    "406": {
      id: 406,
      baseID: 214,
      quoteID: 408,
      base: "USDT",
      quote: "PRQ",
      currencyPair: "USDT_PRQ",
    },
    "404": {
      id: 404,
      baseID: 214,
      quoteID: 409,
      base: "USDT",
      quote: "SWINGBY",
      currencyPair: "USDT_SWINGBY",
    },
    "430": {
      id: 430,
      baseID: 214,
      quoteID: 410,
      base: "USDT",
      quote: "FUND",
      currencyPair: "USDT_FUND",
    },
    "411": {
      id: 411,
      baseID: 214,
      quoteID: 411,
      base: "USDT",
      quote: "RSR",
      currencyPair: "USDT_RSR",
    },
    "412": {
      id: 412,
      baseID: 214,
      quoteID: 412,
      base: "USDT",
      quote: "WNXM",
      currencyPair: "USDT_WNXM",
    },
    "413": {
      id: 413,
      baseID: 214,
      quoteID: 413,
      base: "USDT",
      quote: "FCT2",
      currencyPair: "USDT_FCT2",
    },
    "415": {
      id: 415,
      baseID: 214,
      quoteID: 414,
      base: "USDT",
      quote: "SUSHI",
      currencyPair: "USDT_SUSHI",
    },
    "416": {
      id: 416,
      baseID: 214,
      quoteID: 415,
      base: "USDT",
      quote: "YFII",
      currencyPair: "USDT_YFII",
    },
    "417": {
      id: 417,
      baseID: 214,
      quoteID: 416,
      base: "USDT",
      quote: "YFV",
      currencyPair: "USDT_YFV",
    },
    "418": {
      id: 418,
      baseID: 214,
      quoteID: 417,
      base: "USDT",
      quote: "YFL",
      currencyPair: "USDT_YFL",
    },
    "419": {
      id: 419,
      baseID: 214,
      quoteID: 418,
      base: "USDT",
      quote: "TAI",
      currencyPair: "USDT_TAI",
    },
    "421": {
      id: 421,
      baseID: 214,
      quoteID: 419,
      base: "USDT",
      quote: "PEARL",
      currencyPair: "USDT_PEARL",
    },
    "423": {
      id: 423,
      baseID: 214,
      quoteID: 420,
      base: "USDT",
      quote: "ANK",
      currencyPair: "USDT_ANK",
    },
    "424": {
      id: 424,
      baseID: 214,
      quoteID: 421,
      base: "USDT",
      quote: "JFI",
      currencyPair: "USDT_JFI",
    },
    "425": {
      id: 425,
      baseID: 214,
      quoteID: 422,
      base: "USDT",
      quote: "CRT",
      currencyPair: "USDT_CRT",
    },
    "426": {
      id: 426,
      baseID: 214,
      quoteID: 423,
      base: "USDT",
      quote: "SAL",
      currencyPair: "USDT_SAL",
    },
    "427": {
      id: 427,
      baseID: 214,
      quoteID: 424,
      base: "USDT",
      quote: "CORN",
      currencyPair: "USDT_CORN",
    },
    "428": {
      id: 428,
      baseID: 214,
      quoteID: 425,
      base: "USDT",
      quote: "SWRV",
      currencyPair: "USDT_SWRV",
    },
    "429": {
      id: 429,
      baseID: 214,
      quoteID: 426,
      base: "USDT",
      quote: "FSW",
      currencyPair: "USDT_FSW",
    },
    "433": {
      id: 433,
      baseID: 214,
      quoteID: 427,
      base: "USDT",
      quote: "CREAM",
      currencyPair: "USDT_CREAM",
    },
    "172": {
      id: 172,
      baseID: 267,
      quoteID: 283,
      base: "ETH",
      quote: "ETC",
      currencyPair: "ETH_ETC",
    },
    "179": {
      id: 179,
      baseID: 267,
      quoteID: 286,
      base: "ETH",
      quote: "ZEC",
      currencyPair: "ETH_ZEC",
    },
    "193": {
      id: 193,
      baseID: 267,
      quoteID: 293,
      base: "ETH",
      quote: "ZRX",
      currencyPair: "ETH_ZRX",
    },
    "202": {
      id: 202,
      baseID: 267,
      quoteID: 298,
      base: "ETH",
      quote: "EOS",
      currencyPair: "ETH_EOS",
    },
    "211": {
      id: 211,
      baseID: 267,
      quoteID: 302,
      base: "ETH",
      quote: "BAT",
      currencyPair: "ETH_BAT",
    },
    "347": {
      id: 347,
      baseID: 267,
      quoteID: 361,
      base: "ETH",
      quote: "COMP",
      currencyPair: "ETH_COMP",
    },
    "358": {
      id: 358,
      baseID: 267,
      quoteID: 369,
      base: "ETH",
      quote: "BAL",
      currencyPair: "ETH_BAL",
    },
    "224": {
      id: 224,
      baseID: 299,
      quoteID: 28,
      base: "USDC",
      quote: "BTC",
      currencyPair: "USDC_BTC",
    },
    "243": {
      id: 243,
      baseID: 299,
      quoteID: 59,
      base: "USDC",
      quote: "DOGE",
      currencyPair: "USDC_DOGE",
    },
    "256": {
      id: 256,
      baseID: 299,
      quoteID: 60,
      base: "USDC",
      quote: "DASH",
      currencyPair: "USDC_DASH",
    },
    "244": {
      id: 244,
      baseID: 299,
      quoteID: 125,
      base: "USDC",
      quote: "LTC",
      currencyPair: "USDC_LTC",
    },
    "242": {
      id: 242,
      baseID: 299,
      quoteID: 198,
      base: "USDC",
      quote: "STR",
      currencyPair: "USDC_STR",
    },
    "226": {
      id: 226,
      baseID: 299,
      quoteID: 214,
      base: "USDC",
      quote: "USDT",
      currencyPair: "USDC_USDT",
    },
    "241": {
      id: 241,
      baseID: 299,
      quoteID: 240,
      base: "USDC",
      quote: "XMR",
      currencyPair: "USDC_XMR",
    },
    "240": {
      id: 240,
      baseID: 299,
      quoteID: 243,
      base: "USDC",
      quote: "XRP",
      currencyPair: "USDC_XRP",
    },
    "225": {
      id: 225,
      baseID: 299,
      quoteID: 267,
      base: "USDC",
      quote: "ETH",
      currencyPair: "USDC_ETH",
    },
    "258": {
      id: 258,
      baseID: 299,
      quoteID: 283,
      base: "USDC",
      quote: "ETC",
      currencyPair: "USDC_ETC",
    },
    "245": {
      id: 245,
      baseID: 299,
      quoteID: 286,
      base: "USDC",
      quote: "ZEC",
      currencyPair: "USDC_ZEC",
    },
    "257": {
      id: 257,
      baseID: 299,
      quoteID: 298,
      base: "USDC",
      quote: "EOS",
      currencyPair: "USDC_EOS",
    },
    "237": {
      id: 237,
      baseID: 299,
      quoteID: 308,
      base: "USDC",
      quote: "BCHABC",
      currencyPair: "USDC_BCHABC",
    },
    "239": {
      id: 239,
      baseID: 299,
      quoteID: 309,
      base: "USDC",
      quote: "BCHSV",
      currencyPair: "USDC_BCHSV",
    },
    "254": {
      id: 254,
      baseID: 299,
      quoteID: 313,
      base: "USDC",
      quote: "ATOM",
      currencyPair: "USDC_ATOM",
    },
    "252": {
      id: 252,
      baseID: 299,
      quoteID: 314,
      base: "USDC",
      quote: "GRIN",
      currencyPair: "USDC_GRIN",
    },
    "264": {
      id: 264,
      baseID: 299,
      quoteID: 315,
      base: "USDC",
      quote: "TRX",
      currencyPair: "USDC_TRX",
    },
    "268": {
      id: 268,
      baseID: 315,
      quoteID: 243,
      base: "TRX",
      quote: "XRP",
      currencyPair: "TRX_XRP",
    },
    "267": {
      id: 267,
      baseID: 315,
      quoteID: 267,
      base: "TRX",
      quote: "ETH",
      currencyPair: "TRX_ETH",
    },
    "274": {
      id: 274,
      baseID: 315,
      quoteID: 281,
      base: "TRX",
      quote: "STEEM",
      currencyPair: "TRX_STEEM",
    },
    "271": {
      id: 271,
      baseID: 315,
      quoteID: 320,
      base: "TRX",
      quote: "BTT",
      currencyPair: "TRX_BTT",
    },
    "273": {
      id: 273,
      baseID: 315,
      quoteID: 321,
      base: "TRX",
      quote: "WIN",
      currencyPair: "TRX_WIN",
    },
    "276": {
      id: 276,
      baseID: 315,
      quoteID: 327,
      base: "TRX",
      quote: "LINK",
      currencyPair: "TRX_LINK",
    },
    "292": {
      id: 292,
      baseID: 315,
      quoteID: 335,
      base: "TRX",
      quote: "SNX",
      currencyPair: "TRX_SNX",
    },
    "279": {
      id: 279,
      baseID: 315,
      quoteID: 336,
      base: "TRX",
      quote: "XTZ",
      currencyPair: "TRX_XTZ",
    },
    "297": {
      id: 297,
      baseID: 315,
      quoteID: 338,
      base: "TRX",
      quote: "MATIC",
      currencyPair: "TRX_MATIC",
    },
    "339": {
      id: 339,
      baseID: 315,
      quoteID: 343,
      base: "TRX",
      quote: "BNB",
      currencyPair: "TRX_BNB",
    },
    "326": {
      id: 326,
      baseID: 315,
      quoteID: 344,
      base: "TRX",
      quote: "AVA",
      currencyPair: "TRX_AVA",
    },
    "316": {
      id: 316,
      baseID: 315,
      quoteID: 345,
      base: "TRX",
      quote: "JST",
      currencyPair: "TRX_JST",
    },
    "311": {
      id: 311,
      baseID: 315,
      quoteID: 348,
      base: "TRX",
      quote: "NEO",
      currencyPair: "TRX_NEO",
    },
    "314": {
      id: 314,
      baseID: 315,
      quoteID: 349,
      base: "TRX",
      quote: "SWFTC",
      currencyPair: "TRX_SWFTC",
    },
    "371": {
      id: 371,
      baseID: 315,
      quoteID: 350,
      base: "TRX",
      quote: "STPT",
      currencyPair: "TRX_STPT",
    },
    "319": {
      id: 319,
      baseID: 315,
      quoteID: 351,
      base: "TRX",
      quote: "FXC",
      currencyPair: "TRX_FXC",
    },
    "335": {
      id: 335,
      baseID: 315,
      quoteID: 358,
      base: "TRX",
      quote: "CHR",
      currencyPair: "TRX_CHR",
    },
    "344": {
      id: 344,
      baseID: 315,
      quoteID: 359,
      base: "TRX",
      quote: "MDT",
      currencyPair: "TRX_MDT",
    },
    "361": {
      id: 361,
      baseID: 315,
      quoteID: 363,
      base: "TRX",
      quote: "WRX",
      currencyPair: "TRX_WRX",
    },
    "366": {
      id: 366,
      baseID: 315,
      quoteID: 373,
      base: "TRX",
      quote: "SXP",
      currencyPair: "TRX_SXP",
    },
    "410": {
      id: 410,
      baseID: 315,
      quoteID: 404,
      base: "TRX",
      quote: "DMG",
      currencyPair: "TRX_DMG",
    },
    "405": {
      id: 405,
      baseID: 315,
      quoteID: 409,
      base: "TRX",
      quote: "SWINGBY",
      currencyPair: "TRX_SWINGBY",
    },
    "431": {
      id: 431,
      baseID: 315,
      quoteID: 410,
      base: "TRX",
      quote: "FUND",
      currencyPair: "TRX_FUND",
    },
    "420": {
      id: 420,
      baseID: 315,
      quoteID: 418,
      base: "TRX",
      quote: "TAI",
      currencyPair: "TRX_TAI",
    },
    "422": {
      id: 422,
      baseID: 315,
      quoteID: 419,
      base: "TRX",
      quote: "PEARL",
      currencyPair: "TRX_PEARL",
    },
    "341": {
      id: 341,
      baseID: 324,
      quoteID: 28,
      base: "BUSD",
      quote: "BTC",
      currencyPair: "BUSD_BTC",
    },
    "340": {
      id: 340,
      baseID: 324,
      quoteID: 343,
      base: "BUSD",
      quote: "BNB",
      currencyPair: "BUSD_BNB",
    },
    "306": {
      id: 306,
      baseID: 325,
      quoteID: 28,
      base: "DAI",
      quote: "BTC",
      currencyPair: "DAI_BTC",
    },
    "307": {
      id: 307,
      baseID: 325,
      quoteID: 267,
      base: "DAI",
      quote: "ETH",
      currencyPair: "DAI_ETH",
    },
    "284": {
      id: 284,
      baseID: 329,
      quoteID: 28,
      base: "PAX",
      quote: "BTC",
      currencyPair: "PAX_BTC",
    },
    "285": {
      id: 285,
      baseID: 329,
      quoteID: 267,
      base: "PAX",
      quote: "ETH",
      currencyPair: "PAX_ETH",
    },
    "288": {
      id: 288,
      baseID: 337,
      quoteID: 28,
      base: "USDJ",
      quote: "BTC",
      currencyPair: "USDJ_BTC",
    },
    "289": {
      id: 289,
      baseID: 337,
      quoteID: 315,
      base: "USDJ",
      quote: "TRX",
      currencyPair: "USDJ_TRX",
    },
    "323": {
      id: 323,
      baseID: 337,
      quoteID: 320,
      base: "USDJ",
      quote: "BTT",
      currencyPair: "USDJ_BTT",
    },
    "336": {
      id: 336,
      baseID: 343,
      quoteID: 28,
      base: "BNB",
      quote: "BTC",
      currencyPair: "BNB_BTC",
    },
  },
};
let markets_currencies = {
  bySymbol: {
    "1CR": { id: 1, symbol: "1CR", name: "1CRedit", canLend: 0 },
    ABY: { id: 2, symbol: "ABY", name: "ArtByte", canLend: 0 },
    AC: { id: 3, symbol: "AC", name: "AsiaCoin", canLend: 0 },
    ACH: { id: 4, symbol: "ACH", name: "Altcoin Herald", canLend: 0 },
    ADN: { id: 5, symbol: "ADN", name: "Aiden", canLend: 0 },
    AEON: { id: 6, symbol: "AEON", name: "AEON Coin", canLend: 0 },
    AERO: { id: 7, symbol: "AERO", name: "Aerocoin", canLend: 0 },
    AIR: { id: 8, symbol: "AIR", name: "AIRcoin", canLend: 0 },
    APH: { id: 9, symbol: "APH", name: "AphroditeCoin", canLend: 0 },
    AUR: { id: 10, symbol: "AUR", name: "Auroracoin", canLend: 0 },
    AXIS: { id: 11, symbol: "AXIS", name: "Axis", canLend: 0 },
    BALLS: { id: 12, symbol: "BALLS", name: "Snowballs", canLend: 0 },
    BANK: { id: 13, symbol: "BANK", name: "BankCoin", canLend: 0 },
    BBL: { id: 14, symbol: "BBL", name: "BitBlock", canLend: 0 },
    BBR: { id: 15, symbol: "BBR", name: "Boolberry", canLend: 0 },
    BCC: { id: 16, symbol: "BCC", name: "BTCtalkcoin", canLend: 0 },
    BCN: { id: 17, symbol: "BCN", name: "Bytecoin", canLend: 0 },
    BDC: { id: 18, symbol: "BDC", name: "Black Dragon Coin", canLend: 0 },
    BDG: { id: 19, symbol: "BDG", name: "Badgercoin", canLend: 0 },
    BELA: { id: 20, symbol: "BELA", name: "Bela Legacy", canLend: 0 },
    BITS: { id: 21, symbol: "BITS", name: "Bitstar", canLend: 0 },
    BLK: { id: 22, symbol: "BLK", name: "BlackCoin", canLend: 0 },
    BLOCK: { id: 23, symbol: "BLOCK", name: "Blocknet", canLend: 0 },
    BLU: { id: 24, symbol: "BLU", name: "BlueCoin", canLend: 0 },
    BNS: { id: 25, symbol: "BNS", name: "BonusCoin", canLend: 0 },
    BONES: { id: 26, symbol: "BONES", name: "Bones", canLend: 0 },
    BOST: { id: 27, symbol: "BOST", name: "BoostCoin", canLend: 0 },
    BTC: { id: 28, symbol: "BTC", name: "Bitcoin", canLend: 1 },
    BTCD: { id: 29, symbol: "BTCD", name: "BitcoinDark", canLend: 0 },
    BTCS: { id: 30, symbol: "BTCS", name: "Bitcoin-sCrypt", canLend: 0 },
    BTM: { id: 31, symbol: "BTM", name: "Bitmark", canLend: 0 },
    BTS: { id: 32, symbol: "BTS", name: "BitShares", canLend: 0 },
    BURN: { id: 33, symbol: "BURN", name: "BurnerCoin", canLend: 0 },
    BURST: { id: 34, symbol: "BURST", name: "Burst", canLend: 0 },
    C2: { id: 35, symbol: "C2", name: "Coin2.0", canLend: 0 },
    CACH: { id: 36, symbol: "CACH", name: "CACHeCoin", canLend: 0 },
    CAI: { id: 37, symbol: "CAI", name: "CaiShen", canLend: 0 },
    CC: { id: 38, symbol: "CC", name: "Colbert Coin", canLend: 0 },
    CCN: { id: 39, symbol: "CCN", name: "Cannacoin", canLend: 0 },
    CGA: { id: 40, symbol: "CGA", name: "Cryptographic Anomaly", canLend: 0 },
    CHA: { id: 41, symbol: "CHA", name: "Chancecoin", canLend: 0 },
    CINNI: { id: 42, symbol: "CINNI", name: "CinniCoin", canLend: 0 },
    CLAM: { id: 43, symbol: "CLAM", name: "CLAMS", canLend: 0 },
    CNL: { id: 44, symbol: "CNL", name: "ConcealCoin", canLend: 0 },
    CNMT: { id: 45, symbol: "CNMT", name: "Coinomat1", canLend: 0 },
    CNOTE: { id: 46, symbol: "CNOTE", name: "C-Note", canLend: 0 },
    COMM: { id: 47, symbol: "COMM", name: "CommunityCoin", canLend: 0 },
    CON: { id: 48, symbol: "CON", name: "Coino", canLend: 0 },
    CORG: { id: 49, symbol: "CORG", name: "CorgiCoin", canLend: 0 },
    CRYPT: { id: 50, symbol: "CRYPT", name: "CryptCoin", canLend: 0 },
    CURE: { id: 51, symbol: "CURE", name: "Curecoin", canLend: 0 },
    CYC: { id: 52, symbol: "CYC", name: "Conspiracy Coin", canLend: 0 },
    DGB: { id: 53, symbol: "DGB", name: "DigiByte", canLend: 0 },
    DICE: { id: 54, symbol: "DICE", name: "NeoDICE", canLend: 0 },
    DIEM: { id: 55, symbol: "DIEM", name: "Diem", canLend: 0 },
    DIME: { id: 56, symbol: "DIME", name: "Dimecoin", canLend: 0 },
    DIS: { id: 57, symbol: "DIS", name: "DistroCoin", canLend: 0 },
    DNS: { id: 58, symbol: "DNS", name: "BitShares DNS", canLend: 0 },
    DOGE: { id: 59, symbol: "DOGE", name: "Dogecoin", canLend: 1 },
    DASH: { id: 60, symbol: "DASH", name: "Dash", canLend: 1 },
    DRKC: { id: 61, symbol: "DRKC", name: "DarkCash", canLend: 0 },
    DRM: { id: 62, symbol: "DRM", name: "Dreamcoin", canLend: 0 },
    DSH: { id: 63, symbol: "DSH", name: "Dashcoin", canLend: 0 },
    DVK: { id: 64, symbol: "DVK", name: "DvoraKoin", canLend: 0 },
    EAC: { id: 65, symbol: "EAC", name: "EarthCoin", canLend: 0 },
    EBT: { id: 66, symbol: "EBT", name: "EBTcoin", canLend: 0 },
    ECC: { id: 67, symbol: "ECC", name: "ECCoin", canLend: 0 },
    EFL: { id: 68, symbol: "EFL", name: "Electronic Gulden", canLend: 0 },
    EMC2: { id: 69, symbol: "EMC2", name: "Einsteinium", canLend: 0 },
    EMO: { id: 70, symbol: "EMO", name: "EmotiCoin", canLend: 0 },
    ENC: { id: 71, symbol: "ENC", name: "Entropycoin", canLend: 0 },
    eTOK: { id: 72, symbol: "eTOK", name: "eToken", canLend: 0 },
    EXE: { id: 73, symbol: "EXE", name: "8X8 Protocol", canLend: 0 },
    FAC: { id: 74, symbol: "FAC", name: "Faircoin", canLend: 0 },
    FCN: { id: 75, symbol: "FCN", name: "Fantomcoin", canLend: 0 },
    FIBRE: { id: 76, symbol: "FIBRE", name: "Fibrecoin", canLend: 0 },
    FLAP: { id: 77, symbol: "FLAP", name: "FlappyCoin", canLend: 0 },
    FLDC: { id: 78, symbol: "FLDC", name: "FoldingCoin", canLend: 0 },
    FLT: { id: 79, symbol: "FLT", name: "FlutterCoin", canLend: 0 },
    FOX: { id: 80, symbol: "FOX", name: "FoxCoin", canLend: 0 },
    FRAC: { id: 81, symbol: "FRAC", name: "Fractalcoin", canLend: 0 },
    FRK: { id: 82, symbol: "FRK", name: "Franko", canLend: 0 },
    FRQ: { id: 83, symbol: "FRQ", name: "FairQuark", canLend: 0 },
    FVZ: { id: 84, symbol: "FVZ", name: "FVZCoin", canLend: 0 },
    FZ: { id: 85, symbol: "FZ", name: "Frozen", canLend: 0 },
    FZN: { id: 86, symbol: "FZN", name: "Fuzon", canLend: 0 },
    GAP: { id: 87, symbol: "GAP", name: "Gapcoin", canLend: 0 },
    GDN: { id: 88, symbol: "GDN", name: "Global Denomination", canLend: 0 },
    GEMZ: { id: 89, symbol: "GEMZ", name: "GetGems", canLend: 0 },
    GEO: { id: 90, symbol: "GEO", name: "GeoCoin", canLend: 0 },
    GIAR: { id: 91, symbol: "GIAR", name: "Giarcoin", canLend: 0 },
    GLB: { id: 92, symbol: "GLB", name: "Globe", canLend: 0 },
    GAME: { id: 93, symbol: "GAME", name: "GameCredits", canLend: 0 },
    GML: { id: 94, symbol: "GML", name: "GameleagueCoin", canLend: 0 },
    GNS: { id: 95, symbol: "GNS", name: "GenesisCoin", canLend: 0 },
    GOLD: { id: 96, symbol: "GOLD", name: "GoldEagles", canLend: 0 },
    GPC: { id: 97, symbol: "GPC", name: "GROUPCoin", canLend: 0 },
    GPUC: { id: 98, symbol: "GPUC", name: "GPU Coin", canLend: 0 },
    GRCX: { id: 99, symbol: "GRCX", name: "Gridcoin", canLend: 0 },
    GRS: { id: 100, symbol: "GRS", name: "Groestlcoin", canLend: 0 },
    GUE: { id: 101, symbol: "GUE", name: "Guerillacoin", canLend: 0 },
    H2O: { id: 102, symbol: "H2O", name: "H2O Coin", canLend: 0 },
    HIRO: { id: 103, symbol: "HIRO", name: "Hirocoin", canLend: 0 },
    HOT: { id: 104, symbol: "HOT", name: "Hotcoin", canLend: 0 },
    HUC: { id: 105, symbol: "HUC", name: "Huntercoin", canLend: 0 },
    HVC: { id: 106, symbol: "HVC", name: "Heavycoin", canLend: 0 },
    HYP: { id: 107, symbol: "HYP", name: "HyperStake", canLend: 0 },
    HZ: { id: 108, symbol: "HZ", name: "Horizon", canLend: 0 },
    IFC: { id: 109, symbol: "IFC", name: "Infinitecoin", canLend: 0 },
    ITC: { id: 110, symbol: "ITC", name: "Information Coin", canLend: 0 },
    IXC: { id: 111, symbol: "IXC", name: "iXcoin", canLend: 0 },
    JLH: { id: 112, symbol: "JLH", name: "jl777hodl", canLend: 0 },
    JPC: { id: 113, symbol: "JPC", name: "JackpotCoin", canLend: 0 },
    JUG: { id: 114, symbol: "JUG", name: "JuggaloCoin", canLend: 0 },
    KDC: { id: 115, symbol: "KDC", name: "KlondikeCoin", canLend: 0 },
    KEY: { id: 116, symbol: "KEY", name: "KeyCoin", canLend: 0 },
    LC: { id: 117, symbol: "LC", name: "Limecoin", canLend: 0 },
    LCL: { id: 118, symbol: "LCL", name: "Limecoin Lite", canLend: 0 },
    LEAF: { id: 119, symbol: "LEAF", name: "Leafcoin", canLend: 0 },
    LGC: { id: 120, symbol: "LGC", name: "Logicoin", canLend: 0 },
    LOL: { id: 121, symbol: "LOL", name: "LeagueCoin", canLend: 0 },
    LOVE: { id: 122, symbol: "LOVE", name: "LOVEcoin", canLend: 0 },
    LQD: { id: 123, symbol: "LQD", name: "LIQUID", canLend: 0 },
    LTBC: { id: 124, symbol: "LTBC", name: "LTBCoin", canLend: 0 },
    LTC: { id: 125, symbol: "LTC", name: "Litecoin", canLend: 1 },
    LTCX: { id: 126, symbol: "LTCX", name: "LiteCoinX", canLend: 0 },
    MAID: { id: 127, symbol: "MAID", name: "MaidSafeCoin", canLend: 0 },
    MAST: { id: 128, symbol: "MAST", name: "MastiffCoin", canLend: 0 },
    MAX: { id: 129, symbol: "MAX", name: "MaxCoin", canLend: 0 },
    MCN: { id: 130, symbol: "MCN", name: "Moneta Verde", canLend: 0 },
    MEC: { id: 131, symbol: "MEC", name: "Megacoin", canLend: 0 },
    METH: { id: 132, symbol: "METH", name: "CryptoMETH", canLend: 0 },
    MIL: { id: 133, symbol: "MIL", name: "Millennium Coin", canLend: 0 },
    MIN: { id: 134, symbol: "MIN", name: "Minerals", canLend: 0 },
    MINT: { id: 135, symbol: "MINT", name: "Mintcoin", canLend: 0 },
    MMC: { id: 136, symbol: "MMC", name: "MemoryCoin", canLend: 0 },
    MMNXT: { id: 137, symbol: "MMNXT", name: "MMNXT", canLend: 0 },
    MMXIV: { id: 138, symbol: "MMXIV", name: "Maieuticoin", canLend: 0 },
    MNTA: { id: 139, symbol: "MNTA", name: "Moneta", canLend: 0 },
    MON: { id: 140, symbol: "MON", name: "Monocle", canLend: 0 },
    MRC: { id: 141, symbol: "MRC", name: "microCoin", canLend: 0 },
    MRS: { id: 142, symbol: "MRS", name: "Marscoin", canLend: 0 },
    OMNI: { id: 143, symbol: "OMNI", name: "Omni", canLend: 0 },
    MTS: { id: 144, symbol: "MTS", name: "Metiscoin", canLend: 0 },
    MUN: { id: 145, symbol: "MUN", name: "Muniti", canLend: 0 },
    MYR: { id: 146, symbol: "MYR", name: "Myriadcoin", canLend: 0 },
    MZC: { id: 147, symbol: "MZC", name: "MazaCoin", canLend: 0 },
    N5X: { id: 148, symbol: "N5X", name: "N5coin", canLend: 0 },
    NAS: { id: 149, symbol: "NAS", name: "NAS", canLend: 0 },
    NAUT: { id: 150, symbol: "NAUT", name: "Nautiluscoin", canLend: 0 },
    NAV: { id: 151, symbol: "NAV", name: "NAVCoin", canLend: 0 },
    NBT: { id: 152, symbol: "NBT", name: "NuBits", canLend: 0 },
    NEOS: { id: 153, symbol: "NEOS", name: "Neoscoin", canLend: 0 },
    NL: { id: 154, symbol: "NL", name: "Nanolite", canLend: 0 },
    NMC: { id: 155, symbol: "NMC", name: "Namecoin", canLend: 0 },
    NOBL: { id: 156, symbol: "NOBL", name: "NobleCoin", canLend: 0 },
    NOTE: { id: 157, symbol: "NOTE", name: "DNotes", canLend: 0 },
    NOXT: { id: 158, symbol: "NOXT", name: "NobleNXT", canLend: 0 },
    NRS: { id: 159, symbol: "NRS", name: "NoirShares", canLend: 0 },
    NSR: { id: 160, symbol: "NSR", name: "NuShares", canLend: 0 },
    NTX: { id: 161, symbol: "NTX", name: "NTX", canLend: 0 },
    NXT: { id: 162, symbol: "NXT", name: "NXT", canLend: 0 },
    NXTI: { id: 163, symbol: "NXTI", name: "NXTInspect", canLend: 0 },
    OPAL: { id: 164, symbol: "OPAL", name: "Opal", canLend: 0 },
    PAND: { id: 165, symbol: "PAND", name: "PandaCoin", canLend: 0 },
    PAWN: { id: 166, symbol: "PAWN", name: "Pawncoin", canLend: 0 },
    PIGGY: { id: 167, symbol: "PIGGY", name: "New Piggycoin", canLend: 0 },
    PINK: { id: 168, symbol: "PINK", name: "Pinkcoin", canLend: 0 },
    PLX: { id: 169, symbol: "PLX", name: "ParallaxCoin", canLend: 0 },
    PMC: { id: 170, symbol: "PMC", name: "Premine", canLend: 0 },
    POT: { id: 171, symbol: "POT", name: "PotCoin", canLend: 0 },
    PPC: { id: 172, symbol: "PPC", name: "Peercoin", canLend: 0 },
    PRC: { id: 173, symbol: "PRC", name: "ProsperCoin", canLend: 0 },
    PRT: { id: 174, symbol: "PRT", name: "Particle", canLend: 0 },
    PTS: { id: 175, symbol: "PTS", name: "BitShares PTS", canLend: 0 },
    Q2C: { id: 176, symbol: "Q2C", name: "QubitCoin", canLend: 0 },
    QBK: { id: 177, symbol: "QBK", name: "Qibuck", canLend: 0 },
    QCN: { id: 178, symbol: "QCN", name: "QuazarCoin", canLend: 0 },
    QORA: { id: 179, symbol: "QORA", name: "Qora", canLend: 0 },
    QTL: { id: 180, symbol: "QTL", name: "Quatloo", canLend: 0 },
    RBY: { id: 181, symbol: "RBY", name: "Rubycoin", canLend: 0 },
    RDD: { id: 182, symbol: "RDD", name: "Reddcoin", canLend: 0 },
    RIC: { id: 183, symbol: "RIC", name: "Riecoin", canLend: 0 },
    RZR: { id: 184, symbol: "RZR", name: "Razor", canLend: 0 },
    SDC: { id: 185, symbol: "SDC", name: "Shadow", canLend: 0 },
    SHIBE: { id: 186, symbol: "SHIBE", name: "ShibeCoin", canLend: 0 },
    SHOPX: { id: 187, symbol: "SHOPX", name: "ShopX", canLend: 0 },
    SILK: { id: 188, symbol: "SILK", name: "Silkcoin", canLend: 0 },
    SJCX: { id: 189, symbol: "SJCX", name: "Storjcoin X", canLend: 0 },
    SLR: { id: 190, symbol: "SLR", name: "SolarCoin", canLend: 0 },
    SMC: { id: 191, symbol: "SMC", name: "SmartCoin", canLend: 0 },
    SOC: { id: 192, symbol: "SOC", name: "SocialCoin", canLend: 0 },
    SPA: { id: 193, symbol: "SPA", name: "Spaincoin", canLend: 0 },
    SQL: { id: 194, symbol: "SQL", name: "Squallcoin", canLend: 0 },
    SRCC: { id: 195, symbol: "SRCC", name: "SourceCoin", canLend: 0 },
    SRG: { id: 196, symbol: "SRG", name: "Surge", canLend: 0 },
    SSD: { id: 197, symbol: "SSD", name: "Sonic", canLend: 0 },
    STR: { id: 198, symbol: "STR", name: "Stellar", canLend: 1 },
    SUM: { id: 199, symbol: "SUM", name: "SummerCoin", canLend: 0 },
    SUN: { id: 200, symbol: "SUN", name: "Sun", canLend: 0 },
    SWARM: { id: 201, symbol: "SWARM", name: "SWARM", canLend: 0 },
    SXC: { id: 202, symbol: "SXC", name: "Sexcoin", canLend: 0 },
    SYNC: { id: 203, symbol: "SYNC", name: "Sync", canLend: 0 },
    SYS: { id: 204, symbol: "SYS", name: "Syscoin", canLend: 0 },
    TAC: { id: 205, symbol: "TAC", name: "Talkcoin", canLend: 0 },
    TOR: { id: 206, symbol: "TOR", name: "TorCoin", canLend: 0 },
    TRUST: { id: 207, symbol: "TRUST", name: "TrustPlus", canLend: 0 },
    TWE: { id: 208, symbol: "TWE", name: "Twecoin", canLend: 0 },
    UIS: { id: 209, symbol: "UIS", name: "Unitus", canLend: 0 },
    ULTC: { id: 210, symbol: "ULTC", name: "Umbrella-LTC", canLend: 0 },
    UNITY: { id: 211, symbol: "UNITY", name: "SuperNET", canLend: 0 },
    URO: { id: 212, symbol: "URO", name: "Uro", canLend: 0 },
    USDE: { id: 213, symbol: "USDE", name: "USDE", canLend: 0 },
    USDT: { id: 214, symbol: "USDT", name: "Tether USD", canLend: 1 },
    UTC: { id: 215, symbol: "UTC", name: "UltraCoin", canLend: 0 },
    UTIL: { id: 216, symbol: "UTIL", name: "UtilityCoin", canLend: 0 },
    UVC: { id: 217, symbol: "UVC", name: "UniversityCoin", canLend: 0 },
    VIA: { id: 218, symbol: "VIA", name: "Viacoin", canLend: 0 },
    VOOT: { id: 219, symbol: "VOOT", name: "VootCoin", canLend: 0 },
    VRC: { id: 220, symbol: "VRC", name: "VeriCoin", canLend: 0 },
    VTC: { id: 221, symbol: "VTC", name: "Vertcoin", canLend: 0 },
    WC: { id: 222, symbol: "WC", name: "WhiteCoin", canLend: 0 },
    WDC: { id: 223, symbol: "WDC", name: "Worldcoin", canLend: 0 },
    WIKI: { id: 224, symbol: "WIKI", name: "Wikicoin", canLend: 0 },
    WOLF: { id: 225, symbol: "WOLF", name: "InsanityCoin", canLend: 0 },
    X13: { id: 226, symbol: "X13", name: "X13Coin", canLend: 0 },
    XAI: { id: 227, symbol: "XAI", name: "Sapience AIFX", canLend: 0 },
    XAP: { id: 228, symbol: "XAP", name: "API Coin", canLend: 0 },
    XBC: { id: 229, symbol: "XBC", name: "BitcoinPlus", canLend: 0 },
    XC: { id: 230, symbol: "XC", name: "XCurrency", canLend: 0 },
    XCH: { id: 231, symbol: "XCH", name: "ClearingHouse", canLend: 0 },
    XCN: { id: 232, symbol: "XCN", name: "Cryptonite", canLend: 0 },
    XCP: { id: 233, symbol: "XCP", name: "Counterparty", canLend: 0 },
    XCR: { id: 234, symbol: "XCR", name: "Crypti", canLend: 0 },
    XDN: { id: 235, symbol: "XDN", name: "DigitalNote", canLend: 0 },
    XDP: { id: 236, symbol: "XDP", name: "Dogeparty", canLend: 0 },
    XHC: { id: 237, symbol: "XHC", name: "Honorcoin", canLend: 0 },
    XLB: { id: 238, symbol: "XLB", name: "Libertycoin", canLend: 0 },
    XMG: { id: 239, symbol: "XMG", name: "Magi", canLend: 0 },
    XMR: { id: 240, symbol: "XMR", name: "Monero", canLend: 1 },
    XPB: { id: 241, symbol: "XPB", name: "Pebblecoin", canLend: 0 },
    XPM: { id: 242, symbol: "XPM", name: "Primecoin", canLend: 0 },
    XRP: { id: 243, symbol: "XRP", name: "Ripple", canLend: 1 },
    XSI: { id: 244, symbol: "XSI", name: "Stability Shares", canLend: 0 },
    XST: { id: 245, symbol: "XST", name: "StealthCoin", canLend: 0 },
    XSV: { id: 246, symbol: "XSV", name: "Silicon Valley Coin", canLend: 0 },
    XUSD: { id: 247, symbol: "XUSD", name: "CoinoUSD", canLend: 0 },
    XXC: { id: 248, symbol: "XXC", name: "CREDS", canLend: 0 },
    YACC: { id: 249, symbol: "YACC", name: "YACCoin", canLend: 0 },
    YANG: { id: 250, symbol: "YANG", name: "Yangcoin", canLend: 0 },
    YC: { id: 251, symbol: "YC", name: "YellowCoin", canLend: 0 },
    YIN: { id: 252, symbol: "YIN", name: "Yincoin", canLend: 0 },
    XVC: { id: 253, symbol: "XVC", name: "Vcash", canLend: 0 },
    FLO: { id: 254, symbol: "FLO", name: "Florincoin", canLend: 0 },
    XEM: { id: 256, symbol: "XEM", name: "NEM", canLend: 0 },
    ARCH: { id: 258, symbol: "ARCH", name: "ARCHcoin", canLend: 0 },
    HUGE: { id: 260, symbol: "HUGE", name: "BIGcoin", canLend: 0 },
    GRC: { id: 261, symbol: "GRC", name: "Gridcoin Research", canLend: 0 },
    IOC: { id: 263, symbol: "IOC", name: "IO Digital Currency", canLend: 0 },
    INDEX: { id: 265, symbol: "INDEX", name: "CoinoIndex", canLend: 0 },
    ETH: { id: 267, symbol: "ETH", name: "Ethereum", canLend: 1 },
    SC: { id: 268, symbol: "SC", name: "Siacoin", canLend: 0 },
    BCY: { id: 269, symbol: "BCY", name: "BitCrystals", canLend: 0 },
    EXP: { id: 270, symbol: "EXP", name: "Expanse", canLend: 0 },
    FCT: { id: 271, symbol: "FCT", name: "Factom", canLend: 0 },
    BITUSD: { id: 272, symbol: "BITUSD", name: "BitUSD", canLend: 0 },
    BITCNY: { id: 273, symbol: "BITCNY", name: "BitCNY", canLend: 0 },
    RADS: { id: 274, symbol: "RADS", name: "Radium", canLend: 0 },
    AMP: { id: 275, symbol: "AMP", name: "Synereo AMP", canLend: 0 },
    VOX: { id: 276, symbol: "VOX", name: "Voxels", canLend: 0 },
    DCR: { id: 277, symbol: "DCR", name: "Decred", canLend: 0 },
    LSK: { id: 278, symbol: "LSK", name: "Lisk", canLend: 0 },
    DAO: { id: 279, symbol: "DAO", name: "The DAO", canLend: 0 },
    LBC: { id: 280, symbol: "LBC", name: "LBRY Credits", canLend: 0 },
    STEEM: { id: 281, symbol: "STEEM", name: "STEEM", canLend: 0 },
    SBD: { id: 282, symbol: "SBD", name: "Steem Dollars", canLend: 0 },
    ETC: { id: 283, symbol: "ETC", name: "Ethereum Classic", canLend: 1 },
    REP: { id: 284, symbol: "REP", name: "Augur", canLend: 0 },
    ARDR: { id: 285, symbol: "ARDR", name: "Ardor", canLend: 0 },
    ZEC: { id: 286, symbol: "ZEC", name: "Zcash", canLend: 0 },
    STRAT: { id: 287, symbol: "STRAT", name: "Stratis", canLend: 0 },
    NXC: { id: 288, symbol: "NXC", name: "Nexium", canLend: 0 },
    PASC: { id: 289, symbol: "PASC", name: "PascalCoin", canLend: 0 },
    GNT: { id: 290, symbol: "GNT", name: "Golem", canLend: 0 },
    GNO: { id: 291, symbol: "GNO", name: "Gnosis", canLend: 0 },
    BCH: { id: 292, symbol: "BCH", name: "Bitcoin Cash (FROZEN)", canLend: 0 },
    ZRX: { id: 293, symbol: "ZRX", name: "0x", canLend: 0 },
    CVC: { id: 294, symbol: "CVC", name: "Civic", canLend: 0 },
    OMG: { id: 295, symbol: "OMG", name: "OmiseGO", canLend: 0 },
    GAS: { id: 296, symbol: "GAS", name: "Gas", canLend: 0 },
    STORJ: { id: 297, symbol: "STORJ", name: "Storj", canLend: 0 },
    EOS: { id: 298, symbol: "EOS", name: "EOS", canLend: 1 },
    USDC: { id: 299, symbol: "USDC", name: "USD Coin", canLend: 1 },
    SNT: { id: 300, symbol: "SNT", name: "Status", canLend: 0 },
    KNC: { id: 301, symbol: "KNC", name: "Kyber", canLend: 0 },
    BAT: { id: 302, symbol: "BAT", name: "Basic Attention Token", canLend: 0 },
    LOOM: { id: 303, symbol: "LOOM", name: "LOOM Network", canLend: 0 },
    QTUM: { id: 304, symbol: "QTUM", name: "Qtum", canLend: 0 },
    BNT: { id: 305, symbol: "BNT", name: "Bancor", canLend: 0 },
    MANA: { id: 306, symbol: "MANA", name: "Decentraland", canLend: 0 },
    FOAM: { id: 307, symbol: "FOAM", name: "Foam", canLend: 0 },
    BCHABC: { id: 308, symbol: "BCHABC", name: "Bitcoin Cash", canLend: 1 },
    BCHSV: { id: 309, symbol: "BCHSV", name: "Bitcoin SV", canLend: 1 },
    NMR: { id: 310, symbol: "NMR", name: "Numeraire", canLend: 0 },
    POLY: { id: 311, symbol: "POLY", name: "Polymath", canLend: 0 },
    LPT: { id: 312, symbol: "LPT", name: "Livepeer", canLend: 0 },
    ATOM: { id: 313, symbol: "ATOM", name: "Cosmos", canLend: 1 },
    GRIN: { id: 314, symbol: "GRIN", name: "Grin", canLend: 0 },
    TRX: { id: 315, symbol: "TRX", name: "Tron", canLend: 1 },
    ETHBNT: {
      id: 319,
      symbol: "ETHBNT",
      name: "Bancor ETH Smart Token Relay",
      canLend: 0,
    },
    BTT: { id: 320, symbol: "BTT", name: "BitTorrent", canLend: 0 },
    WIN: { id: 321, symbol: "WIN", name: "WINK", canLend: 0 },
    BEAR: {
      id: 322,
      symbol: "BEAR",
      name: "3X Short Bitcoin Token",
      canLend: 0,
    },
    BULL: {
      id: 323,
      symbol: "BULL",
      name: "3X Long Bitcoin Token",
      canLend: 0,
    },
    BUSD: { id: 324, symbol: "BUSD", name: "Binance USD", canLend: 0 },
    DAI: { id: 325, symbol: "DAI", name: "Dai Stablecoin", canLend: 0 },
    LINK: { id: 327, symbol: "LINK", name: "Chainlink", canLend: 0 },
    MKR: { id: 328, symbol: "MKR", name: "Maker", canLend: 0 },
    PAX: { id: 329, symbol: "PAX", name: "Paxos Standard", canLend: 0 },
    TRXBEAR: {
      id: 330,
      symbol: "TRXBEAR",
      name: "3X Short TRX Token",
      canLend: 0,
    },
    TRXBULL: {
      id: 331,
      symbol: "TRXBULL",
      name: "3X Long TRX Token",
      canLend: 0,
    },
    ETHBEAR: {
      id: 333,
      symbol: "ETHBEAR",
      name: "3X Short Ethereum Token",
      canLend: 0,
    },
    ETHBULL: {
      id: 334,
      symbol: "ETHBULL",
      name: "3X Long Ethereum Token",
      canLend: 0,
    },
    SNX: {
      id: 335,
      symbol: "SNX",
      name: "Synthetix Network Token",
      canLend: 0,
    },
    XTZ: { id: 336, symbol: "XTZ", name: "Tezos", canLend: 0 },
    USDJ: { id: 337, symbol: "USDJ", name: "USDJ", canLend: 0 },
    MATIC: { id: 338, symbol: "MATIC", name: "Matic Network", canLend: 0 },
    BCHBEAR: {
      id: 339,
      symbol: "BCHBEAR",
      name: "3X Short Bitcoin Cash Token",
      canLend: 0,
    },
    BCHBULL: {
      id: 340,
      symbol: "BCHBULL",
      name: "3X Long Bitcoin Cash Token",
      canLend: 0,
    },
    BSVBEAR: {
      id: 341,
      symbol: "BSVBEAR",
      name: "3X Short Bitcoin SV Token",
      canLend: 0,
    },
    BSVBULL: {
      id: 342,
      symbol: "BSVBULL",
      name: "3X Long Bitcoin SV Token",
      canLend: 0,
    },
    BNB: { id: 343, symbol: "BNB", name: "Binance Coin", canLend: 0 },
    AVA: { id: 344, symbol: "AVA", name: "Travala.com Token", canLend: 0 },
    JST: { id: 345, symbol: "JST", name: "Just", canLend: 0 },
    BVOL: {
      id: 346,
      symbol: "BVOL",
      name: "Bitcoin Volatility Token",
      canLend: 0,
    },
    IBVOL: {
      id: 347,
      symbol: "IBVOL",
      name: "Inverse Bitcoin Volatility Token",
      canLend: 0,
    },
    NEO: { id: 348, symbol: "NEO", name: "Neo", canLend: 0 },
    SWFTC: { id: 349, symbol: "SWFTC", name: "SwftCoin", canLend: 0 },
    STPT: {
      id: 350,
      symbol: "STPT",
      name: "Standard Tokenization Protocol",
      canLend: 0,
    },
    FXC: { id: 351, symbol: "FXC", name: "Flexacoin", canLend: 0 },
    XRPBULL: {
      id: 352,
      symbol: "XRPBULL",
      name: "3X Long XRP Token",
      canLend: 0,
    },
    XRPBEAR: {
      id: 353,
      symbol: "XRPBEAR",
      name: "3X Short XRP Token",
      canLend: 0,
    },
    EOSBULL: {
      id: 354,
      symbol: "EOSBULL",
      name: "3X Long EOS Token",
      canLend: 0,
    },
    EOSBEAR: {
      id: 355,
      symbol: "EOSBEAR",
      name: "3X Short EOS Token",
      canLend: 0,
    },
    LINKBULL: {
      id: 356,
      symbol: "LINKBULL",
      name: "3X Long Chainlink Token",
      canLend: 0,
    },
    LINKBEAR: {
      id: 357,
      symbol: "LINKBEAR",
      name: "3X Short Chainlink Token",
      canLend: 0,
    },
    CHR: { id: 358, symbol: "CHR", name: "Chromia", canLend: 0 },
    MDT: { id: 359, symbol: "MDT", name: "Measurable Data Token", canLend: 0 },
    BCHC: { id: 360, symbol: "BCHC", name: "BitCherry", canLend: 0 },
    COMP: {
      id: 361,
      symbol: "COMP",
      name: "Compound Governance Token",
      canLend: 0,
    },
    WRX: { id: 363, symbol: "WRX", name: "WazirX", canLend: 0 },
    CUSDT: { id: 364, symbol: "CUSDT", name: "Compound USDT", canLend: 0 },
    XFIL: { id: 365, symbol: "XFIL", name: "Filecoin [IOU]", canLend: 0 },
    LEND: { id: 366, symbol: "LEND", name: "Aave", canLend: 0 },
    REN: { id: 367, symbol: "REN", name: "Ren", canLend: 0 },
    LRC: { id: 368, symbol: "LRC", name: "Loopring", canLend: 0 },
    BAL: { id: 369, symbol: "BAL", name: "Balancer", canLend: 0 },
    STAKE: { id: 371, symbol: "STAKE", name: "xDAI Stake", canLend: 0 },
    BZRX: { id: 372, symbol: "BZRX", name: "bZx Protocol Token", canLend: 0 },
    SXP: { id: 373, symbol: "SXP", name: "Swipe", canLend: 0 },
    MTA: { id: 374, symbol: "MTA", name: "Meta", canLend: 0 },
    YFI: { id: 375, symbol: "YFI", name: "yearn.finance", canLend: 0 },
    TRUMPWIN: {
      id: 377,
      symbol: "TRUMPWIN",
      name: "Trump Wins Token",
      canLend: 0,
    },
    TRUMPLOSE: {
      id: 378,
      symbol: "TRUMPLOSE",
      name: "Trump Loses Token",
      canLend: 0,
    },
    DEC: { id: 379, symbol: "DEC", name: "Decentr", canLend: 0 },
    PLT: { id: 380, symbol: "PLT", name: "PlutusDeFi", canLend: 0 },
    UMA: { id: 381, symbol: "UMA", name: "UMA", canLend: 0 },
    KTON: {
      id: 382,
      symbol: "KTON",
      name: "Darwinia Commitment Token",
      canLend: 0,
    },
    RING: {
      id: 383,
      symbol: "RING",
      name: "Darwinia Network Native Token",
      canLend: 0,
    },
    SWAP: { id: 384, symbol: "SWAP", name: "Trustswap", canLend: 0 },
    TEND: { id: 385, symbol: "TEND", name: "Tendies", canLend: 0 },
    TRADE: { id: 386, symbol: "TRADE", name: "UniTrade", canLend: 0 },
    GEEQ: { id: 388, symbol: "GEEQ", name: "GEEQ", canLend: 0 },
    BAND: { id: 390, symbol: "BAND", name: "Band Protocol Token", canLend: 0 },
    DIA: { id: 391, symbol: "DIA", name: "DIA", canLend: 0 },
    DOS: { id: 392, symbol: "DOS", name: "DOS Network", canLend: 0 },
    ZAP: { id: 393, symbol: "ZAP", name: "Zap", canLend: 0 },
    TRB: { id: 394, symbol: "TRB", name: "Tellor", canLend: 0 },
    SBREE: { id: 396, symbol: "SBREE", name: "Coinbreeder DAO", canLend: 0 },
    DEXT: { id: 397, symbol: "DEXT", name: "DexTools", canLend: 0 },
    MCB: { id: 398, symbol: "MCB", name: "MCDex", canLend: 0 },
    PERX: { id: 399, symbol: "PERX", name: "PeerEx Network", canLend: 0 },
    DOT: { id: 400, symbol: "DOT", name: "Polkadot [IOU]", canLend: 0 },
    CRV: { id: 401, symbol: "CRV", name: "Curve Finance", canLend: 0 },
    XDOT: { id: 402, symbol: "XDOT", name: "Polkadot OLD [IOU]", canLend: 0 },
    OCEAN: { id: 403, symbol: "OCEAN", name: "Ocean Protocol", canLend: 0 },
    DMG: { id: 404, symbol: "DMG", name: "DMM: Governance", canLend: 0 },
    OM: { id: 405, symbol: "OM", name: "Mantra DAO", canLend: 0 },
    BLY: { id: 406, symbol: "BLY", name: "Blocery", canLend: 0 },
    OPT: { id: 407, symbol: "OPT", name: "OpenPredict", canLend: 0 },
    PRQ: { id: 408, symbol: "PRQ", name: "PARSIQ", canLend: 0 },
    SWINGBY: { id: 409, symbol: "SWINGBY", name: "Swingby", canLend: 0 },
    FUND: { id: 410, symbol: "FUND", name: "Unification", canLend: 0 },
    RSR: { id: 411, symbol: "RSR", name: "Reserve Rights Token", canLend: 0 },
    WNXM: { id: 412, symbol: "WNXM", name: "Wrapped NXM", canLend: 0 },
    FCT2: { id: 413, symbol: "FCT2", name: "Firmachain", canLend: 0 },
    SUSHI: { id: 414, symbol: "SUSHI", name: "SushiSwap", canLend: 0 },
    YFII: { id: 415, symbol: "YFII", name: "DFI.money", canLend: 0 },
    YFV: { id: 416, symbol: "YFV", name: "YFValue", canLend: 0 },
    YFL: { id: 417, symbol: "YFL", name: "YFLink", canLend: 0 },
    TAI: { id: 418, symbol: "TAI", name: "tBridge Token", canLend: 0 },
    PEARL: { id: 419, symbol: "PEARL", name: "Pearl Finance", canLend: 0 },
    ANK: { id: 420, symbol: "ANK", name: "AlphaLink", canLend: 0 },
    JFI: { id: 421, symbol: "JFI", name: "JackPool.finance", canLend: 0 },
    CRT: { id: 422, symbol: "CRT", name: "Carrot Finance", canLend: 0 },
    SAL: { id: 423, symbol: "SAL", name: "Salmon", canLend: 0 },
    CORN: { id: 424, symbol: "CORN", name: "Corn", canLend: 0 },
    SWRV: { id: 425, symbol: "SWRV", name: "Swerve", canLend: 0 },
    FSW: { id: 426, symbol: "FSW", name: "FalconSwap", canLend: 0 },
    CREAM: { id: 427, symbol: "CREAM", name: "Cream", canLend: 0 },
  },
  byID: {
    "1": { id: 1, symbol: "1CR", name: "1CRedit", canLend: 0 },
    "2": { id: 2, symbol: "ABY", name: "ArtByte", canLend: 0 },
    "3": { id: 3, symbol: "AC", name: "AsiaCoin", canLend: 0 },
    "4": { id: 4, symbol: "ACH", name: "Altcoin Herald", canLend: 0 },
    "5": { id: 5, symbol: "ADN", name: "Aiden", canLend: 0 },
    "6": { id: 6, symbol: "AEON", name: "AEON Coin", canLend: 0 },
    "7": { id: 7, symbol: "AERO", name: "Aerocoin", canLend: 0 },
    "8": { id: 8, symbol: "AIR", name: "AIRcoin", canLend: 0 },
    "9": { id: 9, symbol: "APH", name: "AphroditeCoin", canLend: 0 },
    "10": { id: 10, symbol: "AUR", name: "Auroracoin", canLend: 0 },
    "11": { id: 11, symbol: "AXIS", name: "Axis", canLend: 0 },
    "12": { id: 12, symbol: "BALLS", name: "Snowballs", canLend: 0 },
    "13": { id: 13, symbol: "BANK", name: "BankCoin", canLend: 0 },
    "14": { id: 14, symbol: "BBL", name: "BitBlock", canLend: 0 },
    "15": { id: 15, symbol: "BBR", name: "Boolberry", canLend: 0 },
    "16": { id: 16, symbol: "BCC", name: "BTCtalkcoin", canLend: 0 },
    "17": { id: 17, symbol: "BCN", name: "Bytecoin", canLend: 0 },
    "18": { id: 18, symbol: "BDC", name: "Black Dragon Coin", canLend: 0 },
    "19": { id: 19, symbol: "BDG", name: "Badgercoin", canLend: 0 },
    "20": { id: 20, symbol: "BELA", name: "Bela Legacy", canLend: 0 },
    "21": { id: 21, symbol: "BITS", name: "Bitstar", canLend: 0 },
    "22": { id: 22, symbol: "BLK", name: "BlackCoin", canLend: 0 },
    "23": { id: 23, symbol: "BLOCK", name: "Blocknet", canLend: 0 },
    "24": { id: 24, symbol: "BLU", name: "BlueCoin", canLend: 0 },
    "25": { id: 25, symbol: "BNS", name: "BonusCoin", canLend: 0 },
    "26": { id: 26, symbol: "BONES", name: "Bones", canLend: 0 },
    "27": { id: 27, symbol: "BOST", name: "BoostCoin", canLend: 0 },
    "28": { id: 28, symbol: "BTC", name: "Bitcoin", canLend: 1 },
    "29": { id: 29, symbol: "BTCD", name: "BitcoinDark", canLend: 0 },
    "30": { id: 30, symbol: "BTCS", name: "Bitcoin-sCrypt", canLend: 0 },
    "31": { id: 31, symbol: "BTM", name: "Bitmark", canLend: 0 },
    "32": { id: 32, symbol: "BTS", name: "BitShares", canLend: 0 },
    "33": { id: 33, symbol: "BURN", name: "BurnerCoin", canLend: 0 },
    "34": { id: 34, symbol: "BURST", name: "Burst", canLend: 0 },
    "35": { id: 35, symbol: "C2", name: "Coin2.0", canLend: 0 },
    "36": { id: 36, symbol: "CACH", name: "CACHeCoin", canLend: 0 },
    "37": { id: 37, symbol: "CAI", name: "CaiShen", canLend: 0 },
    "38": { id: 38, symbol: "CC", name: "Colbert Coin", canLend: 0 },
    "39": { id: 39, symbol: "CCN", name: "Cannacoin", canLend: 0 },
    "40": { id: 40, symbol: "CGA", name: "Cryptographic Anomaly", canLend: 0 },
    "41": { id: 41, symbol: "CHA", name: "Chancecoin", canLend: 0 },
    "42": { id: 42, symbol: "CINNI", name: "CinniCoin", canLend: 0 },
    "43": { id: 43, symbol: "CLAM", name: "CLAMS", canLend: 0 },
    "44": { id: 44, symbol: "CNL", name: "ConcealCoin", canLend: 0 },
    "45": { id: 45, symbol: "CNMT", name: "Coinomat1", canLend: 0 },
    "46": { id: 46, symbol: "CNOTE", name: "C-Note", canLend: 0 },
    "47": { id: 47, symbol: "COMM", name: "CommunityCoin", canLend: 0 },
    "48": { id: 48, symbol: "CON", name: "Coino", canLend: 0 },
    "49": { id: 49, symbol: "CORG", name: "CorgiCoin", canLend: 0 },
    "50": { id: 50, symbol: "CRYPT", name: "CryptCoin", canLend: 0 },
    "51": { id: 51, symbol: "CURE", name: "Curecoin", canLend: 0 },
    "52": { id: 52, symbol: "CYC", name: "Conspiracy Coin", canLend: 0 },
    "53": { id: 53, symbol: "DGB", name: "DigiByte", canLend: 0 },
    "54": { id: 54, symbol: "DICE", name: "NeoDICE", canLend: 0 },
    "55": { id: 55, symbol: "DIEM", name: "Diem", canLend: 0 },
    "56": { id: 56, symbol: "DIME", name: "Dimecoin", canLend: 0 },
    "57": { id: 57, symbol: "DIS", name: "DistroCoin", canLend: 0 },
    "58": { id: 58, symbol: "DNS", name: "BitShares DNS", canLend: 0 },
    "59": { id: 59, symbol: "DOGE", name: "Dogecoin", canLend: 1 },
    "60": { id: 60, symbol: "DASH", name: "Dash", canLend: 1 },
    "61": { id: 61, symbol: "DRKC", name: "DarkCash", canLend: 0 },
    "62": { id: 62, symbol: "DRM", name: "Dreamcoin", canLend: 0 },
    "63": { id: 63, symbol: "DSH", name: "Dashcoin", canLend: 0 },
    "64": { id: 64, symbol: "DVK", name: "DvoraKoin", canLend: 0 },
    "65": { id: 65, symbol: "EAC", name: "EarthCoin", canLend: 0 },
    "66": { id: 66, symbol: "EBT", name: "EBTcoin", canLend: 0 },
    "67": { id: 67, symbol: "ECC", name: "ECCoin", canLend: 0 },
    "68": { id: 68, symbol: "EFL", name: "Electronic Gulden", canLend: 0 },
    "69": { id: 69, symbol: "EMC2", name: "Einsteinium", canLend: 0 },
    "70": { id: 70, symbol: "EMO", name: "EmotiCoin", canLend: 0 },
    "71": { id: 71, symbol: "ENC", name: "Entropycoin", canLend: 0 },
    "72": { id: 72, symbol: "eTOK", name: "eToken", canLend: 0 },
    "73": { id: 73, symbol: "EXE", name: "8X8 Protocol", canLend: 0 },
    "74": { id: 74, symbol: "FAC", name: "Faircoin", canLend: 0 },
    "75": { id: 75, symbol: "FCN", name: "Fantomcoin", canLend: 0 },
    "76": { id: 76, symbol: "FIBRE", name: "Fibrecoin", canLend: 0 },
    "77": { id: 77, symbol: "FLAP", name: "FlappyCoin", canLend: 0 },
    "78": { id: 78, symbol: "FLDC", name: "FoldingCoin", canLend: 0 },
    "79": { id: 79, symbol: "FLT", name: "FlutterCoin", canLend: 0 },
    "80": { id: 80, symbol: "FOX", name: "FoxCoin", canLend: 0 },
    "81": { id: 81, symbol: "FRAC", name: "Fractalcoin", canLend: 0 },
    "82": { id: 82, symbol: "FRK", name: "Franko", canLend: 0 },
    "83": { id: 83, symbol: "FRQ", name: "FairQuark", canLend: 0 },
    "84": { id: 84, symbol: "FVZ", name: "FVZCoin", canLend: 0 },
    "85": { id: 85, symbol: "FZ", name: "Frozen", canLend: 0 },
    "86": { id: 86, symbol: "FZN", name: "Fuzon", canLend: 0 },
    "87": { id: 87, symbol: "GAP", name: "Gapcoin", canLend: 0 },
    "88": { id: 88, symbol: "GDN", name: "Global Denomination", canLend: 0 },
    "89": { id: 89, symbol: "GEMZ", name: "GetGems", canLend: 0 },
    "90": { id: 90, symbol: "GEO", name: "GeoCoin", canLend: 0 },
    "91": { id: 91, symbol: "GIAR", name: "Giarcoin", canLend: 0 },
    "92": { id: 92, symbol: "GLB", name: "Globe", canLend: 0 },
    "93": { id: 93, symbol: "GAME", name: "GameCredits", canLend: 0 },
    "94": { id: 94, symbol: "GML", name: "GameleagueCoin", canLend: 0 },
    "95": { id: 95, symbol: "GNS", name: "GenesisCoin", canLend: 0 },
    "96": { id: 96, symbol: "GOLD", name: "GoldEagles", canLend: 0 },
    "97": { id: 97, symbol: "GPC", name: "GROUPCoin", canLend: 0 },
    "98": { id: 98, symbol: "GPUC", name: "GPU Coin", canLend: 0 },
    "99": { id: 99, symbol: "GRCX", name: "Gridcoin", canLend: 0 },
    "100": { id: 100, symbol: "GRS", name: "Groestlcoin", canLend: 0 },
    "101": { id: 101, symbol: "GUE", name: "Guerillacoin", canLend: 0 },
    "102": { id: 102, symbol: "H2O", name: "H2O Coin", canLend: 0 },
    "103": { id: 103, symbol: "HIRO", name: "Hirocoin", canLend: 0 },
    "104": { id: 104, symbol: "HOT", name: "Hotcoin", canLend: 0 },
    "105": { id: 105, symbol: "HUC", name: "Huntercoin", canLend: 0 },
    "106": { id: 106, symbol: "HVC", name: "Heavycoin", canLend: 0 },
    "107": { id: 107, symbol: "HYP", name: "HyperStake", canLend: 0 },
    "108": { id: 108, symbol: "HZ", name: "Horizon", canLend: 0 },
    "109": { id: 109, symbol: "IFC", name: "Infinitecoin", canLend: 0 },
    "110": { id: 110, symbol: "ITC", name: "Information Coin", canLend: 0 },
    "111": { id: 111, symbol: "IXC", name: "iXcoin", canLend: 0 },
    "112": { id: 112, symbol: "JLH", name: "jl777hodl", canLend: 0 },
    "113": { id: 113, symbol: "JPC", name: "JackpotCoin", canLend: 0 },
    "114": { id: 114, symbol: "JUG", name: "JuggaloCoin", canLend: 0 },
    "115": { id: 115, symbol: "KDC", name: "KlondikeCoin", canLend: 0 },
    "116": { id: 116, symbol: "KEY", name: "KeyCoin", canLend: 0 },
    "117": { id: 117, symbol: "LC", name: "Limecoin", canLend: 0 },
    "118": { id: 118, symbol: "LCL", name: "Limecoin Lite", canLend: 0 },
    "119": { id: 119, symbol: "LEAF", name: "Leafcoin", canLend: 0 },
    "120": { id: 120, symbol: "LGC", name: "Logicoin", canLend: 0 },
    "121": { id: 121, symbol: "LOL", name: "LeagueCoin", canLend: 0 },
    "122": { id: 122, symbol: "LOVE", name: "LOVEcoin", canLend: 0 },
    "123": { id: 123, symbol: "LQD", name: "LIQUID", canLend: 0 },
    "124": { id: 124, symbol: "LTBC", name: "LTBCoin", canLend: 0 },
    "125": { id: 125, symbol: "LTC", name: "Litecoin", canLend: 1 },
    "126": { id: 126, symbol: "LTCX", name: "LiteCoinX", canLend: 0 },
    "127": { id: 127, symbol: "MAID", name: "MaidSafeCoin", canLend: 0 },
    "128": { id: 128, symbol: "MAST", name: "MastiffCoin", canLend: 0 },
    "129": { id: 129, symbol: "MAX", name: "MaxCoin", canLend: 0 },
    "130": { id: 130, symbol: "MCN", name: "Moneta Verde", canLend: 0 },
    "131": { id: 131, symbol: "MEC", name: "Megacoin", canLend: 0 },
    "132": { id: 132, symbol: "METH", name: "CryptoMETH", canLend: 0 },
    "133": { id: 133, symbol: "MIL", name: "Millennium Coin", canLend: 0 },
    "134": { id: 134, symbol: "MIN", name: "Minerals", canLend: 0 },
    "135": { id: 135, symbol: "MINT", name: "Mintcoin", canLend: 0 },
    "136": { id: 136, symbol: "MMC", name: "MemoryCoin", canLend: 0 },
    "137": { id: 137, symbol: "MMNXT", name: "MMNXT", canLend: 0 },
    "138": { id: 138, symbol: "MMXIV", name: "Maieuticoin", canLend: 0 },
    "139": { id: 139, symbol: "MNTA", name: "Moneta", canLend: 0 },
    "140": { id: 140, symbol: "MON", name: "Monocle", canLend: 0 },
    "141": { id: 141, symbol: "MRC", name: "microCoin", canLend: 0 },
    "142": { id: 142, symbol: "MRS", name: "Marscoin", canLend: 0 },
    "143": { id: 143, symbol: "OMNI", name: "Omni", canLend: 0 },
    "144": { id: 144, symbol: "MTS", name: "Metiscoin", canLend: 0 },
    "145": { id: 145, symbol: "MUN", name: "Muniti", canLend: 0 },
    "146": { id: 146, symbol: "MYR", name: "Myriadcoin", canLend: 0 },
    "147": { id: 147, symbol: "MZC", name: "MazaCoin", canLend: 0 },
    "148": { id: 148, symbol: "N5X", name: "N5coin", canLend: 0 },
    "149": { id: 149, symbol: "NAS", name: "NAS", canLend: 0 },
    "150": { id: 150, symbol: "NAUT", name: "Nautiluscoin", canLend: 0 },
    "151": { id: 151, symbol: "NAV", name: "NAVCoin", canLend: 0 },
    "152": { id: 152, symbol: "NBT", name: "NuBits", canLend: 0 },
    "153": { id: 153, symbol: "NEOS", name: "Neoscoin", canLend: 0 },
    "154": { id: 154, symbol: "NL", name: "Nanolite", canLend: 0 },
    "155": { id: 155, symbol: "NMC", name: "Namecoin", canLend: 0 },
    "156": { id: 156, symbol: "NOBL", name: "NobleCoin", canLend: 0 },
    "157": { id: 157, symbol: "NOTE", name: "DNotes", canLend: 0 },
    "158": { id: 158, symbol: "NOXT", name: "NobleNXT", canLend: 0 },
    "159": { id: 159, symbol: "NRS", name: "NoirShares", canLend: 0 },
    "160": { id: 160, symbol: "NSR", name: "NuShares", canLend: 0 },
    "161": { id: 161, symbol: "NTX", name: "NTX", canLend: 0 },
    "162": { id: 162, symbol: "NXT", name: "NXT", canLend: 0 },
    "163": { id: 163, symbol: "NXTI", name: "NXTInspect", canLend: 0 },
    "164": { id: 164, symbol: "OPAL", name: "Opal", canLend: 0 },
    "165": { id: 165, symbol: "PAND", name: "PandaCoin", canLend: 0 },
    "166": { id: 166, symbol: "PAWN", name: "Pawncoin", canLend: 0 },
    "167": { id: 167, symbol: "PIGGY", name: "New Piggycoin", canLend: 0 },
    "168": { id: 168, symbol: "PINK", name: "Pinkcoin", canLend: 0 },
    "169": { id: 169, symbol: "PLX", name: "ParallaxCoin", canLend: 0 },
    "170": { id: 170, symbol: "PMC", name: "Premine", canLend: 0 },
    "171": { id: 171, symbol: "POT", name: "PotCoin", canLend: 0 },
    "172": { id: 172, symbol: "PPC", name: "Peercoin", canLend: 0 },
    "173": { id: 173, symbol: "PRC", name: "ProsperCoin", canLend: 0 },
    "174": { id: 174, symbol: "PRT", name: "Particle", canLend: 0 },
    "175": { id: 175, symbol: "PTS", name: "BitShares PTS", canLend: 0 },
    "176": { id: 176, symbol: "Q2C", name: "QubitCoin", canLend: 0 },
    "177": { id: 177, symbol: "QBK", name: "Qibuck", canLend: 0 },
    "178": { id: 178, symbol: "QCN", name: "QuazarCoin", canLend: 0 },
    "179": { id: 179, symbol: "QORA", name: "Qora", canLend: 0 },
    "180": { id: 180, symbol: "QTL", name: "Quatloo", canLend: 0 },
    "181": { id: 181, symbol: "RBY", name: "Rubycoin", canLend: 0 },
    "182": { id: 182, symbol: "RDD", name: "Reddcoin", canLend: 0 },
    "183": { id: 183, symbol: "RIC", name: "Riecoin", canLend: 0 },
    "184": { id: 184, symbol: "RZR", name: "Razor", canLend: 0 },
    "185": { id: 185, symbol: "SDC", name: "Shadow", canLend: 0 },
    "186": { id: 186, symbol: "SHIBE", name: "ShibeCoin", canLend: 0 },
    "187": { id: 187, symbol: "SHOPX", name: "ShopX", canLend: 0 },
    "188": { id: 188, symbol: "SILK", name: "Silkcoin", canLend: 0 },
    "189": { id: 189, symbol: "SJCX", name: "Storjcoin X", canLend: 0 },
    "190": { id: 190, symbol: "SLR", name: "SolarCoin", canLend: 0 },
    "191": { id: 191, symbol: "SMC", name: "SmartCoin", canLend: 0 },
    "192": { id: 192, symbol: "SOC", name: "SocialCoin", canLend: 0 },
    "193": { id: 193, symbol: "SPA", name: "Spaincoin", canLend: 0 },
    "194": { id: 194, symbol: "SQL", name: "Squallcoin", canLend: 0 },
    "195": { id: 195, symbol: "SRCC", name: "SourceCoin", canLend: 0 },
    "196": { id: 196, symbol: "SRG", name: "Surge", canLend: 0 },
    "197": { id: 197, symbol: "SSD", name: "Sonic", canLend: 0 },
    "198": { id: 198, symbol: "STR", name: "Stellar", canLend: 1 },
    "199": { id: 199, symbol: "SUM", name: "SummerCoin", canLend: 0 },
    "200": { id: 200, symbol: "SUN", name: "Sun", canLend: 0 },
    "201": { id: 201, symbol: "SWARM", name: "SWARM", canLend: 0 },
    "202": { id: 202, symbol: "SXC", name: "Sexcoin", canLend: 0 },
    "203": { id: 203, symbol: "SYNC", name: "Sync", canLend: 0 },
    "204": { id: 204, symbol: "SYS", name: "Syscoin", canLend: 0 },
    "205": { id: 205, symbol: "TAC", name: "Talkcoin", canLend: 0 },
    "206": { id: 206, symbol: "TOR", name: "TorCoin", canLend: 0 },
    "207": { id: 207, symbol: "TRUST", name: "TrustPlus", canLend: 0 },
    "208": { id: 208, symbol: "TWE", name: "Twecoin", canLend: 0 },
    "209": { id: 209, symbol: "UIS", name: "Unitus", canLend: 0 },
    "210": { id: 210, symbol: "ULTC", name: "Umbrella-LTC", canLend: 0 },
    "211": { id: 211, symbol: "UNITY", name: "SuperNET", canLend: 0 },
    "212": { id: 212, symbol: "URO", name: "Uro", canLend: 0 },
    "213": { id: 213, symbol: "USDE", name: "USDE", canLend: 0 },
    "214": { id: 214, symbol: "USDT", name: "Tether USD", canLend: 1 },
    "215": { id: 215, symbol: "UTC", name: "UltraCoin", canLend: 0 },
    "216": { id: 216, symbol: "UTIL", name: "UtilityCoin", canLend: 0 },
    "217": { id: 217, symbol: "UVC", name: "UniversityCoin", canLend: 0 },
    "218": { id: 218, symbol: "VIA", name: "Viacoin", canLend: 0 },
    "219": { id: 219, symbol: "VOOT", name: "VootCoin", canLend: 0 },
    "220": { id: 220, symbol: "VRC", name: "VeriCoin", canLend: 0 },
    "221": { id: 221, symbol: "VTC", name: "Vertcoin", canLend: 0 },
    "222": { id: 222, symbol: "WC", name: "WhiteCoin", canLend: 0 },
    "223": { id: 223, symbol: "WDC", name: "Worldcoin", canLend: 0 },
    "224": { id: 224, symbol: "WIKI", name: "Wikicoin", canLend: 0 },
    "225": { id: 225, symbol: "WOLF", name: "InsanityCoin", canLend: 0 },
    "226": { id: 226, symbol: "X13", name: "X13Coin", canLend: 0 },
    "227": { id: 227, symbol: "XAI", name: "Sapience AIFX", canLend: 0 },
    "228": { id: 228, symbol: "XAP", name: "API Coin", canLend: 0 },
    "229": { id: 229, symbol: "XBC", name: "BitcoinPlus", canLend: 0 },
    "230": { id: 230, symbol: "XC", name: "XCurrency", canLend: 0 },
    "231": { id: 231, symbol: "XCH", name: "ClearingHouse", canLend: 0 },
    "232": { id: 232, symbol: "XCN", name: "Cryptonite", canLend: 0 },
    "233": { id: 233, symbol: "XCP", name: "Counterparty", canLend: 0 },
    "234": { id: 234, symbol: "XCR", name: "Crypti", canLend: 0 },
    "235": { id: 235, symbol: "XDN", name: "DigitalNote", canLend: 0 },
    "236": { id: 236, symbol: "XDP", name: "Dogeparty", canLend: 0 },
    "237": { id: 237, symbol: "XHC", name: "Honorcoin", canLend: 0 },
    "238": { id: 238, symbol: "XLB", name: "Libertycoin", canLend: 0 },
    "239": { id: 239, symbol: "XMG", name: "Magi", canLend: 0 },
    "240": { id: 240, symbol: "XMR", name: "Monero", canLend: 1 },
    "241": { id: 241, symbol: "XPB", name: "Pebblecoin", canLend: 0 },
    "242": { id: 242, symbol: "XPM", name: "Primecoin", canLend: 0 },
    "243": { id: 243, symbol: "XRP", name: "Ripple", canLend: 1 },
    "244": { id: 244, symbol: "XSI", name: "Stability Shares", canLend: 0 },
    "245": { id: 245, symbol: "XST", name: "StealthCoin", canLend: 0 },
    "246": { id: 246, symbol: "XSV", name: "Silicon Valley Coin", canLend: 0 },
    "247": { id: 247, symbol: "XUSD", name: "CoinoUSD", canLend: 0 },
    "248": { id: 248, symbol: "XXC", name: "CREDS", canLend: 0 },
    "249": { id: 249, symbol: "YACC", name: "YACCoin", canLend: 0 },
    "250": { id: 250, symbol: "YANG", name: "Yangcoin", canLend: 0 },
    "251": { id: 251, symbol: "YC", name: "YellowCoin", canLend: 0 },
    "252": { id: 252, symbol: "YIN", name: "Yincoin", canLend: 0 },
    "253": { id: 253, symbol: "XVC", name: "Vcash", canLend: 0 },
    "254": { id: 254, symbol: "FLO", name: "Florincoin", canLend: 0 },
    "256": { id: 256, symbol: "XEM", name: "NEM", canLend: 0 },
    "258": { id: 258, symbol: "ARCH", name: "ARCHcoin", canLend: 0 },
    "260": { id: 260, symbol: "HUGE", name: "BIGcoin", canLend: 0 },
    "261": { id: 261, symbol: "GRC", name: "Gridcoin Research", canLend: 0 },
    "263": { id: 263, symbol: "IOC", name: "IO Digital Currency", canLend: 0 },
    "265": { id: 265, symbol: "INDEX", name: "CoinoIndex", canLend: 0 },
    "267": { id: 267, symbol: "ETH", name: "Ethereum", canLend: 1 },
    "268": { id: 268, symbol: "SC", name: "Siacoin", canLend: 0 },
    "269": { id: 269, symbol: "BCY", name: "BitCrystals", canLend: 0 },
    "270": { id: 270, symbol: "EXP", name: "Expanse", canLend: 0 },
    "271": { id: 271, symbol: "FCT", name: "Factom", canLend: 0 },
    "272": { id: 272, symbol: "BITUSD", name: "BitUSD", canLend: 0 },
    "273": { id: 273, symbol: "BITCNY", name: "BitCNY", canLend: 0 },
    "274": { id: 274, symbol: "RADS", name: "Radium", canLend: 0 },
    "275": { id: 275, symbol: "AMP", name: "Synereo AMP", canLend: 0 },
    "276": { id: 276, symbol: "VOX", name: "Voxels", canLend: 0 },
    "277": { id: 277, symbol: "DCR", name: "Decred", canLend: 0 },
    "278": { id: 278, symbol: "LSK", name: "Lisk", canLend: 0 },
    "279": { id: 279, symbol: "DAO", name: "The DAO", canLend: 0 },
    "280": { id: 280, symbol: "LBC", name: "LBRY Credits", canLend: 0 },
    "281": { id: 281, symbol: "STEEM", name: "STEEM", canLend: 0 },
    "282": { id: 282, symbol: "SBD", name: "Steem Dollars", canLend: 0 },
    "283": { id: 283, symbol: "ETC", name: "Ethereum Classic", canLend: 1 },
    "284": { id: 284, symbol: "REP", name: "Augur", canLend: 0 },
    "285": { id: 285, symbol: "ARDR", name: "Ardor", canLend: 0 },
    "286": { id: 286, symbol: "ZEC", name: "Zcash", canLend: 0 },
    "287": { id: 287, symbol: "STRAT", name: "Stratis", canLend: 0 },
    "288": { id: 288, symbol: "NXC", name: "Nexium", canLend: 0 },
    "289": { id: 289, symbol: "PASC", name: "PascalCoin", canLend: 0 },
    "290": { id: 290, symbol: "GNT", name: "Golem", canLend: 0 },
    "291": { id: 291, symbol: "GNO", name: "Gnosis", canLend: 0 },
    "292": {
      id: 292,
      symbol: "BCH",
      name: "Bitcoin Cash (FROZEN)",
      canLend: 0,
    },
    "293": { id: 293, symbol: "ZRX", name: "0x", canLend: 0 },
    "294": { id: 294, symbol: "CVC", name: "Civic", canLend: 0 },
    "295": { id: 295, symbol: "OMG", name: "OmiseGO", canLend: 0 },
    "296": { id: 296, symbol: "GAS", name: "Gas", canLend: 0 },
    "297": { id: 297, symbol: "STORJ", name: "Storj", canLend: 0 },
    "298": { id: 298, symbol: "EOS", name: "EOS", canLend: 1 },
    "299": { id: 299, symbol: "USDC", name: "USD Coin", canLend: 1 },
    "300": { id: 300, symbol: "SNT", name: "Status", canLend: 0 },
    "301": { id: 301, symbol: "KNC", name: "Kyber", canLend: 0 },
    "302": {
      id: 302,
      symbol: "BAT",
      name: "Basic Attention Token",
      canLend: 0,
    },
    "303": { id: 303, symbol: "LOOM", name: "LOOM Network", canLend: 0 },
    "304": { id: 304, symbol: "QTUM", name: "Qtum", canLend: 0 },
    "305": { id: 305, symbol: "BNT", name: "Bancor", canLend: 0 },
    "306": { id: 306, symbol: "MANA", name: "Decentraland", canLend: 0 },
    "307": { id: 307, symbol: "FOAM", name: "Foam", canLend: 0 },
    "308": { id: 308, symbol: "BCHABC", name: "Bitcoin Cash", canLend: 1 },
    "309": { id: 309, symbol: "BCHSV", name: "Bitcoin SV", canLend: 1 },
    "310": { id: 310, symbol: "NMR", name: "Numeraire", canLend: 0 },
    "311": { id: 311, symbol: "POLY", name: "Polymath", canLend: 0 },
    "312": { id: 312, symbol: "LPT", name: "Livepeer", canLend: 0 },
    "313": { id: 313, symbol: "ATOM", name: "Cosmos", canLend: 1 },
    "314": { id: 314, symbol: "GRIN", name: "Grin", canLend: 0 },
    "315": { id: 315, symbol: "TRX", name: "Tron", canLend: 1 },
    "319": {
      id: 319,
      symbol: "ETHBNT",
      name: "Bancor ETH Smart Token Relay",
      canLend: 0,
    },
    "320": { id: 320, symbol: "BTT", name: "BitTorrent", canLend: 0 },
    "321": { id: 321, symbol: "WIN", name: "WINK", canLend: 0 },
    "322": {
      id: 322,
      symbol: "BEAR",
      name: "3X Short Bitcoin Token",
      canLend: 0,
    },
    "323": {
      id: 323,
      symbol: "BULL",
      name: "3X Long Bitcoin Token",
      canLend: 0,
    },
    "324": { id: 324, symbol: "BUSD", name: "Binance USD", canLend: 0 },
    "325": { id: 325, symbol: "DAI", name: "Dai Stablecoin", canLend: 0 },
    "327": { id: 327, symbol: "LINK", name: "Chainlink", canLend: 0 },
    "328": { id: 328, symbol: "MKR", name: "Maker", canLend: 0 },
    "329": { id: 329, symbol: "PAX", name: "Paxos Standard", canLend: 0 },
    "330": {
      id: 330,
      symbol: "TRXBEAR",
      name: "3X Short TRX Token",
      canLend: 0,
    },
    "331": {
      id: 331,
      symbol: "TRXBULL",
      name: "3X Long TRX Token",
      canLend: 0,
    },
    "333": {
      id: 333,
      symbol: "ETHBEAR",
      name: "3X Short Ethereum Token",
      canLend: 0,
    },
    "334": {
      id: 334,
      symbol: "ETHBULL",
      name: "3X Long Ethereum Token",
      canLend: 0,
    },
    "335": {
      id: 335,
      symbol: "SNX",
      name: "Synthetix Network Token",
      canLend: 0,
    },
    "336": { id: 336, symbol: "XTZ", name: "Tezos", canLend: 0 },
    "337": { id: 337, symbol: "USDJ", name: "USDJ", canLend: 0 },
    "338": { id: 338, symbol: "MATIC", name: "Matic Network", canLend: 0 },
    "339": {
      id: 339,
      symbol: "BCHBEAR",
      name: "3X Short Bitcoin Cash Token",
      canLend: 0,
    },
    "340": {
      id: 340,
      symbol: "BCHBULL",
      name: "3X Long Bitcoin Cash Token",
      canLend: 0,
    },
    "341": {
      id: 341,
      symbol: "BSVBEAR",
      name: "3X Short Bitcoin SV Token",
      canLend: 0,
    },
    "342": {
      id: 342,
      symbol: "BSVBULL",
      name: "3X Long Bitcoin SV Token",
      canLend: 0,
    },
    "343": { id: 343, symbol: "BNB", name: "Binance Coin", canLend: 0 },
    "344": { id: 344, symbol: "AVA", name: "Travala.com Token", canLend: 0 },
    "345": { id: 345, symbol: "JST", name: "Just", canLend: 0 },
    "346": {
      id: 346,
      symbol: "BVOL",
      name: "Bitcoin Volatility Token",
      canLend: 0,
    },
    "347": {
      id: 347,
      symbol: "IBVOL",
      name: "Inverse Bitcoin Volatility Token",
      canLend: 0,
    },
    "348": { id: 348, symbol: "NEO", name: "Neo", canLend: 0 },
    "349": { id: 349, symbol: "SWFTC", name: "SwftCoin", canLend: 0 },
    "350": {
      id: 350,
      symbol: "STPT",
      name: "Standard Tokenization Protocol",
      canLend: 0,
    },
    "351": { id: 351, symbol: "FXC", name: "Flexacoin", canLend: 0 },
    "352": {
      id: 352,
      symbol: "XRPBULL",
      name: "3X Long XRP Token",
      canLend: 0,
    },
    "353": {
      id: 353,
      symbol: "XRPBEAR",
      name: "3X Short XRP Token",
      canLend: 0,
    },
    "354": {
      id: 354,
      symbol: "EOSBULL",
      name: "3X Long EOS Token",
      canLend: 0,
    },
    "355": {
      id: 355,
      symbol: "EOSBEAR",
      name: "3X Short EOS Token",
      canLend: 0,
    },
    "356": {
      id: 356,
      symbol: "LINKBULL",
      name: "3X Long Chainlink Token",
      canLend: 0,
    },
    "357": {
      id: 357,
      symbol: "LINKBEAR",
      name: "3X Short Chainlink Token",
      canLend: 0,
    },
    "358": { id: 358, symbol: "CHR", name: "Chromia", canLend: 0 },
    "359": {
      id: 359,
      symbol: "MDT",
      name: "Measurable Data Token",
      canLend: 0,
    },
    "360": { id: 360, symbol: "BCHC", name: "BitCherry", canLend: 0 },
    "361": {
      id: 361,
      symbol: "COMP",
      name: "Compound Governance Token",
      canLend: 0,
    },
    "363": { id: 363, symbol: "WRX", name: "WazirX", canLend: 0 },
    "364": { id: 364, symbol: "CUSDT", name: "Compound USDT", canLend: 0 },
    "365": { id: 365, symbol: "XFIL", name: "Filecoin [IOU]", canLend: 0 },
    "366": { id: 366, symbol: "LEND", name: "Aave", canLend: 0 },
    "367": { id: 367, symbol: "REN", name: "Ren", canLend: 0 },
    "368": { id: 368, symbol: "LRC", name: "Loopring", canLend: 0 },
    "369": { id: 369, symbol: "BAL", name: "Balancer", canLend: 0 },
    "371": { id: 371, symbol: "STAKE", name: "xDAI Stake", canLend: 0 },
    "372": { id: 372, symbol: "BZRX", name: "bZx Protocol Token", canLend: 0 },
    "373": { id: 373, symbol: "SXP", name: "Swipe", canLend: 0 },
    "374": { id: 374, symbol: "MTA", name: "Meta", canLend: 0 },
    "375": { id: 375, symbol: "YFI", name: "yearn.finance", canLend: 0 },
    "377": {
      id: 377,
      symbol: "TRUMPWIN",
      name: "Trump Wins Token",
      canLend: 0,
    },
    "378": {
      id: 378,
      symbol: "TRUMPLOSE",
      name: "Trump Loses Token",
      canLend: 0,
    },
    "379": { id: 379, symbol: "DEC", name: "Decentr", canLend: 0 },
    "380": { id: 380, symbol: "PLT", name: "PlutusDeFi", canLend: 0 },
    "381": { id: 381, symbol: "UMA", name: "UMA", canLend: 0 },
    "382": {
      id: 382,
      symbol: "KTON",
      name: "Darwinia Commitment Token",
      canLend: 0,
    },
    "383": {
      id: 383,
      symbol: "RING",
      name: "Darwinia Network Native Token",
      canLend: 0,
    },
    "384": { id: 384, symbol: "SWAP", name: "Trustswap", canLend: 0 },
    "385": { id: 385, symbol: "TEND", name: "Tendies", canLend: 0 },
    "386": { id: 386, symbol: "TRADE", name: "UniTrade", canLend: 0 },
    "388": { id: 388, symbol: "GEEQ", name: "GEEQ", canLend: 0 },
    "390": { id: 390, symbol: "BAND", name: "Band Protocol Token", canLend: 0 },
    "391": { id: 391, symbol: "DIA", name: "DIA", canLend: 0 },
    "392": { id: 392, symbol: "DOS", name: "DOS Network", canLend: 0 },
    "393": { id: 393, symbol: "ZAP", name: "Zap", canLend: 0 },
    "394": { id: 394, symbol: "TRB", name: "Tellor", canLend: 0 },
    "396": { id: 396, symbol: "SBREE", name: "Coinbreeder DAO", canLend: 0 },
    "397": { id: 397, symbol: "DEXT", name: "DexTools", canLend: 0 },
    "398": { id: 398, symbol: "MCB", name: "MCDex", canLend: 0 },
    "399": { id: 399, symbol: "PERX", name: "PeerEx Network", canLend: 0 },
    "400": { id: 400, symbol: "DOT", name: "Polkadot [IOU]", canLend: 0 },
    "401": { id: 401, symbol: "CRV", name: "Curve Finance", canLend: 0 },
    "402": { id: 402, symbol: "XDOT", name: "Polkadot OLD [IOU]", canLend: 0 },
    "403": { id: 403, symbol: "OCEAN", name: "Ocean Protocol", canLend: 0 },
    "404": { id: 404, symbol: "DMG", name: "DMM: Governance", canLend: 0 },
    "405": { id: 405, symbol: "OM", name: "Mantra DAO", canLend: 0 },
    "406": { id: 406, symbol: "BLY", name: "Blocery", canLend: 0 },
    "407": { id: 407, symbol: "OPT", name: "OpenPredict", canLend: 0 },
    "408": { id: 408, symbol: "PRQ", name: "PARSIQ", canLend: 0 },
    "409": { id: 409, symbol: "SWINGBY", name: "Swingby", canLend: 0 },
    "410": { id: 410, symbol: "FUND", name: "Unification", canLend: 0 },
    "411": { id: 411, symbol: "RSR", name: "Reserve Rights Token", canLend: 0 },
    "412": { id: 412, symbol: "WNXM", name: "Wrapped NXM", canLend: 0 },
    "413": { id: 413, symbol: "FCT2", name: "Firmachain", canLend: 0 },
    "414": { id: 414, symbol: "SUSHI", name: "SushiSwap", canLend: 0 },
    "415": { id: 415, symbol: "YFII", name: "DFI.money", canLend: 0 },
    "416": { id: 416, symbol: "YFV", name: "YFValue", canLend: 0 },
    "417": { id: 417, symbol: "YFL", name: "YFLink", canLend: 0 },
    "418": { id: 418, symbol: "TAI", name: "tBridge Token", canLend: 0 },
    "419": { id: 419, symbol: "PEARL", name: "Pearl Finance", canLend: 0 },
    "420": { id: 420, symbol: "ANK", name: "AlphaLink", canLend: 0 },
    "421": { id: 421, symbol: "JFI", name: "JackPool.finance", canLend: 0 },
    "422": { id: 422, symbol: "CRT", name: "Carrot Finance", canLend: 0 },
    "423": { id: 423, symbol: "SAL", name: "Salmon", canLend: 0 },
    "424": { id: 424, symbol: "CORN", name: "Corn", canLend: 0 },
    "425": { id: 425, symbol: "SWRV", name: "Swerve", canLend: 0 },
    "426": { id: 426, symbol: "FSW", name: "FalconSwap", canLend: 0 },
    "427": { id: 427, symbol: "CREAM", name: "Cream", canLend: 0 },
  },
};

export class PoloniexCurrencies
  extends AbstractExchangeCurrencies
  implements Currency.ExternalExchangeTicker
{
  protected exchange: AbstractExchange;

  constructor(exchange: AbstractExchange) {
    super(exchange);
  }

  public getExchangeName(localCurrencyName: string): string {
    if (localCurrencyName === "NEO") return "NEOS";
    return super.getExchangeName(localCurrencyName);
  }
  public getLocalName(exchangeCurrencyName: string): string {
    if (exchangeCurrencyName === "NEOS") return "NEO";
    return exchangeCurrencyName;
  }

  public getExchangePair(localPair: Currency.CurrencyPair): string {
    let str1 = Currency.Currency[localPair.from];
    let str2 = Currency.Currency[localPair.to];
    if (!str1 || !str2)
      // currently polo supports all our currencies, so this shouldn't happen
      return undefined;
    return this.getExchangeName(str1) + "_" + this.getExchangeName(str2); // BTC_LTC
  }
  public getLocalPair(exchangePair: string): Currency.CurrencyPair {
    let pair = exchangePair.split("_");
    let cur1 = Currency.Currency[this.getLocalName(pair[0])];
    let cur2 = Currency.Currency[this.getLocalName(pair[1])];
    if (!cur1 || !cur2) return undefined;
    return new Currency.CurrencyPair(cur1, cur2);
  }
  public toLocalTicker(exchangeTicker: any): Ticker.Ticker {
    let ticker = new Ticker.Ticker(this.exchange.getExchangeLabel());
    if (
      Array.isArray(exchangeTicker) === false ||
      exchangeTicker.length !== 12
    ) {
      logger.error(
        "Received invalid exchange ticker data from %s",
        this.exchange.getClassName(),
        exchangeTicker
      );
      return undefined;
    }
    ticker.currencyPair = this.getLocalPair(exchangeTicker[0]);
    if (!ticker.currencyPair) return undefined; // we don't support this pair
    ticker.last = Ticker.Ticker.parseNumber(exchangeTicker[1]);
    ticker.lowestAsk = Ticker.Ticker.parseNumber(exchangeTicker[2]);
    ticker.highestBid = Ticker.Ticker.parseNumber(exchangeTicker[3]);
    ticker.percentChange = Ticker.Ticker.parseNumber(exchangeTicker[4]);
    ticker.baseVolume = Ticker.Ticker.parseNumber(exchangeTicker[5]);
    ticker.quoteVolume = Ticker.Ticker.parseNumber(exchangeTicker[6]);
    ticker.isFrozen = exchangeTicker[7] ? true : false;
    ticker.high24hr = Ticker.Ticker.parseNumber(exchangeTicker[8]);
    ticker.low24hr = Ticker.Ticker.parseNumber(exchangeTicker[9]);
    return ticker;
  }
  public toExternalTicker(exchangeTicker: any): Ticker.ExternalTicker {
    let ticker = new Ticker.ExternalTicker(this.exchange.getExchangeLabel());
    if (
      Array.isArray(exchangeTicker) === false ||
      exchangeTicker.length !== 12
    ) {
      logger.error(
        "Received invalid exchange ticker data from %s",
        this.exchange.getClassName(),
        exchangeTicker
      );
      return undefined;
    }
    ticker.currencyPair = exchangeTicker[0];
    ticker.last = Ticker.Ticker.parseNumber(exchangeTicker[1]);
    ticker.lowestAsk = Ticker.Ticker.parseNumber(exchangeTicker[2]);
    ticker.highestBid = Ticker.Ticker.parseNumber(exchangeTicker[3]);
    ticker.percentChange = Ticker.Ticker.parseNumber(exchangeTicker[4]);
    ticker.baseVolume = Ticker.Ticker.parseNumber(exchangeTicker[5]);
    ticker.quoteVolume = Ticker.Ticker.parseNumber(exchangeTicker[6]);
    ticker.isFrozen = exchangeTicker[7] ? true : false;
    ticker.high24hr = Ticker.Ticker.parseNumber(exchangeTicker[8]);
    ticker.low24hr = Ticker.Ticker.parseNumber(exchangeTicker[9]);
    return ticker;
  }
}

export default class Poloniex
  extends AbstractLendingExchange
  implements ExternalTickerExchange
{
  protected static laodedTickers = false;

  constructor(options: ExOptions) {
    super(options);
    this.publicApiUrl = "https://poloniex.com/public?";
    this.privateApiUrl = "https://poloniex.com/tradingApi";
    //this.pushApiUrl = "wss://api.poloniex.com"; // for autobahn
    this.pushApiUrl = "wss://api2.poloniex.com";
    this.pushApiConnectionType = PushApiConnectionType.WEBSOCKET;
    // TODO polo bot often becomes unresponsive when too many private requests time out. nodejs bug? try not setting "forever" to disable persistent http connections?
    this.httpKeepConnectionsAlive = true;
    this.dateTimezoneSuffix = " GMT+0000";
    this.exchangeLabel = Currency.Exchange.POLONIEX;
    this.minTradingValue = 0.01;
    this.minTradingValueMargin = 0.02; // for margin positions
    this.fee = 0.0025; // TODO use returnFeeInfo API call on startup to get accurate fees if we trade that much to get lower fees
    this.maxLeverage = 2.5;
    this.currencies = new PoloniexCurrencies(this);
    this.webSocketTimeoutMs = nconf.get("serverConfig:websocketTimeoutMs") * 2;

    this.lendingFee = 0.0015;
    this.minLendingValue = 0.01;
    this.minLendingValueCurrency = Currency.Currency.BTC;
    this.pollExchangeTicker = nconf.get("lending");

    if (Poloniex.laodedTickers === false) Poloniex.loadPoloniexTickers();
  }

  public getTicker() {
    return new Promise<Ticker.TickerMap>((resolve, reject) => {
      this.publicReq("returnTicker")
        .then((ticker) => {
          resolve(
            Ticker.TickerMap.fromJson(
              ticker,
              this.currencies,
              this.getExchangeLabel()
            )
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getExternalTicker() {
    return new Promise<Ticker.ExternalTickerMap>((resolve, reject) => {
      this.publicReq("returnTicker")
        .then((ticker) => {
          resolve(
            Ticker.ExternalTickerMap.fromJson(
              ticker,
              this.currencies,
              this.getExchangeLabel()
            )
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getBalances() {
    return new Promise<Currency.LocalCurrencyList>((resolve, reject) => {
      this.privateReq("returnBalances")
        .then((balances) => {
          /*
                console.log(balances)
                let from = Currency.fromExchangeList(balances)
                console.log(from)
                console.log(Currency.toExchangeList(from))
                */
          /*
                let pair: Currency.CurrencyPair = [Currency.Currency.BTC, Currency.Currency.LTC]
                let strPair = this.currencies.getExchangePair(pair)
                console.log(strPair)
                console.log(this.currencies.getLocalPair(strPair))
                */
          resolve(Currency.fromExchangeList(balances)); // { '1': 0.07235068, '2': 1.99743826 }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getMarginAccountSummary() {
    return new Promise<MarginAccountSummary>((resolve, reject) => {
      this.privateReq("returnMarginAccountSummary")
        .then((account) => {
          resolve(MarginAccountSummary.fromJson(account));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public fetchOrderBook(currencyPair: Currency.CurrencyPair, depth: number) {
    return new Promise<OrderBookUpdate<MarketOrder.MarketOrder>>(
      (resolve, reject) => {
        const pairStr = this.currencies.getExchangePair(currencyPair);
        this.publicReq("returnOrderBook", {
          currencyPair: pairStr, // or "all"
          depth: depth,
        })
          .then((book) => {
            let orders = new OrderBookUpdate<MarketOrder.MarketOrder>(
              book.seq,
              book.isFrozen == "1"
            );
            ["asks", "bids"].forEach((prop) => {
              book[prop].forEach((o) => {
                //orders[prop].push({rate: parseFloat(o[0]), amount: parseFloat(o[1])})
                orders[prop].push(
                  MarketOrder.MarketOrder.getOrder(
                    currencyPair,
                    this.getExchangeLabel(),
                    o[1],
                    o[0]
                  )
                );
              });
            });
            resolve(orders);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  }

  public importHistory(
    currencyPair: Currency.CurrencyPair,
    start: Date,
    end: Date
  ) {
    return new Promise<void>((resolve, reject) => {
      const pairStr = this.currencies.getExchangePair(currencyPair);
      const startMs = start.getTime();
      const endMs = end.getTime();
      let currentMs = startMs;
      let tradeCount = 0;
      let stepMs = 300 * utils.constants.MINUTE_IN_SECONDS * 1000; // poloniex returns max 50k trades per call. reduce this if too high
      let importNext = () => {
        if (currentMs > endMs + stepMs) {
          logger.info(
            "Import of %s %s history has finished. Imported %s trades",
            this.className,
            currencyPair.toString(),
            tradeCount
          );
          let history = new TradeHistory.TradeHistory(
            currencyPair,
            this.getExchangeLabel(),
            start,
            end
          );
          if (tradeCount !== 0) TradeHistory.addToHistory(db.get(), history);
          return resolve();
        }
        this.publicReq("returnTradeHistory", {
          currencyPair: pairStr,
          start: Math.floor(currentMs / 1000),
          end: Math.floor((currentMs + stepMs) / 1000),
        })
          .then((history) => {
            if (history.length >= 50000) {
              stepMs -= 20 * utils.constants.MINUTE_IN_SECONDS * 1000;
              if (stepMs <= 1000)
                return reject({
                  txt: "Unable to get small enough timeframe to import all trades",
                });
              logger.warn(
                "%s trade history is incomplete. Retrying with smaller step %s ms",
                this.className,
                stepMs
              );
              return importNext();
            } else if (history.length === 0) {
              currentMs += stepMs;
              return importNext(); // happens with last range
            }
            let trades = [];
            history.forEach((poloTrade) => {
              trades.push(
                Trade.Trade.fromJson(
                  poloTrade,
                  currencyPair,
                  this.getExchangeLabel(),
                  this.getFee(),
                  this.getDateTimezoneSuffix()
                )
              );
            });
            tradeCount += trades.length;
            Trade.storeTrades(db.get(), trades, (err) => {
              if (err) logger.error("Error storing trades", err);
              currentMs += stepMs;
              logger.verbose(
                "%s %s import at %s with %s trades",
                this.className,
                currencyPair.toString(),
                utils.date.toDateTimeStr(new Date(currentMs)),
                tradeCount
              );
              importNext();
            });
          })
          .catch((err) => {
            logger.warn("Error importing %s trades", this.className, err);
            setTimeout(importNext.bind(this), 5000); // retry
          });
      };
      importNext();
    });
  }

  public buy(
    currencyPair: Currency.CurrencyPair,
    rate: number,
    amount: number,
    params: OrderParameters = {}
  ) {
    return new Promise<OrderResult>((resolve, reject) => {
      this.verifyTradeRequest(currencyPair, rate, amount, params)
        .then((outParams) => {
          return this.privateReq("buy", outParams);
        })
        .then((result) => {
          // { error: 'Not enough BTC.' }
          // { orderNumber: '288867044947', resultingTrades: [] }
          //console.log(result)
          resolve(OrderResult.fromJson(result, currencyPair, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public sell(
    currencyPair: Currency.CurrencyPair,
    rate: number,
    amount: number,
    params: OrderParameters = {}
  ) {
    return new Promise<OrderResult>((resolve, reject) => {
      this.verifyTradeRequest(currencyPair, rate, amount, params)
        .then((outParams) => {
          return this.privateReq("sell", outParams);
        })
        .then((result) => {
          //console.log(result)
          resolve(OrderResult.fromJson(result, currencyPair, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public cancelOrder(
    currencyPair: Currency.CurrencyPair,
    orderNumber: number | string
  ) {
    return new Promise<CancelOrderResult>((resolve, reject) => {
      let outParams = {
        orderNumber: orderNumber,
      };
      this.privateReq("cancelOrder", outParams)
        .then((result) => {
          resolve({
            exchangeName: this.className,
            orderNumber: orderNumber,
            cancelled: result.success == 1,
          });
        })
        .catch((err) => {
          // check if already filled (or cancelled)
          if (
            err.error &&
            err.error
              .toLowerCase()
              .indexOf("or you are not the person who placed the order")
          )
            return resolve({
              exchangeName: this.className,
              orderNumber: orderNumber,
              cancelled: true,
            });
          reject(err);
        });
    });
  }

  public getOpenOrders(currencyPair: Currency.CurrencyPair) {
    return new Promise<OpenOrders>((resolve, reject) => {
      let outParams = {
        currencyPair: this.currencies.getExchangePair(currencyPair), // or "all"
      };
      this.privateReq("returnOpenOrders", outParams)
        .then((result) => {
          let orders = new OpenOrders(currencyPair, this.className);
          result.forEach((o) => {
            orders.addOrder({
              orderNumber: parseFloat(o.orderNumber),
              type: o.type,
              rate: o.rate,
              amount: o.amount,
              total: o.total,
              leverage: 1,
            }); // TODO leverage is always 1 here, but not used
          });
          resolve(orders);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public moveOrder(
    currencyPair: Currency.CurrencyPair,
    orderNumber: number | string,
    rate: number,
    amount: number,
    params: OrderParameters
  ) {
    return new Promise<OrderResult>((resolve, reject) => {
      this.verifyTradeRequest(null, rate, amount, params)
        .then((outParams) => {
          outParams.orderNumber = orderNumber;
          return this.privateReq("moveOrder", outParams);
        })
        .then((result) => {
          //console.log(result)
          resolve(OrderResult.fromJson(result, currencyPair, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public marginBuy(
    currencyPair: Currency.CurrencyPair,
    rate: number,
    amount: number,
    params: MarginOrderParameters
  ) {
    return new Promise<OrderResult>((resolve, reject) => {
      params.marginOrder = true;
      this.verifyTradeRequest(currencyPair, rate, amount, params)
        .then((outParams) => {
          return this.privateReq("marginBuy", outParams);
        })
        .then((result) => {
          // { orderNumber: '288867044947', resultingTrades: [] }
          //console.log(result)
          resolve(OrderResult.fromJson(result, currencyPair, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public marginSell(
    currencyPair: Currency.CurrencyPair,
    rate: number,
    amount: number,
    params: MarginOrderParameters
  ) {
    return new Promise<OrderResult>((resolve, reject) => {
      params.marginOrder = true;
      this.verifyTradeRequest(currencyPair, rate, amount, params)
        .then((outParams) => {
          return this.privateReq("marginSell", outParams);
        })
        .then((result) => {
          resolve(OrderResult.fromJson(result, currencyPair, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public marginCancelOrder(
    currencyPair: Currency.CurrencyPair,
    orderNumber: number | string
  ) {
    return this.cancelOrder(currencyPair, orderNumber); // on poloniex orderNumbers are unique across all markets
  }

  public moveMarginOrder(
    currencyPair: Currency.CurrencyPair,
    orderNumber: number | string,
    rate: number,
    amount: number,
    params: MarginOrderParameters
  ) {
    params.marginOrder = true;
    return this.moveOrder(currencyPair, orderNumber, rate, amount, params);
  }

  public getAllMarginPositions() {
    return new Promise<MarginPositionList>((resolve, reject) => {
      let outParams = {
        currencyPair: "all",
      };
      this.privateReq("getMarginPosition", outParams)
        .then((positionList) => {
          resolve(
            MarginPositionList.fromJson(
              positionList,
              this.currencies,
              this.getMaxLeverage()
            )
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getMarginPosition(currencyPair: Currency.CurrencyPair) {
    return new Promise<MarginPosition>((resolve, reject) => {
      this.verifyExchangeRequest(currencyPair).then((currencyPairStr) => {
        let outParams = {
          currencyPair: currencyPairStr,
        };
        this.privateReq("getMarginPosition", outParams)
          .then((position) => {
            resolve(MarginPosition.fromJson(position, this.getMaxLeverage()));
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  public closeMarginPosition(currencyPair: Currency.CurrencyPair) {
    return new Promise<OrderResult>((resolve, reject) => {
      this.verifyExchangeRequest(currencyPair).then((currencyPairStr) => {
        let outParams = {
          currencyPair: currencyPairStr,
        };
        this.privateReq("closeMarginPosition", outParams)
          .then((result) => {
            resolve(OrderResult.fromJson(result, currencyPair, this));
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  // ################################################################
  // ###################### LENDING FUNCTIONS #######################
  // TODO writeFundingOrderbook() and writeFundingTrade() via http pull or websocket

  public getFundingBalances() {
    return new Promise<Currency.LocalCurrencyList>((resolve, reject) => {
      this.privateReq("returnAvailableAccountBalances")
        .then((balances) => {
          resolve(Currency.fromExchangeList(balances.lending)); // { '1': 0.07235068, '2': 1.99743826 }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getActiveLoans() {
    return new Promise<ExchangeActiveLoanMap>((resolve, reject) => {
      this.privateReq("returnActiveLoans")
        .then((loans) => {
          if (!loans || !loans.provided)
            return reject({
              txt: "invalid response for active loans",
              exchange: this.className,
              response: loans,
            });
          let loanMap = new ExchangeActiveLoanMap();
          loans.provided.forEach((loan) => {
            const currencyStr = this.currencies.getLocalName(loan.currency);
            const currency = Currency.Currency[currencyStr];
            const rate = helper.parseFloatVal(loan.rate); // daily rate
            const created = new Date(loan.date + this.dateTimezoneSuffix);
            const amount = helper.parseFloatVal(loan.amount);
            let activeLoan = new ActiveLoan(
              this.className,
              loan.id,
              currency,
              rate,
              loan.period,
              amount,
              created
            );
            loanMap.addLoan(currencyStr, activeLoan);
          });
          resolve(loanMap);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public placeOffer(
    currency: Currency.Currency,
    rate: number,
    amount: number,
    params: MarginLendingParams
  ) {
    return new Promise<OfferResult>((resolve, reject) => {
      this.verifyLendingRequest(currency, amount)
        .then((exchangeCurrency) => {
          let outParams = {
            currency: exchangeCurrency,
            amount: amount,
            duration: params.days,
            autoRenew: 0,
            lendingRate: rate, // max 0.05 = 5% // TODO divide by 100?
          };
          return this.privateReq("createLoanOffer", outParams);
        })
        .then((result) => {
          // {"success":1,"message":"Loan order placed.","orderID":10590}
          resolve(OfferResult.fromJson(result, currency, this));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getAllOffers() {
    return new Promise<LoanOffers>((resolve, reject) => {
      this.privateReq("returnOpenLoanOffers")
        .then((offerResponse) => {
          let offers = new LoanOffers(this.className);
          if (Array.isArray(offerResponse)) {
            // array if no offers, object otherwise
            if (offerResponse.length === 0) return resolve(offers);
            return reject({
              txt: "invalid lending offer response",
              exchange: this.className,
              response: offerResponse,
            });
          }
          for (let currency in offerResponse) {
            let curOffers = offerResponse[currency];
            curOffers.forEach((off) => {
              let offer = {
                offerNumber: off.id,
                type: "lend" as LoanDirection,
                currency:
                  Currency.Currency[this.currencies.getLocalName(currency)],
                rate: off.rate, // TODO correct?
                days: off.duration,
                amount: off.amount,
                remainingAmount: off.amount,
                created: new Date(off.date + this.dateTimezoneSuffix),
              };
              offers.addOffer(offer);
            });
          }
          resolve(offers);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public cancelOffer(offerNumber: number | string) {
    return new Promise<CancelOrderResult>((resolve, reject) => {
      let outParams = {
        orderNumber: offerNumber,
      };
      this.privateReq("cancelLoanOffer", outParams)
        .then((result) => {
          resolve({
            exchangeName: this.className,
            cancelled: result.success == 1,
            orderNumber: offerNumber,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  // ################################################################
  // ###################### PRIVATE FUNCTIONS #######################

  protected publicReq(method: string, params: ExRequestParams = {}) {
    return new Promise<ExResponse>((resolve, reject) => {
      if (!this.publicApiUrl)
        return reject({
          txt: "PublicApiUrl must be provided for public exchange request",
          exchange: this.className,
        });

      let data = {
        command: method,
      };
      data = Object.assign(data, params);
      let query = querystring.stringify(data);
      const urlStr = this.publicApiUrl + query;
      this.get(urlStr, (body, response) => {
        this.verifyExchangeResponse(body, response, method)
          .then((json) => {
            resolve(json);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  protected privateReq(method: string, params: ExRequestParams = {}) {
    return new Promise<ExResponse>((resolve, reject) => {
      this.requestQueue = this.requestQueue
        .then(() => {
          // only do 1 request at a time because of nonce
          return new Promise((resolve, reject) => {
            if (!this.privateApiUrl || !this.apiKey)
              return reject({
                txt: "PrivateApiUrl and apiKey must be provided for private exchange request",
                exchange: this.className,
              });

            let data = {
              nonce: this.getNextNonce(),
              command: method,
            };
            data = Object.assign(data, params);
            let query = querystring.stringify(data);
            let options = {
              headers: {
                Key: this.apiKey.key,
                Sign: crypto
                  .createHmac("sha512", this.apiKey.secret)
                  .update(query)
                  .digest("hex"),
              },
              retry: false, // don't retry failed post requests because nonce will be too low
            };
            this.post(
              this.privateApiUrl,
              data,
              (body, response) => {
                this.verifyExchangeResponse(body, response, method)
                  .then((json) => {
                    resolve(json);
                  })
                  .catch((err) => {
                    reject(err);
                  });
              },
              options
            );
          });
        })
        .then((res) => {
          resolve(res); // forward the result
        })
        .catch((err) => {
          reject(err); // forward the error
        });
    });
  }

  protected createConnection(): autobahn.Connection {
    let connection = new autobahn.Connection({
      url: this.pushApiUrl,
      realm: "realm1",
      /*
           // max_retries: 100 // https://github.com/crossbario/autobahn-js/blob/master/doc/reference.md
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
            }*/
    });
    connection.onopen = (session: autobahn.Session) => {
      let marketEvent = (
        currencyPair: Currency.CurrencyPair,
        marketEventStream: EventStream<MarketAction>,
        args,
        kwargs
      ) => {
        const seq = kwargs.seq;
        marketEventStream.add(seq, args);
      };
      let tickerEvent = (args, kwargs) => {
        //console.log(args); // a single "array" with only values as information in a specific order
        let ticker = this.currencies.toLocalTicker(args);
        if (ticker) this.ticker.set(ticker.currencyPair.toString(), ticker);
      };
      let trollboxEvent = (args, kwargs) => {
        console.log(args);
      };
      //session.subscribe('BTC_XRP', marketEvent);
      session.subscribe("ticker", tickerEvent);
      //session.subscribe('trollbox', trollboxEvent);
      this.currencyPairs.forEach((pair) => {
        let marketPair = this.currencies.getExchangePair(pair);
        // every market has their own sequence numbers on poloniex. we have to ensure they are piped in order
        let marketEventStream = new EventStream<any>(
          this.className + "-Market-" + marketPair,
          this.maxPendingMarketEvents
        );
        this.openMarketRelays.push(marketEventStream);
        marketEventStream.on("value", (value, seqNr) => {
          this.marketStream.write(pair, value, seqNr);
        });
        session.subscribe(
          marketPair,
          marketEvent.bind(this, pair, marketEventStream)
        );
      });
    };

    connection.onclose = (reason) => {
      this.onConnectionClose(reason);
      return true;
    };

    connection.open();
    return connection;
  }

  protected createWebsocketConnection(): WebSocket {
    let conn: WebSocket = new WebSocket(
      this.pushApiUrl,
      this.getWebsocketOptions()
    );
    const marketEventStreamMap = new Map<string, EventStream<any>>(); // (exchange currency name, stream instance)

    conn.onopen = (e) => {
      //conn.send(JSON.stringify({command: "subscribe", channel: 1001})); // trollbox
      conn.send(JSON.stringify({ command: "subscribe", channel: 1002 })); // ticker
      //conn.send(JSON.stringify({command: "subscribe", channel: 1003}));
      //conn.send(JSON.stringify({command: "subscribe", channel: "BTC_MAID"}));

      this.currencyPairs.forEach((pair) => {
        let marketPair = this.currencies.getExchangePair(pair);
        // every market has their own sequence numbers on poloniex. we have to ensure they are piped in order
        let marketEventStream = new EventStream<any>(
          this.className + "-Market-" + marketPair,
          this.maxPendingMarketEvents
        );
        this.openMarketRelays.push(marketEventStream);
        marketEventStreamMap.set(marketPair, marketEventStream);
        marketEventStream.on("value", (value, seqNr) => {
          this.marketStream.write(pair, value, seqNr);
        });
        // TODO if we subscribe to too many pairs we don't get updates for all (10?). poloniex limit?
        conn.send(
          JSON.stringify({ command: "subscribe", channel: marketPair })
        );
      });
      this.updateOrderBooks(false); // we get it through the WebSocket connection

      // does this fix the UI stuck problem?
      // actually seems to work. we get http errors "socket hang up" and websocket errors "closed for unknown reason"
      // but after this reconnect the UI is responsive again
      // maybe we should reconnect immediately after we get "socket hang up" ?
      // cause was orderBook.removeOrder() bevore setting orderbook snapshot
      /*
            setTimeout(() => {
                this.closeConnection(utils.sprintf("Resetting %s websocket connection", this.className))
            }, 15*utils.constants.MINUTE_IN_SECONDS*1000)
            */
    };

    conn.onmessage = (e) => {
      //this.resetWebsocketTimeout(); // timeouts don't work properly for this socket // moved down. sometimes polo sends messages, but no trades
      try {
        if (typeof e.data !== "string")
          throw new Error("Received data with invalid type " + typeof e.data);
        const msg = JSON.parse(e.data);
        switch (msg[0]) {
          case 1000: // subscription with userID: 10201228
            break;
          case 1001: // trollbox
            /**
                         * [ 1001,
                         18201544,
                         'sd8f97hgsd',
                         'Mirai, ok thank you, that&#39;s a pretty big delay considering what I have in limbo :/. It&#39;s scary',
                         0 ]
                         */
            break;
          case 1002: // market updates, ticker
            /**
                         * [ 1002,
                         null,
                         [ 168,
                         '0.00042601',
                         '0.00042601',
                         '0.00042586',
                         '-0.01773115',
                         '777.97267610',
                         '1799875.24250461',
                         0,
                         '0.00044891',
                         '0.00041202' ] ]
                         */
            let ticker;
            try {
              ticker = msg[2];
              if (!ticker)
                // first msg is undefined
                return;
              //console.log(msg[2]);
              ticker[0] = markets.byID[ticker[0]].currencyPair; // happens when poloniex adds a new currency (update HTML vars on top)
              ticker = this.currencies.toLocalTicker(ticker);
              if (ticker)
                this.ticker.set(ticker.currencyPair.toString(), ticker);
            } catch (err) {
              logger.error(
                "Error parsing %s ticker, likely missing ID in markets %s",
                this.className,
                ticker[0],
                err
              );
            }
            break;
          case 1003: // some price ticker for main exchange currencies
            //console.log(msg);
            /**
                         * [ 1003, 1 ]
                         *
                         * [ 1003,
                         null,
                         [ '2017-05-30 17:03',
                         44393,
                         { BTC: '202376.300',
                           ETH: '27400.169',
                           XMR: '10914.608',
                           USDT: '90195453.425' } ] ]
                         */
            break;
          case 1004: // ping? [ 1004, 1 ]
            break;
          case 1010: // keep alive ping? [1010]
            break;
          default:
            //console.log(msg);
            try {
              let currencyID = msg[0];
              let market = markets.byID[currencyID];
              if (!market) {
                logger.error(
                  "Received %s market update for unknown currency pair",
                  this.className,
                  msg
                );
                return;
              }
              msg[0] = market.currencyPair; // exchange name pair
              //console.log(msg);
              let marketEventStream = marketEventStreamMap.get(msg[0]);
              if (!marketEventStream) {
                logger.error(
                  "Received %s market update for currency pair %s we didn't subscribe to",
                  this.className,
                  msg[0]
                );
                return;
              }
              this.resetWebsocketTimeout();
              const seq = msg[1];
              marketEventStream.add(seq, msg[2]);
              /**
                             * [ 'BTC_XMR',
                             198320617,
                             [ [ 'o', 1, '0.01930001', '8.72448567' ],                              // order book modification
                             [ 't', '10797115', 0, '0.01930001', '1.10000000', 1496165968 ] ] ]     // trade
                             [ 'BTC_XMR',
                             198320618,
                             [ [ 'o', 1, '0.01912001', '86.43000000' ] ] ]
                             */
            } catch (err) {
              logger.error(
                "Error parsing %s websocket currency message",
                this.className,
                err
              );
            }
        }
      } catch (err) {
        logger.error("Error parsing %s websocket message", this.className, err);
      }
    };

    conn.onerror = (err) => {
      logger.error("WebSocket error in %s", this.className, err);
      this.closeConnection("WebSocket error");
    };

    conn.onclose = (event) => {
      let reason = "Unknown error";
      if (event && event.reason) reason = event.reason;
      this.onConnectionClose(reason);
    };
    return conn;
  }

  protected verifyTradeRequest(
    currencyPair: Currency.CurrencyPair,
    rate: number,
    amount: number,
    params: OrderParameters = {}
  ) {
    return new Promise<ExRequestParams>((resolve, reject) => {
      // TODO move more checks to parent class?
      // TODO implement params.matchBestPrice - poloniex only supports limit orders
      if (currencyPair) {
        if (this.currencies.getExchangePair(currencyPair) === undefined)
          return reject({
            txt: "Currency pair not supported by this exchange",
            exchange: this.className,
            pair: currencyPair,
            permanent: true,
          });
      }
      const minTradingValue = params.marginOrder
        ? this.minTradingValueMargin
        : this.minTradingValue;
      if (amount > 0 && rate * amount < minTradingValue)
        return reject({
          txt: "Value is below the min trading value",
          exchange: this.className,
          value: rate * amount,
          minTradingValue: minTradingValue,
          permanent: true,
        });

      let outParams: any = {
        rate: rate,
      };
      if (amount > 0) outParams.amount = amount;
      if (currencyPair)
        outParams.currencyPair = this.currencies.getExchangePair(currencyPair);
      for (let prop in params) {
        if (params[prop]) outParams[prop] = 1;
      }
      resolve(outParams);
    });
  }

  protected verifyExchangeResponse(
    body: string | false,
    response: request.RequestResponse,
    method: string
  ) {
    return new Promise<any>((resolve, reject) => {
      if (!body)
        return reject({
          txt: "Error on exchange request",
          exchange: this.className,
          method: method,
          response: response,
        });
      let json = utils.parseJson(body);
      if (!json)
        return reject({
          txt: "Received invalid JSON from exchange",
          exchange: this.className,
          method: method,
          body: body,
        });
      if (json.error) {
        // Unable to fill order completely. <- TODO reject might cause problems in app logic if we trade on multiple exchanges ?
        return reject({
          txt: "Error on exchange API call",
          exchange: this.className,
          method: method,
          error: json.error,
        });
      }
      resolve(json);
    });
  }

  protected static loadPoloniexTickers() {
    utils.getPageCode("https://poloniex.com/marginTrading", (body, res) => {
      if (body === false) {
        setTimeout(() => {
          // retry
          Poloniex.loadPoloniexTickers();
        }, 10000);
        return logger.warn("Error getting poloniex tickers", res);
      }
      let htmlMarkets = utils.text.getBetween(body, "var markets = {", ";");
      if (htmlMarkets === false)
        logger.error("Error updating poloniex markets. Not found");
      else {
        htmlMarkets = utils.parseJson("{" + htmlMarkets, true);
        if (htmlMarkets !== null) markets = htmlMarkets as any;
      }
      let htmlCurrencies = utils.text.getBetween(
        body,
        "var markets_currencies = {",
        ";"
      );
      if (htmlCurrencies === false)
        logger.error("Error updating poloniex currencies. Not found");
      else {
        htmlCurrencies = utils.parseJson("{" + htmlCurrencies, true);
        if (htmlCurrencies !== null) markets_currencies = htmlCurrencies as any;
      }
      Poloniex.laodedTickers = true;
    });
  }
}
