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
    restaurant: ['pizzacompany', 'mcdonald', 'zaabone']
  },
  grab: {
    name: 'Grab',
    restaurant: ['mcdonald', 'pratunam']
  }
}
const MOCK_RESTAURANT = {
  pizzacompany: {
    name: 'Pizza Company',
    image: {
      url: 'https://www.w3schools.com/html/pic_trulli.jpg',
      alt: 'Pizza Company'
    },
    menus: {
      pizza: {
        name: 'Pizza',
        price: 200
      },
      friedChicken: {
        name: 'Fried Chicken',
        price: 80
      }
    }
  },
  mcdonald: {
    image: {
      url: 'https://www.w3schools.com/html/pic_trulli.jpg',
      alt: 'Pizza Company'
    },
    name: 'mc',
    menus: {
      hamburger: {
        name: 'Hamburger',
        price: 100
      },
      friedChicken: {
        name: 'Fried Chicken',
        price: 50
      }
    }
  },
  pratunam: {
    image: {
      url: 'https://www.w3schools.com/html/pic_trulli.jpg',
      alt: 'Pizza Company'
    },
    name: 'Pratunam',
    menus: {
      friedRice: {
        name: 'Fried Rice',
        price: 45
      },
      noodles: {
        name: 'Noodles',
        price: 40
      }
    }
  },
  zaabone: {
    image: {
      url: 'https://www.w3schools.com/html/pic_trulli.jpg',
      alt: 'Pizza Company'
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

const {
  dialogflow,
  Suggestions,
  List,
  Image,
  BasicCard
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
app.intent('Wela_1Menu', orderFood)
app.intent('Wela_1Anythingelse', confirmOrder)
app.intent('Wela_1Time', askMenu)
app.intent('Wela_1Confirm', listOrder)

function conversataionWithParams(conv, params) {
  console.log(params)
  conv.ask(`Do you confirm to order ${params['number-integer']} ${params['menu']}?`)
}

function conversataionWithParamsYes(conv, params) {
  console.log(params)
  conv.ask(`I will process to order now`)
}

function welcome(conv) {
  conv.ask('Start order your food?')
  conv.ask(new Suggestions(['I\'m hungry']))

  // Save to user storage
  conv.user.storage.count = 1
  // Save to conversation storage
  conv.data.count = 1
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
    title: 'List Title',
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

function askMenu(conv, param) {
  console.log(param)
  conv.data.time = param['time']
  const restaurant = conv.data.restaurant
  const restaurantData = MOCK_RESTAURANT[restaurant]
  const menus = restaurantData.menus
  conv.ask('Confirm, I will order it for you at ' + new Date(conv.data.time).toLocaleString('en-US', { hour: 'numeric', hour12: true }) + ' So, what do you want to eat?')
  conv.ask(new Suggestions(Object.values(menus).map((menu) => ('1 ' + menu.name))))
  // TODO: show menu list
}

function orderSummary(conv, params) {
  conv.ask('Order Summary')
  conv.ask(new List({
    title: conv.data.restaurant,
    items: {
      'hamburger': {
        synonyms: [],
        title: 'hamburger',
        description: 'x1 - ฿200',
        image: new Image({
          url: 'http://www.smeleader.com/wp-content/uploads/2014/02/%E0%B9%81%E0%B8%9F%E0%B8%A3%E0%B8%99%E0%B9%84%E0%B8%8A%E0%B8%AA%E0%B9%8C-%E0%B9%81%E0%B8%AE%E0%B8%A1%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C-25-%E0%B8%9A%E0%B8%B2%E0%B8%97-%E0%B8%8A%E0%B8%B4%E0%B9%89%E0%B8%99%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AD%E0%B8%B4%E0%B9%88%E0%B8%A1-%E0%B8%81%E0%B8%B4%E0%B8%99%E0%B8%A2%E0%B8%B1%E0%B8%87-%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C.jpg',
          alt: 'Hamburger'
        })
      },
      'summary': {
        synonyms: [],
        title: 'Total Price',
        description: '฿200'
      }
    }
  }))
}

function orderFood(conv, params) {
  const { menu, number } = params
  conv.data.menu = menu
  conv.data.qty = number
  conv.ask(`Do you confirm to order ${params.number} ${params.menu}, OK, anything else?`)
  conv.ask(new Suggestions(['No']))
}

function confirmOrder(conv) {
  const { menu, qty } = conv.data
  // const { user = 'user1' } = conv console.log(conv.user)
  const user = 'user1'
  admin.database().ref('items/order1/').set({ [menu]: qty })
  conv.ask('OK, where do you want to pick your food up?')
  conv.ask(new Suggestions(['AIS DC', 'Home', 'Work']))
}

async function listOrder(conv, params) {
  const orderRef = admin.database().ref('items')
  conv.ask('wait a moment...')
  const snapshot = await orderRef.child('order1').once('value')
  const orders = snapshot.val()

  const price = {
    hamburger: 100,
  }
  const items = Object.keys(orders).reduce((acc, menu) => ({
    ...acc,
    [menu]: {
      synonyms: [],
      title: menu,
      description: `x${orders[menu]} - ฿${price[menu]*orders[menu]}`,
      image: new Image({
        url: 'http://www.smeleader.com/wp-content/uploads/2014/02/%E0%B9%81%E0%B8%9F%E0%B8%A3%E0%B8%99%E0%B9%84%E0%B8%8A%E0%B8%AA%E0%B9%8C-%E0%B9%81%E0%B8%AE%E0%B8%A1%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C-25-%E0%B8%9A%E0%B8%B2%E0%B8%97-%E0%B8%8A%E0%B8%B4%E0%B9%89%E0%B8%99%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AD%E0%B8%B4%E0%B9%88%E0%B8%A1-%E0%B8%81%E0%B8%B4%E0%B8%99%E0%B8%A2%E0%B8%B1%E0%B8%87-%E0%B9%80%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C.jpg',
        alt: 'Hamburger'
      })
    }
  }), {})
  items.summary = {
    synonyms: [],
    title: 'Total Price',
    description: '฿200'
  }
  conv.close(new List({
    title: 'Order',
    items
  }))
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)
