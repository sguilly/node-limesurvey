# node-limesurvey
A limesurvey node.js client (with promise)

# Usage

<!> Do not forget to activate the LimeSurvey API first! To do this, access your global configuration, click on Interfaces and enable the API setting (JSON-RPC). <!>

More info : https://manual.limesurvey.org/RemoteControl_2_API

# Code example

``` js
var fs = require('fs')

var limesurvey = require('node-limesurvey')({
    url: 'https://xxxxxxxx/index.php/admin/remotecontrol',
    username: 'xxxxx',
    password: 'xxxxx'
})


var start = async() => {

    // NOT MANDATORY - LIB AUTO (RE)GENERATE TOKEN IF NEEDED
    // let token = await limesurvey.getToken()
    // console.log('token', token)

    let surveys = await limesurvey.getSurveyList()
    console.log('surveys=', surveys)

    let survey = await limesurvey.getSurveyInfo('37436')
    console.log('survey=', survey)

    let questions = await limesurvey.getQuestions('37436')
    console.log('questions', questions)

    let groups = await limesurvey.getGroups('37436')
    console.log('groups', groups)

    let responses1 = await limesurvey.getResponsesBySurveyId('37436')
    console.log(responses1)

    let responses2 = await limesurvey.getResponsesByToken('37436', 'nKSAOM6JBYBDs2Q')
    console.log(responses2)

    let prettyResponses = await limesurvey.getPrettyResponses('37436')
    console.log(JSON.stringify(prettyResponses, null, 3))

    let content = await limesurvey.getStatistics('37436', 'xls')
    // fs.writeFile('/docs/stat.xls', content)

}

start()
```

# Debug

This lib use https://www.npmjs.com/package/debug

DEBUG=* node example.js
DEBUG=limesurvey node example.js