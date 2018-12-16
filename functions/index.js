// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict'
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const response = require('./lib/response')
const surface = require('./lib/surface')
const permission = require('./lib/permission')
const event = require('./lib/event')
const dailyUpdate = require('./lib/dailyUpdate')
const routineUpdate = require('./lib/routineUpdate')
const config = require('./config.json')

admin.initializeApp(functions.config().firebase)

const MOCK_SERVICES = {
  line: {
    name: 'Lineman',
    restaurant: ['pizzacompany', 'mcdonald']
  },
  grab: {
    name: 'Grab',
    restaurant: ['mcdonald', 'pizzacompany']
  }
}
const MOCK_RESTAURANT = {
  pizzacompany: {
    name: 'Pizza Company',
    image: {
      url: 'https://www.bluporthuahin.com/bluport/wp-content/uploads/2017/07/G05-THE-PIZZA-COMPANY-02.jpg',
      alt: 'Pizza Company'
    },
    menus: {
      hamBacon: {
        name: 'Ham & Bacon',
        price: 250,
        img: {
          url: 'https://1112.com/images/products/pizza/mobile/Pan_Ham-%26-Bacon.png',
          alt: 'pizza'
        }
      },
      hawaiian: {
        name: 'Hawaiian',
        price: 250,
        img: {
          url: 'https://1112.com/images/products/pizza/mobile/Pan_Hawaiian.png',
          alt: 'pizza'
        }
      },
      seafoodDeluxe: {
        name: 'Seafood Deluxe',
        price: 250,
        img: {
          url: 'https://1112.com/images/products/pizza/mobile/Pan_Seafood-Deluxe.png',
          alt: 'pizza'
        }
      },
      friedChicken: {
        name: 'Fried Chicken',
        price: 50,
        img: {
          url: 'http://www.cbc.ca/inthekitchen/assets_c/2012/10/ButtermilkFriedChix16-thumb-596x350-234379.jpg',
          alt: 'fried'
        }
      }
    }
  },
  mcdonald: {
    image: {
      url: 'https://www.rd.com/wp-content/uploads/2018/01/01_macdonalds_countries-that-have-banned-mcdonald-s_678182368-editorial-ty-lim-1200x1200.jpg',
      alt: 'Mc Donald',
    },
    name: 'Mc Donald',
    menus: {
      hamburger: {
        name: 'Hamburger',
        price: 100,
        img: {
          url: 'http://www.smeleader.com/wp-content/uploads/2014/02/%E0%B9%81%E0%B8%9F%E0%B8%A3%E0%B8%99%E0%B9%84%E0%B8%8A%E0%B8%AA%E0%B9%8C-%E0%B9%81%E0%B8%AE%E0%B8%A1%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C-25-%E0%B8%9A%E0%B8%B2%E0%B8%97-%E0%B8%8A%E0%B8%B4%E0%B9%89%E0%B8%99%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AD%E0%B8%B4%E0%B9%88%E0%B8%A1-%E0%B8%81%E0%B8%B4%E0%B8%99%E0%B8%A2%E0%B8%B1%E0%B8%87-%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C.jpg',
          alt: 'Hamburger'
        }
      },
      friedChicken: {
        name: 'Fried Chicken',
        price: 50,
        img: {
          url: 'https://www.seriouseats.com/images/2012/08/20120821-219555-mcdonalds-mighty-wings-primary.jpg',
          alt: 'friedChicken'
        }
      }
    }
  },
  zaabone: {
    image: {
      url: 'https://www.w3schools.com/html/pic_trulli.jpg',
      alt: 'Zaabone'
    },
    name: 'Zaab one',
    menus: {
      friedChicken: {
        name: 'Fried Chicken',
        price: 50
      },
      friedRice: {
        name: 'Fried Rice',
        price: 45
      }
    }
  }
}

