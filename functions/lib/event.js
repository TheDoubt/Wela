const {Suggestions } = require('actions-on-google')
exports.confirmPermission = (conv, _, confirmationGranted) => {
  let confirm = confirmationGranted ? "Granted" : "Denied";
  conv.ask(conv.user.name.display + " was " + confirm);
};

exports.confirmDatePermission = (conv, _, confirmationGranted) => {
  if (confirmationGranted) {
    conv.ask("Alright, date set.");
  } else {
    conv.ask(`I'm having a hard time finding an appointment`);
  }
};

exports.confirmSignIn = (conv, _, signin) => {
  if (signin.status === "OK") {
    const payload = conv.user.profile.payload;
    conv.ask(
      `I got your account details, ${
        payload.name
      }. What would you like to do next?`
    );
    conv.ask(new Suggestions(["Order food"]));
  } else {
    conv.ask(new Suggestions(["Ask for Sign in"]));
    conv.ask(
      `I won't be able to save your data.Coud you please give another attempt?`
    );
  }
};

exports.noInput = conv => {
  const repromptCount = parseInt(conv.arguments.get("REPROMPT_COUNT"));
  if (repromptCount === 0) {
    conv.ask(`What was that?`);
  } else if (repromptCount === 1) {
    conv.ask(`Sorry I didn't catch that. Could you repeat yourself?`);
  } else if (conv.arguments.get("IS_FINAL_REPROMPT")) {
    conv.close(`Okay let's try this again later.`);
  }
};
