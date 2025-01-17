const should = require('should')
const setup = require('../setup')

describe('Storage API', function () {
    let app
    let tokens
    let project
    beforeEach(async function () {
        app = await setup()
        project = app.project
        tokens = await project.refreshAuthTokens()

        await app.db.models.StorageFlow.create({
            flow: JSON.stringify([]),
            ProjectId: project.id
        })
        await app.db.models.StorageCredentials.create({
            credentials: JSON.stringify({}),
            ProjectId: project.id
        })
        await app.db.models.StorageSettings.create({
            settings: JSON.stringify({}),
            ProjectId: project.id
        })
        await app.db.models.StorageSession.create({
            sessions: JSON.stringify({}),
            ProjectId: project.id
        })
    })

    afterEach(async function () {
        await app.close()
    })
    it('Rejects bad token', async function () {
        const settingsURL = `/api/v1/projects/${app.project.id}/settings`
        const response = await app.inject({
            method: 'GET',
            url: settingsURL,
            headers: {
                authorization: 'Bearer 123'
            }
        })
        response.statusCode.should.equal(401)
    })
    it('Rejects missing token', async function () {
        const settingsURL = `/api/v1/projects/${app.project.id}/settings`
        const response = await app.inject({
            method: 'GET',
            url: settingsURL
        })
        response.statusCode.should.equal(401)
    })
    it('Rejects invalid project', async function () {
        const settingsURL = '/api/v1/projects/123/settings'
        const response = await app.inject({
            method: 'GET',
            url: settingsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        response.statusCode.should.equal(404)
    })
    it('Get Settings', async function () {
        const settingsURL = `/api/v1/projects/${app.project.id}/settings`
        const response = await app.inject({
            method: 'GET',
            url: settingsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const newSettings = response.json()
        should(newSettings).have.property('storageURL')
        should(newSettings).have.property('forgeURL')
    })

    it('Save Flow', async function () {
        const newFlow = [{ id: '1', type: 'tab', label: 'tab1', disabled: false, info: '' }]
        const flowURL = `/storage/${project.id}/flows`
        await app.inject({
            method: 'POST',
            url: flowURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            },
            payload: newFlow
        })
        const response = await app.inject({
            method: 'GET',
            url: flowURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const flow = response.json()
        should(flow).eqls(newFlow)
    })

    it('Get Credentials', async function () {
        const credsURL = `/storage/${project.id}/credentials`
        const response = await app.inject({
            method: 'GET',
            url: credsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const creds = response.json()
        should(creds).eqls({})
    })

    it('Save Credentials', async function () {
        const newCreds = [{ id: '1', type: 'tab', label: 'tab1', disabled: false, info: '' }]
        const credsURL = `/storage/${project.id}/credentials`
        await app.inject({
            method: 'POST',
            url: credsURL,
            payload: newCreds,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const response = await app.inject({
            method: 'GET',
            url: credsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const creds = response.json()
        should(creds).eqls(newCreds)
    })

    it('Get Settings', async function () {
        this.timeout(10000)
        const settingsURL = `/storage/${project.id}/settings`
        const response = await app.inject({
            method: 'GET',
            url: settingsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const settings = response.json()
        should(settings).eqls({})
    })

    it('Save Settings', async function () {
        const newSettings = [{ id: '1', type: 'tab', label: 'tab1', disabled: false, info: '' }]
        const settingsURL = `/storage/${project.id}/settings`
        await app.inject({
            method: 'POST',
            url: settingsURL,
            payload: newSettings,
            responseType: 'json',
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const response = await app.inject({
            method: 'GET',
            url: settingsURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const creds = response.json()
        should(creds).eqls(newSettings)
    })

    it('Get Sessions', async function () {
        this.timeout(10000)
        const sessionURL = `/storage/${project.id}/sessions`
        const response = await app.inject({
            method: 'GET',
            url: sessionURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const sessions = response.json()
        should(sessions).eqls({})
    })

    it('Save Sessions', async function () {
        const newSessions = [{ id: '1', type: 'tab', label: 'tab1', disabled: false, info: '' }]
        const sessionURL = `/storage/${project.id}/sessions`
        await app.inject({
            method: 'POST',
            url: sessionURL,
            payload: newSessions,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const response = await app.inject({
            method: 'GET',
            url: sessionURL,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const sessions = response.json()
        should(sessions).eqls(newSessions)
    })

    it('Add to Library', async function () {
        this.timeout(10000)
        const funcText = '\nreturn msg;'
        const libraryURL = `/storage/${project.id}/library/functions`
        await app.inject({
            method: 'POST',
            url: libraryURL,
            payload: {
                name: 'test',
                meta: {},
                body: funcText
            },
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const response = await app.inject({
            method: 'GET',
            url: `${libraryURL}?name=test`,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const libraryEntry = response.payload
        should(libraryEntry).equal('\nreturn msg;')
    })

    it('Add to Library with path', async function () {
        const funcText = '\nreturn msg;'
        const libraryURL = `/storage/${project.id}/library/functions`
        await app.inject({
            method: 'POST',
            url: libraryURL,
            payload: {
                name: 'test/foo/bar',
                meta: {},
                body: funcText
            },
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const response = await app.inject({
            method: 'GET',
            url: `${libraryURL}?name=test`,
            headers: {
                authorization: `Bearer ${tokens.token}`
            }
        })
        const libraryEntry = response.json()
        should(libraryEntry).containDeep(['foo'])
    })
})