const MOCK_MENUS = {
  hamBacon: {
    name: 'Ham & Bacon',
    price: 250,
    img: {
      url: 'https://1112.com/images/products/pizza/mobile/Pan_Ham-%26-Bacon.png',
      alt: 'pizza'
    }
  },
  hawaiian: {
    name: 'Hawaiian',
    price: 250,
    img: {
      url: 'https://1112.com/images/products/pizza/mobile/Pan_Hawaiian.png',
      alt: 'pizza'
    }
  },
  seafoodDeluxe: {
    name: 'Seafood Deluxe',
    price: 250,
    img: {
      url: 'https://1112.com/images/products/pizza/mobile/Pan_Seafood-Deluxe.png',
      alt: 'pizza'
    }
  },
  hamburger: {
    name: "Hamburger",
    price: 100,
    img: {
      url: 'http://www.smeleader.com/wp-content/uploads/2014/02/%E0%B9%81%E0%B8%9F%E0%B8%A3%E0%B8%99%E0%B9%84%E0%B8%8A%E0%B8%AA%E0%B9%8C-%E0%B9%81%E0%B8%AE%E0%B8%A1%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C-25-%E0%B8%9A%E0%B8%B2%E0%B8%97-%E0%B8%8A%E0%B8%B4%E0%B9%89%E0%B8%99%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AD%E0%B8%B4%E0%B9%88%E0%B8%A1-%E0%B8%81%E0%B8%B4%E0%B8%99%E0%B8%A2%E0%B8%B1%E0%B8%87-%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C.jpg',
      alt: 'Hamburger'
    }
  },
  friedChicken: {
    name: 'Fried Chicken',
    price: 50,
    img: {
      url: 'http://www.cbc.ca/inthekitchen/assets_c/2012/10/ButtermilkFriedChix16-thumb-596x350-234379.jpg',
      alt: 'friedChicken'
    }
  }
}

const {
  dialogflow,
  Suggestions,
  List,
  Image,
  BasicCard,
  SignIn
} = require('actions-on-google')

const app = dialogflow({
  clientId: config.clientId
})

app.intent('Default Welcome Intent', welcome)
app.intent('Simple Response', response.simpleResponse)
app.intent('Basic Card', response.basicCard)
app.intent('Surface checking', surface.surfaceChecking)
app.intent('Ask for Permission', permission.askForPermission)
app.intent('Ask for Date Permission', permission.askForDatePermission)
app.intent('Ask for Sign in', permission.askForSignIn)
app.intent('This is cancel', cancel)
app.intent('Conversation with params', conversataionWithParams)
app.intent('Conversation with params - yes', conversataionWithParamsYes)
app.intent('Setup Daily update', dailyUpdate.setupDailyUpdate)
app.intent('Setup Routine', routineUpdate.setupRoutine)

// intent for listen event
app.intent('ask_for_permission_confirmation', event.confirmPermission)
app.intent('ask_for_datetime_confirmation', event.confirmDatePermission)
app.intent('ask_for_sign_in_confirmation', event.confirmSignIn)
app.intent('actions_intent_NO_INPUT', event.noInput)
app.intent('finish_update_setup', dailyUpdate.finish)
app.intent('Wela_1Start', askService)
app.intent('Wela_1Foodservice', askStore)
app.intent('Wela_1Restaurant', askTime)
app.intent('Wela_1Restaurant_click', askTimeClick)
app.intent('Wela_1Menu', orderFood)
app.intent('menu_click', orderFoodClick)
app.intent('join_order', orderFood)
app.intent('Wela_1Anythingelse', confirmOrder)
app.intent('join_anythings_else', confirmOtherOrder)
app.intent('Wela_1Time', askMenu)
app.intent('Wela_1Place', listOrder)
app.intent('Wela_1Confirm', confirm)

function conversataionWithParams (conv, params) {
  console.log(params)
  conv.ask(`Do you confirm to order ${params['number-integer']} ${params['menu']}?`)
}

function conversataionWithParamsYes(conv, params) {
  console.log(params)
  conv.ask(`I will process to order now`)
}

function welcome(conv) {
  conv.ask('Start order your food?')

  conv.ask(`Before using this app, authentication is needed. Please perform a Sign-in`)
  conv.ask(new SignIn("To personalise, "))
  // Save to user storage
  conv.user.storage.count = 1
  // Save to conversation storage
  conv.data.count = 1
  conv.ask(new Suggestions(['I\'m hungry']))
}

function cancel(conv, param) {
  conv.ask('This is cancel')
}

function askService(conv) {
  const services = Object.values(MOCK_SERVICES)
  conv.ask(`Do you want to order your food via Lineman or Grab?`)
  conv.ask(new Suggestions(services.map((service) => service.name)))
}

function askStore(conv, param) {
  const service = param['foodservices']
  conv.data.service = service
  const restaurants = MOCK_SERVICES[service].restaurant
  conv.ask(`You choose ${service}. Which restaurant do you want to order`)
  conv.ask(new List({
    title: 'Restaurant List',
    items: restaurants.reduce((acc, restaurant) => ({
      // Add the first item to the list
      ...acc,
      [restaurant]: {
        synonyms: [],
        title: MOCK_RESTAURANT[restaurant].name,
        description: MOCK_RESTAURANT[restaurant].description,
        image: new Image(MOCK_RESTAURANT[restaurant].image)
      }
    }), {})
  }))
  conv.ask(new Suggestions(restaurants.map((restaurant) => (MOCK_RESTAURANT[restaurant].name))))
}

