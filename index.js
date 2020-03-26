const request = require('request-promise');
const csv = require('csv-parser');
const fs = require('fs');
const https = require('https')
const { API_KEY } = require('./config');

const HOST_URL = 'https://api.getresponse.com/v3'
const DELETE_CONTACT_URL = '/contacts/'
let list = []

var read = fs.createReadStream('deleted.csv')
  .pipe(csv())
  .on('data', async (contact) => {
    list.push(contact)
  })
  .on('end', async () => {
    var limit = 0
    var index = 0
    function delay() {
      setTimeout(async () => {
        console.log(index)
        if (index >= list.length) {
          return
        }
        var contact = list[index]
        index ++
        // Search all contact with the email address
        var SEARCH_CONTACT_URL = `/contacts?query[email]=${contact.email}&fields=name,email,campaign`
        var response = await request.get({
          headers: {'X-Auth-Token': 'api-key ' + API_KEY},
          url:     HOST_URL + SEARCH_CONTACT_URL
        });

        limit += 1

        var searchResult = JSON.parse(response)
        // Search contactID which is in 'rgg_members' list
        for (var j = searchResult.length - 1; j >= 0; j--) {
          let element = searchResult[j]
          if (element.campaign.name == 'rgg_members') {
            // if exists, remove contact
            console.log(element)
            response = await request.delete({
              headers: {'X-Auth-Token': 'api-key ' + API_KEY},
              url:     HOST_URL + DELETE_CONTACT_URL + element.contactId
            })
            limit += 1
            console.log(element.email + ' is deleted successfully')
            break
          }
        }
        if (limit < 70) {
          limit = 0  
          delay()
        }
      }, 3000)
    }
    delay()
  })

