require('dotenv').config()
const fetch = require('node-fetch').default;
const url = 'https://app.orbit.love/api/v1/orbit/activities'
const parseParams = (querystring) => {

  // parse query string
  const params = new URLSearchParams(querystring);

  const obj = {};

  // iterate over all keys
  for (const key of params.keys()) {
      if (params.getAll(key).length > 1) {
          obj[key] = params.getAll(key);
      } else {
          obj[key] = params.get(key);
      }
  }

  return obj;
};


// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const handler = async (event) => {
  const today = new Date()
  const yesterday = new Date(today)

  yesterday.setDate(yesterday.getDate() - 1)
  console.log(yesterday)
  try {
    const subject = event.queryStringParameters.name || 'World'
    console.log(event)
    // get post body
    const {email,date, activityType, activityProperties} = JSON.parse(event.body);
    const emailArray = email.split(',');
    const propArray = activityProperties.split(',');
    const propTuples = propArray.map(propString =>  propString.split(':').map(value => value.trim()));
    const propObj = Object.fromEntries(propTuples)
    console.log(propObj)

    const fetchBodies = emailArray.map(email => {
      return {
        activity: {
            title: 'Attended Conversational Education',
            activity_type_key: activityType,
            properties: propObj,
            occurred_at: date,
        },
        identity: {
          email: email,
          source: 'email'
        }
      } 
    })
    console.log(fetchBodies)
    const responses = await Promise.all(fetchBodies.map(body => {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ORBIT_API_KEY}`
        },
        body: JSON.stringify(body)
      })
    })
    )
    console.log(responses)
    return {
      statusCode: 200,
      body: JSON.stringify({message: "totally worked", responses}),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }
