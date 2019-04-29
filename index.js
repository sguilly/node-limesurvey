'use strict';
const debug = require('debug')('limesurvey')

const fetch = require('node-fetch');

class client {

    constructor(opts) {

        this.opts = opts

        this.limesurveyUrl = opts.url

        this.username = opts.username
        this.password = opts.password

    }

    callApi(method, params) {

        return new Promise(async(resolve, reject) => {

            if (method !== 'get_session_key') {

                let token = await this.getToken()

                params.unshift(token)
            }

            debug('---------------')

            debug('method=', method)
            debug('params=', params)

            fetch(this.limesurveyUrl, {
                    method: 'post',
                    body: JSON.stringify({ method: method, params: params, id: 1 }),
                    headers: { 'Content-Type': 'application/json' },
                })
                .then((res) => {

                    debug('res=', res.ok)
                    return res.json()
                })
                .then(json => {
                    debug('json=', json)

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

    async getToken() {

        if (this.token && this.regenerateAfter && new Date().getTime() < this.regenerateAfter) {

            debug('from cache')
            return this.token
        } else {

            debug('ask new token')
            this.token = await this.callApi('get_session_key', [this.username, this.password])
            this.regenerateAfter = new Date().getTime() + (2 * 60 * 60 * 1000)

            return this.token
        }



    }

    getSurveyList() {
        return this.callApi('list_surveys', [null])
    }

    getSurveyInfo(surveyId) {
        return this.callApi('get_survey_properties', [surveyId])
    }

    getGroups(surveyId) {
        return this.callApi('list_groups', [surveyId])
    }

    getQuestions(surveyId, groupId) {

        let params = [surveyId]

        if (groupId) {
            params.push(groupId)
        }
        return this.callApi('list_questions', params)
    }

    async getResponsesBySurveyId(surveyId) {
        var json = await this.callApi('export_responses', [surveyId, 'json', null, 'all', 'code', 'long'])

        let obj = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'))

        return obj.responses
    }

    async getResponsesByToken(surveyId, tokenId) {
        var json = await this.callApi('export_responses_by_token', [surveyId, 'json', tokenId, null, 'all', 'code', 'long'])

        let obj = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'))
        return obj.responses
    }

    async getStatistics(surveyId, format) {
        var fileContent = await this.callApi('export_statistics', [surveyId, format, null, 'yes'])

        let obj = Buffer.from(fileContent, 'base64')

        return obj
    }

    activateTokens(surveyId) {
        return this.callApi('activate_tokens', [surveyId])
    }

    addParticipants(surveyId, participants) {
        return this.callApi('add_participants', [surveyId, participants])
    }

    async getPrettyResponses(surveyId, tokenId) {

        let groups = await this.getGroups(surveyId)

        let groupsByGid = {}

        for (let group of groups) {
            groupsByGid[group.gid] = group
        }
        //debug('groupsByGid', groupsByGid)

        let questions = await this.getQuestions(surveyId, tokenId)


        var titleByQid = {}
        var questionsByCode = {}
        for (let question of questions) {
            titleByQid[question.qid] = question.title

            if (question.parent_qid !== '0') {
                question.title = titleByQid[question.parent_qid] + '[' + question.title + ']'
            }

            questionsByCode[question.title] = question
        }

        debug('questionsByCode', questionsByCode)

        let reponses = await this.getResponsesBySurveyId(surveyId)

        var prettyResponses = []

        for (let response of reponses) {

            var prettyResponse = []
            let keys = Object.keys(response)
            for (let index of keys) {

                let codes = Object.keys(response[index])

                for (let code of codes) {

                    let question = questionsByCode[code]
                    if (question) {
                        //debug(code, question.question, response[index][code])

                        let group = groupsByGid[question.gid]

                        //debug(group)

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