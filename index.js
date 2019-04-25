'use strict';

const fetch = require('node-fetch');

class client {

    constructor(opts) {

        this.opts = opts

        this.limesurveyUrl = opts.url

        this.username = opts.username
        this.password = opts.password

    }

    callApi(method, params) {

        return new Promise((resolve, reject) => {

            fetch(this.limesurveyUrl, {
                    method: 'post',
                    body: JSON.stringify({ method: method, params: params, id: 1 }),
                    headers: { 'Content-Type': 'application/json' },
                })
                .then(res => res.json())
                .then(json => {

                    console.log(json)

                    if (json && json.result) {
                        resolve(json.result)
                    } else {
                        reject(new Error('no token'))
                    }
                })
                .catch((error) => {
                    reject(new Error(err))
                })


        })

    }

    getToken() {
        return this.callApi('get_session_key', [this.username, this.password]).then((token) => { this.token = token })
    }

    getSurvey() {
        return this.callApi('list_surveys', [this.token, null])
    }

    getQuestions(surveyId) {
        return this.callApi('list_questions', [this.token, surveyId])
    }

    async getResponses(surveyId) {
        var json = await this.callApi('export_responses', [this.token, surveyId, 'json'])

        let obj = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'))

        return obj.responses
    }
}

module.exports = (opts) => {

    var instance

    if (!instance) {
        instance = new client(opts);
    }

    return instance
};