function askTime(conv, param) {
  const restaurant = param['restaurant']
  conv.data.restaurant = restaurant
  const restaurantData = MOCK_RESTAURANT[restaurant]
  conv.ask(`Confirm ${restaurantData.name}. When do you want to order?`)
  conv.ask(new Suggestions(['10am', '11am', '1pm']))
}

function askTimeClick(conv, param, option) {
  const restaurant = option
  conv.data.restaurant = restaurant
  const restaurantData = MOCK_RESTAURANT[restaurant]
  conv.ask(`Confirm ${restaurantData.name}. When do you want to order?`)
  conv.ask(new Suggestions(['10am', '11am', '1pm']))
}

function askMenu(conv, param) {
  console.log(param)
  conv.data.time = param['time']
  const restaurant = conv.data.restaurant
  const restaurantData = MOCK_RESTAURANT[restaurant]
  const menus = restaurantData.menus
  conv.ask('Confirm, I will order it for you at ' + new Date(conv.data.time).toLocaleString('en-US', { hour: 'numeric', hour12: true }) + ' So, what do you want to eat?')
  const menuList = new List({ title: 'Menu', items: Object.keys(menus).reduce((acc, menuKey) => ({
      // Add the first item to the list
      ...acc,
      [menuKey]: {
        synonyms: [],
        title: menus[menuKey].name,
        description: `price: ${menus[menuKey].price}`,
        image: new Image(menus[menuKey].img)
      }
  }), {}) })
  conv.ask(menuList)
  // conv.ask(new Suggestions(Object.values(menus).map((menu) => ('1 ' + menu.name))))
  // TODO: show menu list
}

function orderFood(conv, params) {
  const { menu, number } = params
  conv.data.menu = menu
  conv.data.qty = number
  conv.ask(`Order ${params.number} ${MOCK_MENUS[params.menu].name}, OK, anything else?`)
  conv.ask(new Suggestions(['No']))
}

function orderFoodClick(conv, param, option) {
  conv.data.menu = option
  conv.data.qty = 1
  conv.ask(`Order 1 ${MOCK_MENUS[option].name}, anything else?`)
  conv.ask(new Suggestions(['No']))
}

async function confirmOrder(conv) {
  const { menu, qty } = conv.data
  const snapshot = await admin.database().ref('items').child('order1').once('value')
  admin.database().ref('items/order1/').set({ ...snapshot.val(), [menu]: qty })
  conv.ask('OK, where do you want to pick your food up?')
  conv.ask(new Suggestions(['AIS DC', 'Home', 'Work']))
}

async function confirmOtherOrder(conv) {
  const { menu, qty } = conv.data
  const snapshot = await admin.database().ref('items').child('order1').once('value')
  admin.database().ref('items/order1/').set({ ...snapshot.val(), [menu]: qty })
  conv.close('wait a moment...')
  const newSnapshot = await admin.database().ref('items').child('order1').once('value')
  const orders = newSnapshot.val()

  let total = 0
  const items = Object.keys(orders).reduce((acc, menu) => {
    total += MOCK_MENUS[menu].price*orders[menu]
    return ({
      ...acc,
      [menu]: {
        synonyms: [],
        title: menu,
        description: `${MOCK_MENUS[menu].price} x${orders[menu]}`,
        image: new Image(MOCK_MENUS[menu].img)
      }
    })
  }, {})
  items.summary = {
    synonyms: [],
    title: 'Total Price',
    description: `฿${total}`
  }
  conv.close(new List({
    title: 'Order Summary',
    items
  }))
}

async function listOrder(conv, params) {
  const orderRef = admin.database().ref('items')
  conv.ask('wait a moment...')
  const snapshot = await orderRef.child('order1').once('value')
  const orders = snapshot.val()

  let total = 0
  const items = Object.keys(orders).reduce((acc, menu) => {
    total += MOCK_MENUS[menu].price*orders[menu]
    return ({
      ...acc,
      [menu]: {
        synonyms: [],
        title: MOCK_MENUS[menu].name,
        description: `฿${MOCK_MENUS[menu].price} x ${orders[menu]}`,
        image: new Image(MOCK_MENUS[menu].img)
      }
    })
  }, {})
  items.summary = {
    synonyms: [],
    title: 'Total Price',
    description: `฿${total}`
  }
  conv.ask(`OK. Total amount for your order is ${total} baht. Please confirm your order.`)
  conv.ask(new List({
    title: 'Order Summary',
    items
  }))
}

function confirm (conv) {
  admin.database().ref('items').child('order1').set({})
  conv.close('Thank you')
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)
