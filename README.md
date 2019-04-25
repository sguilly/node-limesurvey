# node-limesurvey
A limesurvey node.js client (with promise)

# Usage

<!> Do not forget to activate the LimeSurvey API first! To do this, access your global configuration, click on Interfaces and enable the API setting (JSON-RPC). <!>

More info : https://manual.limesurvey.org/RemoteControl_2_API

# Code example

``` js
var limesurvey = require('node-limesurvey')({
    url: 'https://xxxxxxxx/index.php/admin/remotecontrol',
    username: 'xxxxx',
    password: 'xxxxx'
})


var start = async() => {

    let token = await limesurvey.getToken()

    console.log('token', token)

    let surveys = await limesurvey.getSurvey()
    console.log('surveys=', surveys)

    let questions = await limesurvey.getQuestions('37436')
    console.log('questions', questions)

    let responses = await limesurvey.getResponses('37436')
    console.log('responses', responses)

}

start()
```
