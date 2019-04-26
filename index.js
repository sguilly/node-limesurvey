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

        console.log('params=', params)

        return new Promise((resolve, reject) => {

            fetch(this.limesurveyUrl, {
                    method: 'post',
                    body: JSON.stringify({ method: method, params: params, id: 1 }),
                    headers: { 'Content-Type': 'application/json' },
                })
                .then((res) => {

                    console.log('res=', res.ok)
                    return res.json()
                })
                .then(json => {
                    console.log('json=', json)

                    if (json && json.result) {
                        resolve(json.result)
                    } else {
                        reject(new Error('no token'))
                    }
                })
                .catch((error) => {
                    reject(new Error(error))
                })
        })
    }

    getToken() {
        return this.callApi('get_session_key', [this.username, this.password]).then((token) => { this.token = token })
    }

    getSurvey() {
        return this.callApi('list_surveys', [this.token, null])
    }

    getGroups(surveyId) {
        return this.callApi('list_groups', [this.token, surveyId])
    }

    getQuestions(surveyId, groupId) {

        let params = [this.token, surveyId]

        if (groupId) {
            params.push(groupId)
        }
        return this.callApi('list_questions', params)
    }

    async getResponses(surveyId) {
        var json = await this.callApi('export_responses', [this.token, surveyId, 'json', null, 'all', 'code', 'long'])

        let obj = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'))

        return obj.responses
    }

    activateTokens(surveyId) {
        return this.callApi('activate_tokens', [this.token, surveyId])
    }

    addParticipants(surveyId, participants) {
        return this.callApi('add_participants', [this.token, surveyId, participants])
    }

    async getPrettyResponses(surveyId) {

        let groups = await this.getGroups(surveyId)

        let groupsByGid = {}

        for (let group of groups) {
            groupsByGid[group.gid] = group
        }
        //console.log('groupsByGid', groupsByGid)

        let questions = await this.getQuestions(surveyId)


        var titleByQid = {}
        var questionsByCode = {}
        for (let question of questions) {
            titleByQid[question.qid] = question.title

            if (question.parent_qid !== '0') {
                question.title = titleByQid[question.parent_qid] + '[' + question.title + ']'
            }

            questionsByCode[question.title] = question
        }

        console.log('questionsByCode', questionsByCode)

        let reponses = await this.getResponses(surveyId)

        var prettyResponses = []

        for (let response of reponses) {

            var prettyResponse = []
            let keys = Object.keys(response)
            for (let index of keys) {

                let codes = Object.keys(response[index])

                for (let code of codes) {

                    let question = questionsByCode[code]
                    if (question) {
                        //console.log(code, question.question, response[index][code])

                        let group = groupsByGid[question.gid]

                        //console.log(group)

                        prettyResponse.push({ code: code, qid: question.qid, groupOrder: group.group_order, groupName: group.group_name, order: question.question_order, question: question.question, value: response[index][code], question: question })
                    }
                }
            }

            prettyResponse.sort((a, b) => {

                if (a.groupOrder === b.groupOrder) {

                    if (a.qid === b.qid) {
                        return Number(a.order) - Number(b.order)
                    } else {
                        return Number(a.qid) - Number(b.qid)
                    }

                } else {
                    return Number(a.groupOrder) - Number(b.groupOrder)
                }

            })



            prettyResponses.push(prettyResponse)

        }

        return prettyResponses
    }
}

module.exports = (opts) => {

    var instance

    if (!instance) {
        instance = new client(opts);
    }

    return instance
};